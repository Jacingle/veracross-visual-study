import { describe, expect, it } from "vitest";
import { HOMEPAGES, homepageById, pageHits } from "./admin-homepages";

describe("administrator homepages", () => {
  it("has an Academic Configuration homepage with numbered sections", () => {
    const h = homepageById("academic-configuration");
    expect(h?.title).toBe("Academic Configuration");
    expect(h?.sections.map((s) => s.title)[0]).toBe("1. Academic Hierarchy");
  });
  it("finds homepages and the pages listed on them", () => {
    expect(pageHits("academic conf").some((x) => x.kind === "Homepage")).toBe(true);
    const types = pageHits("assignment types");
    expect(types).toHaveLength(1);
    expect(types[0]?.kind).toBe("Page");
  });
  it("lists a page once even when several homepages link to it", () => {
    expect(pageHits("school years")).toHaveLength(1);
  });
  it("returns nothing for an empty search", () => {
    expect(pageHits("  ")).toEqual([]);
    expect(HOMEPAGES.length).toBeGreaterThan(1);
  });
});
