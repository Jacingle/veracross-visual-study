import { describe, expect, it } from "vitest";
import { buildSection, nextClassId } from "./class-create";
import type { CourseDef, Section } from "./school-store";

const course: CourseDef = { id: "BIO", name: "Biology", type: "ACADEMIC", dept: "", credits: 1, description: "" };
const website: Section["website"] = { bg: "none", color: "#3a6ea5", photo: "", sections: [], pages: [] };

describe("adding a class to a course", () => {
  it("numbers the first class 1 and skips IDs already taken", () => {
    expect(nextClassId([], "BIO")).toEqual({ id: "BIO-1", section: "1" });
    // Two BIO classes exist (BIO-1 and BIO-3), so the count suggests 3, which is taken: the next free ID is BIO-4.
    expect(nextClassId([{ id: "BIO-1", courseNo: "BIO" }, { id: "BIO-3", courseNo: "BIO" }], "BIO")).toEqual({ id: "BIO-4", section: "4" });
  });
  it("builds a draft class for the chosen year and terms", () => {
    const s = buildSection(course, [], { year: "2026", website });
    expect(s).toMatchObject({ id: "BIO-1", code: "BIO-1", courseNo: "BIO", name: "Biology", section: "1", terms: ["2026-S1", "2026-S2"], published: false, teacherIds: [], studentIds: [] });
    expect(buildSection(course, [], { year: "2026", terms: "S2", website }).terms).toEqual(["2026-S2"]);
  });
  it("assigns an optional teacher and gives each class its own website copy", () => {
    const a = buildSection(course, [], { year: "2026", teacherId: "p-1", website });
    const b = buildSection(course, [a], { year: "2026", website });
    expect(a.teacherIds).toEqual(["p-1"]);
    expect(b.id).toBe("BIO-2");
    expect(b.website).not.toBe(a.website);
  });
});
