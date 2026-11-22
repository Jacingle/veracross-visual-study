import { createFileRoute, Link } from "@tanstack/react-router";
import { isOtherClass } from "@/lib/course-types";
import { addDays, format, isSameDay } from "date-fns";
import { BookOpen, CalendarDays, ChevronDown, ClipboardCheck, Globe, LayoutGrid, Library, Mail, Menu, MessageSquarePlus, NotebookPen, Pencil, Plus, Search, UserRound, Users, Link2 } from "lucide-react";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
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
const h2 = "text-[20px] leading-[30px]";
const hov = "hover:bg-vc-tile-hover hover:[--cut:var(--vc-tile-hover)]";
const btn = `flex h-9 items-center justify-center gap-2 bg-vc-tile text-[14px] font-semibold text-vc-tile-fg [--cut:var(--vc-tile)] ${hov}`;
const addBtn = "flex h-9 items-center justify-center gap-2 bg-vc-success-soft text-[14px] font-semibold text-vc-success [--cut:var(--vc-success-soft)] hover:bg-vc-success-soft-hover";
type Dest = "/resources" | "/messages" | "/calendar" | "/directories" | "/teacher/news" | "/teacher/purchases";
type TileIcon = ComponentType<{ className?: string }>;
/** Same tile as the student home: a soft blue square with the icon above the label; it darkens on hover. */
function Tile({ to, search, label, icon: Icon, solid }: { to: Dest; search?: Record<string, string>; label: string; icon: TileIcon; solid?: boolean }) {
  return <Link to={to} search={search as never} className={`flex h-[74px] flex-col items-center justify-between pb-1 pt-2.5 text-[14px] leading-[22px] bg-vc-tile text-vc-tile-fg [--cut:var(--vc-tile)] ${hov}`}><Icon className={solid ? "size-6 fill-current stroke-(--cut)" : "size-6"} />{label}</Link>;
}

