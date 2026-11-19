import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, format, isSameDay } from "date-fns";
import { BookOpen, CalendarDays, ChevronDown, ClipboardCheck, Globe, LayoutGrid, Library, Mail, Menu, MessageSquarePlus, NotebookPen, Pencil, Plus, Search, Users } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { ALL_ASSIGNMENTS, today } from "@/lib/sis-data";
import { isoDay, toAssignment, useMySections, useSchool } from "@/lib/school-store";
import { meetingsOn } from "@/lib/scheduling";
import { scheduleTime } from "@/lib/student-presentation";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/teacher/")({
  head: () => pageHead("Faculty Portal", "Today's classes, upcoming assignments and class management tools for faculty."),
  component: TeacherHome,
});

const TABS = ["My Classes", "Teams", "Programs", "Other Classes", "Future", "Completed"] as const;
const h2 = "text-[20px] font-light leading-7";
const tile = "flex h-[84px] flex-col items-center justify-center gap-1.5 bg-vc-tile text-[13px] text-vc-tile-fg hover:bg-vc-tile-hover";
const wide = "flex h-[31px] items-center justify-center gap-2 border-b-2 border-vc-tile-hover bg-vc-tile text-[13px] font-semibold text-vc-tile-fg hover:bg-vc-tile-hover";
const add = "flex h-[31px] items-center justify-center gap-2 border-b-2 border-vc-success/30 bg-vc-success/10 text-[13px] font-semibold text-vc-success hover:bg-vc-success/20";

function Attendance({ taken, classId }: { taken: boolean; classId: string }) {
  return <Link to="/teacher/class/$classId" params={{ classId }} search={{ tab: "attendance" }} className={`mt-0.5 flex items-center gap-1.5 text-[13px] ${taken ? "text-vc-gray" : "text-destructive"}`}><span className={`size-[9px] rounded-full border ${taken ? "border-vc-gray-light" : "border-destructive bg-destructive"}`} />Attendance →</Link>;
}

