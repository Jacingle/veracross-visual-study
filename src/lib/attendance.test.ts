import { describe, expect, it } from "vitest";
import { classAttendance, dailyAttendance } from "./attendance";
describe("attendance detail totals", () => {
  it("counts excused/unexcused absences and tardies; completed days default to present", () => {
    const r = classAttendance({ "c|2026-09-01|s": "Absent - Excused", "c|2026-09-02|s": "Tardy - Unexcused" }, ["c|2026-09-01", "c|2026-09-02", "c|2026-09-03"], "c", "s");
    expect([r.AE, r.AU, r.AT, r.TU, r.TE, r.TT]).toEqual([1, 0, 1, 1, 0, 1]);
    expect(r.records[2]?.status).toBe("Present");
  });
  it('restricts attendance to the selected class term', () => {
    expect(classAttendance({}, ['c|2026-09-01', 'c|2027-02-01'], 'c', 's', { start: new Date(2026, 7, 25), end: new Date(2027, 0, 16) }).records).toEqual([{ date: '2026-09-01', status: 'Present' }]);
  });
  it('counts one absent day rather than two absent classes as daily attendance', () => {
    const r = { records: [{ date: '2026-09-01', status: 'Absent - Excused' }, { date: '2026-09-02', status: 'Present' }] };
    expect(dailyAttendance([r, r])).toEqual({ AU: 0, AE: 1, AT: 1, TU: 0, TE: 0, TT: 0, days: 2, attended: 1 });
  });
});