function Attendance({ taken, classId }: { taken: boolean; classId: string }) {
  return <Link to="/teacher/class/$classId" params={{ classId }} search={{ tab: "attendance" }} className={`mt-0.5 flex items-center gap-1.5 text-[13px] ${taken ? "text-vc-success" : "text-destructive"}`}><span className={`size-[9px] rounded-full ${taken ? "bg-vc-success" : "bg-destructive"}`} />Attendance →</Link>;
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
  const shown = all.filter((c) => (tab === "My Classes" ? c.status === "current" && !isOtherClass(c.type) && c.type !== "ATHLETIC" : tab === "Teams" ? c.status === "current" && c.type === "ATHLETIC" : tab === "Programs" ? false : tab === "Other Classes" ? c.status === "current" && isOtherClass(c.type) : tab === "Future" ? c.status === "future" : tab === "Completed" ? c.status === "past" : false));
  const toolLink = (label: string, icon: ReactNode, tabId: "assignments" | "grades" | "attendance", cls: string) => first ? <Link to="/teacher/class/$classId" params={{ classId: first }} search={{ tab: tabId }} className={cls}>{icon}{label}</Link> : null;
  return (
    <PortalShell portal="teacher" area="teacher">
      <div className="border-b border-vc-line px-4 py-[10.5px] text-[18px] leading-[27px]">Home</div>
      <div className="grid grid-cols-1 gap-8 px-3 pb-8 pt-[13px] md:grid-cols-[minmax(0,1fr)_304px]">
        <div className="min-w-0">
          <h2 className={`mb-[11px] ${h2}`}>Upcoming</h2>
          <div className="grid grid-cols-5 border border-vc-line">
            {week.map((d, i) => { const items = assignments.filter((a) => isSameDay(a.due, d)); return (
              <div key={+d} className={i ? "border-l border-vc-line" : ""}>
                <div className={`px-2 py-1.5 text-[12px] font-semibold uppercase ${i === 0 ? "text-vc-navbar" : "bg-vc-bar text-foreground/70"}`} style={i === 0 ? { background: "color-mix(in oklab, var(--vc-navbar) 16%, white)" } : undefined}>{format(d, "EEE - MMM d")}</div>
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
          <div role="tablist" className="mt-3 flex overflow-x-auto whitespace-nowrap border-b border-vc-line">
            {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`-mb-px h-[44px] px-6 text-[14.5px] ${tab === t ? "border-x border-t border-vc-line bg-background text-vc-navbar" : "text-foreground"}`}>{t}</button>)}
          </div>
          <div className="mt-1">
            {shown.map((c) => (
              <div key={c.id} className="border-b border-vc-line border-l-2 border-l-vc-link pb-3 pl-4 pt-3">
                <Link to="/teacher/class/$classId" params={{ classId: c.id }} className="text-[18px] leading-6 text-vc-link hover:underline"><b className="font-semibold">{c.id}</b>: {c.name}</Link>
                <Attendance taken={attDone.includes(`${c.id}|${day}`)} classId={c.id} />
                <div className="mt-2 flex flex-nowrap items-center gap-x-7 overflow-x-auto whitespace-nowrap text-[14px] text-vc-link-strong">
                  <Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "gradebook" }} className="flex items-center gap-1.5 font-semibold"><Pencil className="size-4" />Gradebook</Link>
                  <Link to="/class/$classId" params={{ classId: c.id }} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5"><Globe className="size-4" />Website<ChevronDown className="size-3" /></Link>
                  <Link to="/messages" className="flex items-center gap-1.5"><Mail className="size-4" />Contact<ChevronDown className="size-3" /></Link>
                  <Link to="/teacher/class/$classId" params={{ classId: c.id }} className="flex items-center gap-1.5"><Menu className="size-4" />More<ChevronDown className="size-3" /></Link>
                </div>
              </div>))}
            {!shown.length && <p className="py-8 text-center text-[14px] text-vc-gray">No classes here.{tab === "My Classes" ? " Classes appear once the school office schedules and publishes them." : ""}</p>}
          </div>
        </div>

        <aside>
          <h2 className={`mb-[11px] ${h2}`}>Faculty Portal</h2>
          <div className="grid grid-cols-2 gap-2">
            <Tile to="/resources" label="My Library" icon={Library} solid />
            {first ? <Link to="/teacher/class/$classId" params={{ classId: first }} search={{ tab: "assignments" }} className={`flex h-[74px] flex-col items-center justify-between pb-1 pt-2.5 text-[14px] leading-[22px] bg-vc-tile text-vc-tile-fg [--cut:var(--vc-tile)] ${hov}`}><NotebookPen className="size-6" />Lesson Planner</Link> : <span className="flex h-[74px] flex-col items-center justify-between pb-1 pt-2.5 text-[14px] leading-[22px] bg-vc-tile text-vc-tile-fg"><NotebookPen className="size-6" />Lesson Planner</span>}
            <Tile to="/messages" label="My Messages" icon={Mail} solid />
            <Tile to="/calendar" label="My Calendar" icon={CalendarDays} solid />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link to="/calendar" className={btn}><CalendarDays className="size-[16px]" />Class Schedule</Link>
            <Link to="/directories" search={{ type: "faculty" }} className={btn}><UserRound className="size-[16px]" />Update Profile</Link>
          </div>
          <h2 className={`mb-[11px] mt-3 ${h2}`}>Reserve Resources</h2>
          <div className="grid grid-cols-2 gap-2"><Link to="/resources" className={btn}><LayoutGrid className="size-[18px]" />My Resources</Link><Link to="/resources" className={btn}><Search className="size-[18px]" />Find Resources</Link></div>
          <h2 className={`mb-[11px] mt-3 ${h2}`}>Manage Students</h2>
          <form className="relative" onSubmit={(e) => { e.preventDefault(); }}>
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-foreground/70" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find students" aria-label="Find students" className="h-[44px] w-full border-2 border-vc-line bg-background pl-11 pr-3 text-[17px] outline-none focus:border-vc-link" />
          </form>
          {q.trim() && <Link to="/directories" search={{ type: "students", last: q.trim() }} className="mt-1 block text-[13px] text-vc-link-strong">Search the student directory for “{q.trim()}” →</Link>}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {toolLink("Add Behavior", <Plus className="size-[18px]" />, "grades", addBtn)}
            {toolLink("Add Comment", <Plus className="size-[18px]" />, "grades", addBtn)}
          </div>
          <h2 className={`mb-[11px] mt-3 ${h2}`}>School Links</h2>
          <div className="grid grid-cols-2 gap-2">
            <Tile to="/calendar" label="School Calendar" icon={CalendarDays} solid />
            <Tile to="/calendar" label="Athletic Calendar" icon={Globe} />
            <Tile to="/directories" search={{ type: "students" }} label="Student Directory" icon={Users} solid />
            <Tile to="/directories" search={{ type: "faculty" }} label="Faculty/Staff Directory" icon={Users} solid />
          </div>
          <h2 className={`mb-[11px] mt-3 ${h2}`}>Faculty Links</h2>
          <div className="grid grid-cols-2 gap-2"><Link to="/calendar" className={btn}><CalendarDays className="size-[16px]" />Exam Calendar</Link>{first ? <Link to="/teacher/class/$classId" params={{ classId: first }} search={{ tab: "settings" }} className={btn}><Menu className="size-[16px]" />Setup Classes</Link> : <span className={btn}>Setup Classes</span>}</div>
          <div className="mt-3 text-center text-[12px] text-vc-link-strong"><Link2 className="mx-auto mb-1 size-4" />No links to display</div>
        </aside>
      </div>
    </PortalShell>
  );
}
