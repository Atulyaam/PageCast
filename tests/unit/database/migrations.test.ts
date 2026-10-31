import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("PostgreSQL Schema Migrations & RLS Policies (TASK-S3-02)", () => {
  const rootDir = process.cwd();
  const schemaPath = path.join(
    rootDir,
    "supabase",
    "migrations",
    "20261031000001_initial_pagecast_schema.sql"
  );
  const rlsPath = path.join(
    rootDir,
    "supabase",
    "migrations",
    "20261031000002_row_level_security.sql"
  );

  it("ensures migration files exist", () => {
    expect(fs.existsSync(schemaPath)).toBe(true);
    expect(fs.existsSync(rlsPath)).toBe(true);
  });

  describe("Schema Migration File (20261031000001)", () => {
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    it("creates all 9 essential tables", () => {
      const expectedTables = [
        "public.profiles",
        "public.sources",
        "public.source_sentences",
        "public.magazines",
        "public.pages",
        "public.page_revisions",
        "public.page_sources",
        "public.bulletin_pages",
        "public.publisher_audit_log",
      ];

      for (const table of expectedTables) {
        expect(schemaSql).toContain(`create table if not exists ${table}`);
      }
    });

    it("enforces 10,240-byte PagePack payload ceiling in database check constraint", () => {
      expect(schemaSql).toMatch(
        /payload_bytes\s+int\s+not\s+null\s+check\s*\(payload_bytes\s*<=\s*10240\)/i
      );
    });

    it("enforces page number bounds (100 to 899) in pages table", () => {
      expect(schemaSql).toMatch(
        /page_number\s+int\s+not\s+null\s+check\s*\(page_number\s*>=\s*100\s+and\s+page_number\s*<=\s*899\)/i
      );
    });

    it("enforces active published page number uniqueness", () => {
      expect(schemaSql).toMatch(
        /create\s+unique\s+index\s+if\s+not\s+exists\s+idx_pages_active_page_number/i
      );
      expect(schemaSql).toMatch(
        /on\s+public\.pages\s*\(page_number\)\s+where\s*\(status\s*=\s*'published'\)/i
      );
    });

    it("seeds all 8 Teletext magazines (1 to 8)", () => {
      expect(schemaSql).toContain("insert into public.magazines (id, title, description, icon)");
      for (let mag = 1; mag <= 8; mag++) {
        expect(schemaSql).toContain(`(${mag},`);
      }
    });
  });

  describe("Row Level Security Migration File (20261031000002)", () => {
    const rlsSql = fs.readFileSync(rlsPath, "utf-8");

    it("enables RLS on all 9 tables", () => {
      const tables = [
        "profiles",
        "sources",
        "source_sentences",
        "magazines",
        "pages",
        "page_revisions",
        "page_sources",
        "bulletin_pages",
        "publisher_audit_log",
      ];

      for (const table of tables) {
        expect(rlsSql).toMatch(
          new RegExp(
            `alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security;`,
            "i"
          )
        );
      }
    });

    it("grants public access strictly to published pages, while isolating drafts", () => {
      // Public select check
      expect(rlsSql).toContain('create policy "Public can view published pages"');
      expect(rlsSql).toContain("using (status = 'published');");

      // Publisher access
      expect(rlsSql).toContain('create policy "Publishers can view their own pages and drafts"');
      expect(rlsSql).toContain("using (auth.uid() = created_by or status = 'published');");
    });

    it("protects publisher audit logs from public access", () => {
      expect(rlsSql).not.toMatch(/create\s+policy\s+.*public.*audit_log/i);
      expect(rlsSql).toContain('create policy "Publishers can view their own audit logs"');
    });
  });
});
