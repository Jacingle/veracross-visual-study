import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { BookUser, CalendarCheck, ClipboardList, Globe, IdCard, Lightbulb, MessageSquareText, Receipt, Table2 } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { NEWS, TEACHER_TIP, TODAY_EVENTS, courseTitle, sectionsFor, teacherRoster, today } from "@/lib/sis-data";
import { useSchool } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/teacher/")({
  head: () => pageHead("Faculty Portal", "Today's classes, events and class management tools for Cedar Ridge faculty."),
  component: TeacherHome,
});

function TeacherHome() {
  const { user, attDone } = useSchool();
  const mine = sectionsFor(user?.personId || "t3");
  const dow = today().getDay();
  const todays = mine.filter((c) => c.days.includes(dow)).sort((a, b) => a.time.localeCompare(b.time));
  const day = format(today(), "yyyy-MM-dd");
  return (
    <PortalShell portal="teacher" area="teacher">
      <div className="border-b border-vc-line px-4 py-3.5 text-[18px]">Faculty Home · {user?.first} {user?.last}</div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px] gap-6 px-4 pb-8 pt-4">
        <section className="min-w-0">
          <h2 className="mb-2 text-[19px]">Today's Classes</h2>
          {todays.length === 0 && <p className="border border-vc-line px-3 py-6 text-center text-[13px] text-muted-foreground">No classes meet today.</p>}
          <ul className="border-t border-vc-line">{todays.map((c) => (
            <li key={c.id} className="border-b border-vc-line py-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <Link to="/teacher/class/$classId" params={{ classId: c.id }} className="truncate text-[15px] text-vc-link-strong hover:underline">{courseTitle(c)}</Link>
                <span className="shrink-0 text-[12px] text-muted-foreground">{c.time}</span>
              </div>
              <div className="text-[12px] text-muted-foreground">{c.block} · Room {c.room} · {teacherRoster(c.id).length} students</div>
              <div className="mt-1.5 flex gap-3 text-[12px]">
                <Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "attendance" }} className={attDone.includes(`${c.id}|${day}`) ? "text-vc-success" : "text-vc-link-strong hover:underline"}>{attDone.includes(`${c.id}|${day}`) ? "✓ Attendance taken" : "Take Attendance"}</Link>
                <Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "gradebook" }} className="text-vc-link-strong hover:underline">Gradebook</Link>
                <Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "assignments" }} className="text-vc-link-strong hover:underline">Assignments</Link>
                <Link to="/class/$classId" params={{ classId: c.id }} className="text-vc-link-strong hover:underline">Website</Link>
              </div>
            </li>))}</ul>
          <h2 className="mb-2 mt-5 text-[19px]">All My Classes</h2>
          <table className="w-full text-[13px]"><tbody>{mine.map((c) => (
            <tr key={c.id} className="border-b border-vc-line"><td className="py-1.5"><Link to="/teacher/class/$classId" params={{ classId: c.id }} className="text-vc-link-strong hover:underline">{courseTitle(c)}</Link></td><td className="text-muted-foreground">{c.block}</td><td className="text-right text-muted-foreground">{teacherRoster(c.id).length}</td></tr>))}</tbody></table>
        </section>
        <section className="min-w-0">
          <h2 className="mb-2 text-[19px]">Today's Events</h2>
          <ul className="border-t border-vc-line">{TODAY_EVENTS.map((e) => (
            <li key={e.title} className="flex gap-3 border-b border-vc-line py-2.5">
              <div className="w-12 shrink-0 text-right"><div className="text-[15px] font-semibold">{e.time}</div><div className="text-[10px] text-muted-foreground">{e.ampm}</div></div>
              <div className="min-w-0"><div className="text-[10px] font-semibold tracking-wider text-muted-foreground">{e.kind}</div><div className="text-[14px] text-vc-event">{e.title}</div></div>
            </li>))}</ul>
          <h2 className="mb-2 mt-5 text-[19px]">School News</h2>
          {NEWS.map((n) => <div key={n.title} className="border-b border-vc-line py-2"><Link to="/teacher/news" className="text-[14px] text-vc-link-strong hover:underline">{n.title}</Link><div className="text-[12px] text-muted-foreground">{format(n.date, "MMM d")} · {n.body}</div></div>)}
        </section>
        <aside>
          <h2 className="mb-2 text-[19px]">Class Management</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Gradebook", icon: Table2, tab: "gradebook" as const },
              { label: "Attendance", icon: CalendarCheck, tab: "attendance" as const },
              { label: "Assignments", icon: ClipboardList, tab: "assignments" as const },
              { label: "Grades & Comments", icon: MessageSquareText, tab: "grades" as const },
            ].map(({ label, icon: Icon, tab }) => (
              <Link key={label} to="/teacher/class/$classId" params={{ classId: (todays[0] ?? mine[0])?.id ?? "143-1" }} search={{ tab }} className="flex h-[74px] flex-col items-center justify-center gap-1.5 bg-vc-tile text-center text-[13px] text-vc-link-strong hover:bg-vc-tile-hover"><Icon className="size-5" />{label}</Link>))}
            <Link to="/directories" className="flex h-[74px] flex-col items-center justify-center gap-1.5 bg-vc-tile text-[13px] text-vc-link-strong hover:bg-vc-tile-hover"><BookUser className="size-5" />Directories</Link>
            <Link to="/teacher/purchases" className="flex h-[74px] flex-col items-center justify-center gap-1.5 bg-vc-tile text-[13px] text-vc-link-strong hover:bg-vc-tile-hover"><Receipt className="size-5" />Purchase Requests</Link>
            <Link to="/class/$classId" params={{ classId: mine[0]?.id ?? "143-1" }} className="flex h-[74px] flex-col items-center justify-center gap-1.5 bg-vc-tile text-[13px] text-vc-link-strong hover:bg-vc-tile-hover"><Globe className="size-5" />Class Websites</Link>
            <Link to="/directories" search={{ type: "students" }} className="flex h-[74px] flex-col items-center justify-center gap-1.5 bg-vc-tile text-[13px] text-vc-link-strong hover:bg-vc-tile-hover"><IdCard className="size-5" />My Advisees</Link>
          </div>
          <div className="mt-4 bg-vc-note p-3 text-[13px]"><div className="mb-1 flex items-center gap-1.5 font-semibold"><Lightbulb className="size-4" /> Teacher Tip</div>{TEACHER_TIP}</div>
        </aside>
      </div>
    </PortalShell>
  );
}
