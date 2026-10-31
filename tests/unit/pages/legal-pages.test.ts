import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import AboutPage from "@/app/about/page";
import PrivacyPage from "@/app/privacy/page";
import ContentPolicyPage from "@/app/content-policy/page";

describe("Public Legal & Documentation Pages (TASK-S5-10 / SEC-011, UXR-013)", () => {
  describe("AboutPage (/about)", () => {
    it("renders Kiroween 2026 Resurrection story and architecture pillars", () => {
      const html = renderToString(React.createElement(AboutPage));

      expect(html).toContain("Resurrecting Broadcast Teletext");
      expect(html).toContain("Kiroween 2026 Hackathon");
      expect(html).toContain("Resurrection Category");
      expect(html).toContain("10 KiB Payload Ceiling");
      expect(html).toContain("Factual Sentence Provenance");
      expect(html).toContain("Dual-Script Multilingual Support");
      expect(html).toContain("Optical Air-Gap");
      expect(html).toContain('href="/pages/100"');
      expect(html).toContain('href="/publisher"');
    });
  });

  describe("PrivacyPage (/privacy)", () => {
    it("renders zero-tracking policy and local-first sensor transparency", () => {
      const html = renderToString(React.createElement(PrivacyPage));

      expect(html).toContain("Zero Tracking. Local-First. Transparent.");
      expect(html).toContain("zero third-party tracking scripts");
      expect(html).toContain("PageCastOfflineDB");
      expect(html).toContain("Camera Usage");
      expect(html).toContain("never recorded, stored, or transmitted");
      expect(html).toContain('href="/pages/100"');
      expect(html).toContain('href="/about"');
    });
  });

  describe("ContentPolicyPage (/content-policy)", () => {
    it("renders editorial guidelines, non-fabrication, and human review gate", () => {
      const html = renderToString(React.createElement(ContentPolicyPage));

      expect(html).toContain("Truth in Low Bandwidth: Editorial Charter");
      expect(html).toContain("Non-Fabrication");
      expect(html).toContain("Granular Sentence-Level Attribution");
      expect(html).toContain("Mandatory Human Review Gate");
      expect(html).toContain("Harm Mitigation");
      expect(html).toContain('href="/pages/100"');
      expect(html).toContain('href="/privacy"');
    });
  });
});

