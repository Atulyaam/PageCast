import { describe, it, expect } from "vitest";
import {
  getCommunityTemplates,
  getCommunityTemplateById,
  instantiateCommunityTemplate,
} from "@/domain/templates/community-templates";

describe("Community Broadcast Kit Templates (ENH-03)", () => {
  it("provides four core community broadcast templates", () => {
    const templates = getCommunityTemplates();
    expect(templates).toHaveLength(4);

    const categories = templates.map((t) => t.category);
    expect(categories).toContain("academic");
    expect(categories).toContain("health");
    expect(categories).toContain("emergency");
    expect(categories).toContain("civic");
  });

  it("retrieves template by valid ID and handles unknown ID safely", () => {
    const academic = getCommunityTemplateById("academic-notice");
    expect(academic).toBeDefined();
    expect(academic?.recommendedPage).toBe(501);

    const unknown = getCommunityTemplateById("non-existent");
    expect(unknown).toBeUndefined();

    expect(() => instantiateCommunityTemplate("invalid-id")).toThrow(
      /Unknown community template ID/
    );
  });

  it("instantiates Academic & Campus notice in English and Hindi", () => {
    const en = instantiateCommunityTemplate("academic-notice", {}, "en");
    expect(en.title).toContain("End-Semester");
    expect(en.siteName).toBe("National Institute of Technology");
    expect(en.textContent).toContain("Exam Block B");
    expect(en.targetPageNumber).toBe(501);
    expect(en.language).toBe("en");

    const hi = instantiateCommunityTemplate("academic-notice", {}, "hi");
    expect(hi.title).toContain("सत्र-अंत");
    expect(hi.siteName).toBe("राष्ट्रीय प्रौद्योगिकी संस्थान");
    expect(hi.textContent).toContain("छात्र पहचान पत्र");
    expect(hi.targetPageNumber).toBe(501);
    expect(hi.language).toBe("hi");
  });

  it("instantiates Community Health & Clinic alert in English and Hindi", () => {
    const en = instantiateCommunityTemplate("health-clinic", {}, "en");
    expect(en.title).toContain("Measles & Rubella");
    expect(en.textContent).toContain("boil drinking water");
    expect(en.targetPageNumber).toBe(601);

    const hi = instantiateCommunityTemplate("health-clinic", {}, "hi");
    expect(hi.title).toContain("टीकाकरण");
    expect(hi.textContent).toContain("पीने का पानी");
    expect(hi.targetPageNumber).toBe(601);
  });

  it("instantiates Emergency Disaster & Weather alert with high urgency", () => {
    const en = instantiateCommunityTemplate("emergency-alert", {}, "en");
    expect(en.title).toContain("RED ALERT");
    expect(en.siteName).toContain("Disaster Management Authority");
    expect(en.textContent).toContain("90 to 110 kmph");
    expect(en.targetPageNumber).toBe(101);

    const hi = instantiateCommunityTemplate("emergency-alert", {}, "hi");
    expect(hi.title).toContain("रेड अलर्ट");
    expect(hi.targetPageNumber).toBe(101);
  });

  it("instantiates Local Civic & Municipal notice with custom field overrides", () => {
    const custom = instantiateCommunityTemplate(
      "civic-municipal",
      {
        municipality: "Ward 12 Municipal Council",
        title: "Emergency Road Repair Closure",
        duration: "Tonight 22:00 to 05:00 IST",
      },
      "en"
    );

    expect(custom.siteName).toBe("Ward 12 Municipal Council");
    expect(custom.title).toBe("Emergency Road Repair Closure");
    expect(custom.textContent).toContain("Tonight 22:00 to 05:00 IST");
    expect(custom.targetPageNumber).toBe(401);
  });
});

