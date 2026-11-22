import { describe, expect, it } from "vitest";
import { DEFAULT_COURSE_TYPE, isOtherClass, normalizeCourseType, splitClasses } from "./course-types";

describe("course types", () => {
  it("defaults to Academic and upgrades retired types", () => {
    expect(DEFAULT_COURSE_TYPE).toBe("ACADEMIC");
    expect(normalizeCourseType("ARTS")).toBe("ACADEMIC");
    expect(normalizeCourseType(undefined)).toBe("ACADEMIC");
    expect(normalizeCourseType("HOMEROOM")).toBe("HOMEROOM");
  });
  it("treats advisory, group and homeroom as other classes", () => {
    expect(["ADVISORY", "GROUP", "HOMEROOM"].every(isOtherClass)).toBe(true);
    expect(["ACADEMIC", "ATHLETIC"].some(isOtherClass)).toBe(false);
  });
  it("splits classes and sorts other classes by faculty", () => {
    const last: Record<string, string> = { a: "Zed", b: "Abe" };
    const out = splitClasses([{ type: "ACADEMIC", teacherIds: ["a"] }, { type: "GROUP", teacherIds: ["a"] }, { type: "HOMEROOM", teacherIds: ["b"] }], (id) => last[id] ?? "");
    expect(out.academic).toHaveLength(1);
    expect(out.other.map((c) => c.type)).toEqual(["HOMEROOM", "GROUP"]);
  });
});
