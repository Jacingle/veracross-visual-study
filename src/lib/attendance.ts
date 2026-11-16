export const ATT_STATUSES = ["Present", "Absent - Excused", "Absent - Unexcused", "Tardy - Excused", "Tardy - Unexcused", "Not Expected", "Dismissed", "Field Trip"];

/** Per-class attendance totals for one student; days a teacher marked complete count as Present unless recorded otherwise. */
export function classAttendance(attendance: Record<string, string>, attDone: string[], classId: string, sid: string, range?: { start: Date; end: Date }) {
  const days = [...new Set(attDone.filter((k) => k.startsWith(`${classId}|`)).map((k) => k.split("|")[1] ?? ""))].filter((day) => !range || (day >= localDay(range.start) && day <= localDay(range.end))).sort();
  const records = days.map((d) => ({ date: d, status: attendance[`${classId}|${d}|${sid}`] ?? "Present" }));
  const n = (s: string[]) => records.filter((r) => s.includes(r.status)).length;
  const AU = n(["Absent - Unexcused"]), AE = n(["Absent - Excused"]), TU = n(["Tardy - Unexcused", "Tardy"]), TE = n(["Tardy - Excused"]);
  return { records, AU, AE, AT: AU + AE, TU, TE, TT: TU + TE };
}

const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Daily totals count a date once, even when several class teachers record it. */
export function dailyAttendance(rows: { records: { date: string; status: string }[] }[]) {
  const byDate = new Map<string, string[]>();
  for (const row of rows) for (const r of row.records) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r.status]);
  const count = (statuses: string[]) => [...byDate.values()].filter((values) => values.some((v) => statuses.includes(v))).length;
  const AU = count(['Absent - Unexcused']), AE = count(['Absent - Excused']);
  const TU = count(['Tardy - Unexcused', 'Tardy']), TE = count(['Tardy - Excused']);
  const AT = count(['Absent - Unexcused', 'Absent - Excused']);
  const TT = count(['Tardy - Unexcused', 'Tardy - Excused', 'Tardy']);
  return { AU, AE, AT, TU, TE, TT, days: byDate.size, attended: byDate.size - AT };
}
