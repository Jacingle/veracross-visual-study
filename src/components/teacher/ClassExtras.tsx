import { Link } from "@tanstack/react-router";
import { addDays, format, isSameDay } from "date-fns";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { scoreOf } from "@/lib/gradebook";
import { useSchool, type Section } from "@/lib/school-store";
import { teacherFull, today, type Assignment, type Student } from "@/lib/sis-data";
import { termLabel } from "@/lib/terms";

const h = "px-6 pb-3 pt-5 text-[20px] font-medium";

/** Past-due assignments that still have ungraded students. */
export function ClassNotifications({ c, list, roster }: { c: Section; list: Assignment[]; roster: Student[] }) {
  const { scores } = useSchool();
  const items = list.filter((a) => a.due < today()).map((a) => ({ a, missing: roster.filter((s) => scoreOf(scores, a, s.id) === undefined).length })).filter((x) => x.missing > 0).reverse().slice(0, 12);
  return (
    <div><h2 className={h}>Notifications</h2>
      <div className="px-6 pb-6">{items.length ? items.map(({ a, missing }) => (
        <Link key={a.id} to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "assignments", aid: a.id, sub: "students" }} className="mb-2 flex items-center justify-between rounded-[6px] bg-[#f4f4f4] px-4 py-3 text-[14px] hover:bg-vc-select">
          <span><b className="font-semibold">{a.title}</b> <span className="text-vc-gray">was due {format(a.due, "MMM d")}</span></span><span className="text-destructive">{missing} ungraded</span></Link>))
        : <p className="py-10 text-center text-[14px] text-muted-foreground">You're all caught up. There are no ungraded past-due assignments.</p>}</div></div>
  );
}

/** The next month of due dates for this class. */
export function ClassCalendar({ c, list }: { c: Section; list: Assignment[] }) {
  const days = Array.from({ length: 28 }, (_, i) => addDays(today(), i));
  return (
    <div><h2 className={h}>Calendar</h2>
      <div className="grid grid-cols-7 gap-1.5 px-6 pb-6">{days.map((d) => { const due = list.filter((a) => isSameDay(a.due, d)); return (
        <div key={+d} className={`min-h-[84px] rounded-[6px] p-1.5 text-[12px] ${due.length ? "bg-vc-select" : "bg-[#f4f4f4]"}`}><div className="text-vc-gray">{format(d, "EEE MMM d")}</div>
          {due.map((a) => <Link key={a.id} to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "assignments", aid: a.id }} className="mt-1 block truncate font-semibold hover:underline">{a.title}</Link>)}</div>); })}</div></div>
  );
}

export function ClassPhotos({ roster }: { roster: Student[] }) {
  return (
    <div><h2 className={h}>Photos</h2>
      <div className="grid grid-cols-2 gap-4 px-6 pb-6 sm:grid-cols-4 lg:grid-cols-6">{roster.map((s) => (
        <div key={s.id} className="text-center"><PersonPhoto personId={s.id} className="mx-auto aspect-square w-full max-w-[120px] rounded-[8px]" /><div className="mt-1.5 text-[14px] font-semibold leading-tight">{s.first}</div><div className="text-[14px] text-vc-gray">{s.last}</div></div>))}
        {!roster.length && <p className="col-span-full py-10 text-center text-[14px] text-muted-foreground">No students are enrolled yet.</p>}</div></div>
  );
}

export function ClassSettings({ c, count }: { c: Section; count: number }) {
  const rows: [string, string][] = [["Class", `${c.id}: ${c.name}`], ["Teacher", c.teacherIds.map(teacherFull).join(", ") || "—"], ["Block", c.block || "—"], ["Room", c.room || "—"], ["Terms", c.terms.map(termLabel).join(", ")], ["Students", String(count)], ["Published to portals", c.published ? "Yes" : "No"]];
  return (
    <div><h2 className={h}>Settings</h2>
      <dl className="grid max-w-[640px] grid-cols-[170px_minmax(0,1fr)] gap-y-2 px-6 pb-4 text-[14px]">{rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-vc-gray">{k}</dt><dd>{v}</dd></div>)}</dl>
      <p className="px-6 pb-6 text-[13px] text-vc-gray">Class details are managed by an administrator. Class website options are under <Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "website" }} className="text-vc-link-strong hover:underline">Website</Link>.</p></div>
  );
}
