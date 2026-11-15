import { describe, expect, it } from "vitest";
import { classAttendance } from "./attendance";
describe("attendance detail totals", () => {
  it("counts excused/unexcused absences and tardies; completed days default to present", () => {
    const r = classAttendance({ "c|2026-09-01|s": "Absent - Excused", "c|2026-09-02|s": "Tardy - Unexcused" }, ["c|2026-09-01", "c|2026-09-02", "c|2026-09-03"], "c", "s");
    expect([r.AE, r.AU, r.AT, r.TU, r.TE, r.TT]).toEqual([1, 0, 1, 1, 0, 1]);
    expect(r.records[2]?.status).toBe("Present");
  });
});
