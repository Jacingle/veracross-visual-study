export const ATT_STATUSES = ["Present", "Absent - Excused", "Absent - Unexcused", "Tardy - Excused", "Tardy - Unexcused", "Not Expected", "Dismissed", "Field Trip"];

/** Per-class attendance totals for one student; days a teacher marked complete count as Present unless recorded otherwise. */
export function classAttendance(attendance: Record<string, string>, attDone: string[], classId: string, sid: string) {
  const days = [...new Set(attDone.filter((k) => k.startsWith(`${classId}|`)).map((k) => k.split("|")[1] ?? ""))].sort();
  const records = days.map((d) => ({ date: d, status: attendance[`${classId}|${d}|${sid}`] ?? "Present" }));
  const n = (s: string[]) => records.filter((r) => s.includes(r.status)).length;
  const AU = n(["Absent - Unexcused"]), AE = n(["Absent - Excused"]), TU = n(["Tardy - Unexcused", "Tardy"]), TE = n(["Tardy - Excused"]);
  return { records, AU, AE, AT: AU + AE, TU, TE, TT: TU + TE };
}
