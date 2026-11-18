import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { useState } from "react";
import campus from "@/assets/campus-bg.jpg";
import { PortalShell } from "@/components/portal/PortalShell";
import { TEACHER_TIP, TODAY_EVENTS, today } from "@/lib/sis-data";
import { isoDay, useMySections, useSchool } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/teacher/")({
  head: () => pageHead("Faculty Portal", "Today's classes, events and class management tools for Cedar Ridge faculty."),
  component: TeacherHome,
});

const LINKS = [
  { label: "Gradebook", tab: "gradebook" }, { label: "Take Attendance", tab: "attendance" }, { label: "Assignments", tab: "assignments" },
  { label: "Enter Grades & Comments", tab: "grades" }, { label: "Assignment Weights", tab: "weights" }, { label: "Assignment Reports", tab: "reports" },
] as const;

function TeacherHome() {
  const { attDone } = useSchool();
  const all = useMySections();
  const [q, setQ] = useState("");
  const mine = all.filter((c) => c.status === "current").sort((a, b) => a.time.localeCompare(b.time));
  const later = all.filter((c) => c.status !== "current");
  const day = isoDay(today());
  const first = mine[0]?.id ?? all[0]?.id ?? "";
  return (
    <PortalShell portal="teacher" area="teacher">
      <div className="border-b border-vc-line px-4 py-3 text-[17px]">Home</div>
      <div className="px-3 pt-2"><img src={campus} alt="" width={1920} height={1088} className="h-[180px] w-full object-cover" /></div>
      <div className="grid grid-cols-[minmax(0,1fr)_200px] gap-6 px-3 pb-8 pt-4">
        <div>
          <h2 className="text-[19px]">Today's Classes</h2>
          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-5">
            {mine.map((c) => { const done = attDone.includes(`${c.id}|${day}`); return (
              <div key={c.id} className="border-l-2 border-vc-link pl-3.5">
                <Link to="/teacher/class/$classId" params={{ classId: c.id }} className="text-[15px] text-vc-link hover:underline"><b>{c.id}</b>: {c.name}</Link>
                <div className="text-[11px] text-muted-foreground">{c.block}: {c.time}</div>
                <Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "attendance" }} target="_blank" rel="noopener noreferrer" className={`text-[12px] ${done ? "text-vc-success" : "text-destructive"}`}>● {done ? "Attendance taken" : "Attendance"} →</Link>
              </div>); })}
            {!mine.length && <p className="col-span-2 text-[13px] text-muted-foreground">No published classes this term. Classes appear here once the school office schedules and publishes them.</p>}
          </div>
          {later.length > 0 && <div className="mt-5 text-[12px] text-muted-foreground">Other terms: {later.map((c, i) => <span key={c.id}>{i > 0 && " · "}<Link to="/teacher/class/$classId" params={{ classId: c.id }} className="text-vc-link hover:underline">{c.id}: {c.name}</Link> ({c.status})</span>)}</div>}
          <h2 className="mt-8 text-[19px]">Class Management Links</h2>
          <div className="relative mt-2"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find students, faculty or staff" className="h-9 w-full border border-vc-line pl-9 text-[14px]" /></div>
          {q && <Link to="/directories" search={{ last: q }} className="mt-1 block text-[13px] text-vc-link-strong">Search directory for “{q}” →</Link>}
          <ul className="mt-3 grid grid-cols-2 gap-y-1.5 text-[14px]">{first && LINKS.map((l) => <li key={l.label}><Link to="/teacher/class/$classId" params={{ classId: first }} search={{ tab: l.tab }} className="text-vc-link hover:underline">{l.label}</Link></li>)}</ul>
        </div>
        <aside>
          <h2 className="text-center text-[19px]">Today's Events</h2>
          <div className="mt-1 border-t border-vc-line pt-1 text-center"><div className="text-[11px] text-muted-foreground">{format(today(), "EEEE")}</div><div className="text-[15px]">{format(today(), "MMM d")}</div></div>
          {TODAY_EVENTS.map((e) => (
            <div key={e.title} className="mt-3 grid grid-cols-[62px_1fr] gap-2">
              <div className="pt-3 text-right text-[15px]">{e.time} <span className="text-[10px] text-muted-foreground">{e.ampm}</span></div>
              <div><div className="text-[9px] text-vc-link">{e.kind}</div><div className="text-[14px] leading-tight">{e.title}</div></div>
            </div>))}
          <h3 className="mt-6 text-center text-[15px] font-semibold">Teacher Tip of the Week</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">{TEACHER_TIP}</p>
        </aside>
      </div>
    </PortalShell>
  );
}