function TeacherHome() {
  const { attDone, schedulingSets, custom } = useSchool();
  const all = useMySections();
  const [tab, setTab] = useState<(typeof TABS)[number]>("My Classes");
  const [q, setQ] = useState("");
  const now = today();
  const day = isoDay(now);
  const first = all.find((c) => c.status === "current")?.id ?? all[0]?.id ?? "";
  const mineIds = useMemo(() => new Set(all.map((c) => c.id)), [all]);
  const assignments = useMemo(() => {
    const own = custom.filter((c) => mineIds.has(c.courseId)).map((c) => toAssignment(c));
    const ids = new Set(own.map((a) => a.id));
    return [...ALL_ASSIGNMENTS.filter((a) => mineIds.has(a.courseId) && !ids.has(a.id)), ...own];
  }, [custom, mineIds]);
  const week = [0, 1, 2, 3, 4].map((n) => addDays(now, n));
  const todays = all.flatMap((c) => meetingsOn(c, schedulingSets, now).map((m) => ({ c, label: [m.name || c.block, [scheduleTime(m.start), m.end ? scheduleTime(m.end) : ""].filter(Boolean).join(" - ")].filter(Boolean).join(": ") }))).sort((a, b) => a.label.localeCompare(b.label));
  const shown = all.filter((c) => (tab === "My Classes" ? c.status === "current" : tab === "Future" ? c.status === "future" : tab === "Completed" ? c.status === "past" : false));
  const toolLink = (label: string, icon: ReactNode, tabId: "assignments" | "grades" | "attendance", cls: string) => first ? <Link to="/teacher/class/$classId" params={{ classId: first }} search={{ tab: tabId }} className={cls}>{icon}{label}</Link> : null;
  return (
    <PortalShell portal="teacher" area="teacher">
      <div className="border-b border-vc-line px-4 py-3 text-[17px] font-light">Home</div>
      <div className="grid grid-cols-1 gap-x-9 px-4 pb-10 pt-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <h2 className={h2}>Upcoming</h2>
          <div className="mt-3 grid grid-cols-5 border border-vc-line">
            {week.map((d, i) => { const items = assignments.filter((a) => isSameDay(a.due, d)); return (
              <div key={+d} className={i ? "border-l border-vc-line" : ""}>
                <div className={`px-2 py-1.5 text-[12px] font-semibold uppercase text-foreground/70 ${i === 0 ? "bg-vc-tile-warm" : "bg-vc-bar"}`}>{format(d, "EEE - MMM d")}</div>
                <div className="min-h-[150px] space-y-2 px-2 py-2 text-[12px] leading-4">
                  {items.slice(0, 5).map((a) => <Link key={a.id} to="/teacher/class/$classId" params={{ classId: a.courseId }} search={{ tab: "assignments" }} className="block text-vc-submit hover:underline">{a.courseId}: {a.title}</Link>)}
                  {items.length > 5 && <div className="text-vc-gray">+{items.length - 5} more</div>}
                </div>
              </div>); })}
          </div>

          <h2 className={`${h2} mt-6`}>Today</h2>
          <div className="mt-4 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
            {todays.map(({ c, label }) => (
              <div key={`${c.id}-${label}`} className="border-l-2 border-vc-link pl-3">
                <Link to="/teacher/class/$classId" params={{ classId: c.id }} className="text-[18px] leading-6 text-vc-link hover:underline"><b className="font-semibold">{c.id}</b>: {c.name}</Link>
                <div className="text-[12px] text-vc-gray">{label}</div>
                <Attendance taken={attDone.includes(`${c.id}|${day}`)} classId={c.id} />
              </div>))}
            {!todays.length && <p className="text-[14px] text-vc-gray">No classes meet today.</p>}
          </div>

          <h2 className={`${h2} mt-6`}>All Classes</h2>
          <div role="tablist" className="mt-3 flex border-b border-vc-line">
            {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`-mb-px h-[44px] px-6 text-[14.5px] ${tab === t ? "border-x border-t border-vc-line bg-background text-vc-tile-warm-fg" : "text-foreground"}`}>{t}</button>)}
          </div>
          <div className="mt-1">
            {shown.map((c) => (
              <div key={c.id} className="border-b border-vc-line border-l-2 border-l-vc-link pb-3 pl-4 pt-3">
                <Link to="/teacher/class/$classId" params={{ classId: c.id }} className="text-[18px] leading-6 text-vc-link hover:underline"><b className="font-semibold">{c.id}</b>: {c.name}</Link>
                <Attendance taken={attDone.includes(`${c.id}|${day}`)} classId={c.id} />
                <div className="mt-2 flex flex-wrap items-center gap-x-7 gap-y-1 text-[13px] text-vc-gray-dark">
                  <Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "gradebook" }} className="flex items-center gap-1.5 font-semibold text-vc-link-strong"><Pencil className="size-4" />Gradebook</Link>
                  <Link to="/class/$classId" params={{ classId: c.id }} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-vc-link-strong"><Globe className="size-4" />Website<ChevronDown className="size-3" /></Link>
                  <Link to="/messages" className="flex items-center gap-1.5 text-vc-link-strong"><Mail className="size-4" />Contact<ChevronDown className="size-3" /></Link>
                  <Link to="/teacher/class/$classId" params={{ classId: c.id }} className="flex items-center gap-1.5 text-vc-link-strong"><Menu className="size-4" />More<ChevronDown className="size-3" /></Link>
                </div>
              </div>))}
            {!shown.length && <p className="py-8 text-center text-[14px] text-vc-gray">No classes here.{tab === "My Classes" ? " Classes appear once the school office schedules and publishes them." : ""}</p>}
          </div>
        </div>

        <aside className="mt-8 space-y-0 lg:mt-0">
          <h2 className={h2}>Faculty Portal</h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Link to="/resources" className={tile}><Library className="size-6" />My Library</Link>
            {first ? <Link to="/teacher/class/$classId" params={{ classId: first }} search={{ tab: "assignments" }} className={tile}><NotebookPen className="size-6" />Lesson Planner</Link> : <span className={tile}><NotebookPen className="size-6" />Lesson Planner</span>}
            <Link to="/messages" className={tile}><Mail className="size-6" />My Messages</Link>
            <Link to="/calendar" className={tile}><CalendarDays className="size-6" />My Calendar</Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {toolLink("Take Attendance", <ClipboardCheck className="size-4" />, "attendance", wide)}
            {toolLink("Assignments", <BookOpen className="size-4" />, "assignments", wide)}
          </div>
          <h2 className={`${h2} mt-6`}>Reserve Resources</h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5"><Link to="/resources" className={wide}><LayoutGrid className="size-4" />My Resources</Link><Link to="/resources" className={wide}><Search className="size-4" />Find Resources</Link></div>
          <h2 className={`${h2} mt-6`}>Manage Students</h2>
          <form className="relative mt-3" onSubmit={(e) => { e.preventDefault(); }}>
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-foreground/70" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find students" aria-label="Find students" className="h-[52px] w-full border border-vc-line bg-background pl-11 pr-3 text-[17px] outline-none focus:border-vc-link" />
          </form>
          {q.trim() && <Link to="/directories" search={{ type: "students", last: q.trim() }} className="mt-1 block text-[13px] text-vc-link-strong">Search the student directory for “{q.trim()}” →</Link>}
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {toolLink("Add Comment", <MessageSquarePlus className="size-4" />, "grades", add)}
            {toolLink("Add Assignment", <Plus className="size-4" />, "assignments", add)}
          </div>
          <h2 className={`${h2} mt-6`}>School Links</h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Link to="/calendar" className={tile}><CalendarDays className="size-6" />School Calendar</Link>
            <Link to="/teacher/news" className={tile}><Globe className="size-6" />School News</Link>
            <Link to="/directories" search={{ type: "students" }} className={tile}><Users className="size-6" />Student Directory</Link>
            <Link to="/directories" search={{ type: "faculty" }} className={tile}><Users className="size-6" />Faculty/Staff Directory</Link>
          </div>
          <h2 className={`${h2} mt-6`}>Faculty Links</h2>
          <div className="mt-3"><Link to="/teacher/purchases" className={wide}>Purchase Requests</Link></div>
        </aside>
      </div>
    </PortalShell>
  );
}
