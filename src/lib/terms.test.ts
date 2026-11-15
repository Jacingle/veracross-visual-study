import { describe, expect, it } from "vitest";
import { classStatus, gradingPeriods, schoolYears, termOn } from "./terms";

describe("school years and terms", () => {
  it("generates last, this and next school year", () => {
    expect(schoolYears(new Date(2026, 10, 15)).map((y) => y.label)).toEqual(["2025-26", "2026-27", "2027-28"]);
  });
  it("a Semester 2 class is future during Semester 1", () => {
    expect(classStatus(["2026-S2"], new Date(2026, 10, 15))).toBe("future");
  });
  it("a Semester 1 class is past once Semester 2 starts", () => {
    expect(classStatus(["2026-S1"], new Date(2027, 1, 2))).toBe("past");
  });
  it("a full-year class is current in Semester 1", () => {
    expect(classStatus(["2026-S1", "2026-S2"], new Date(2026, 10, 15))).toBe("current");
  });
  it("attendance date outside the class's terms has no term", () => {
    expect(termOn(["2026-S2"], new Date(2026, 10, 15))).toBeUndefined();
    expect(termOn(["2026-S1"], new Date(2026, 10, 15))?.id).toBe("2026-S1");
  });
  it("grading periods only come from the class's own terms", () => {
    expect(gradingPeriods(["2026-S2"]).map((p) => p.label)).toEqual(["Mid-Semester 2", "Semester 2"]);
  });
});
