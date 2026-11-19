import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, isSameDay } from "date-fns";
import { BookUser, CalendarCheck, CalendarDays, CloudDownload, Link2 } from "lucide-react";
import { useState, type ComponentType } from "react";

import { PortalShell } from "@/components/portal/PortalShell";
import { ClassRow } from "@/components/portal/ClassRow";
import { Basketball, BookRibbon, ClockSolid, ListSquares } from "@/components/portal/icons";
import { AssignmentDialog } from "@/components/portal/AssignmentDialog";
import { MailOutline, PlayDisc } from "@/components/portal/icons";
import { Button } from "@/components/ui/button";
import { events, fmtDay, today, type Assignment } from "@/lib/sis-data";
import { usePortal } from "@/lib/portal-store";
import { useInbox, useStudentAssignments , useMySections } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/student")({
  head: () => pageHead("Student Portal", "Your Cedar Ridge Academy home: upcoming work, classes, grades and links."),
  component: Home,
});

type TileIcon = ComponentType<{ className?: string }>;

/** `solid` lucide icons are filled and stroke their details with --cut; custom icons read --cut themselves. */
function Tile({ to, label, icon: Icon, warm, solid }: { to: "/schedule" | "/assignments" | "/classes" | "/calendar" | "/directories"; label: string; icon: TileIcon; warm?: boolean; solid?: boolean }) {
  return (
    <Link to={to} className={`flex h-[74px] flex-col items-center justify-between pb-1 pt-2.5 text-[14px] leading-[22px] ${warm ? "bg-vc-tile-warm text-vc-tile-warm-fg [--cut:var(--vc-tile-warm)] hover:bg-vc-tile-warm-hover hover:[--cut:var(--vc-tile-warm-hover)]" : "bg-vc-tile text-vc-tile-fg [--cut:var(--vc-tile)] hover:bg-vc-tile-hover hover:[--cut:var(--vc-tile-hover)]"}`}>
      <Icon className={solid ? "size-6 fill-current stroke-(--cut)" : "size-6"} />{label}
    </Link>
  );
}

const H2 = "text-[20px] leading-[30px]";

function Home() {
  const COURSES = useMySections().filter((c) => c.status === "current");
  const { read, links } = usePortal();
  const inbox = useInbox();
  const all = useStudentAssignments();
  const [selected, setSelected] = useState<Assignment | null>(null);
  const unread = inbox.filter((m) => !read.includes(m.id)).length;
  const days = Array.from({ length: 5 }, (_, i) => addDays(today(), i - 1));
  const evs = events();
  return (
    <PortalShell portal="student">
      <div className="border-b border-vc-line px-4 py-[10.5px] text-[18px] leading-[27px]">Home</div>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_304px] gap-8 px-3 pb-8 pt-[13px]">
        <section className="min-w-0">
          <h2 className={`mb-[11px] ${H2}`}>Upcoming</h2>
          <div className="grid grid-cols-5 border border-vc-line">
            {days.map((d) => {
              const items = all.filter((a) => isSameDay(a.due, d));
              return (
                <div key={d.toISOString()} className="min-w-0 border-r border-vc-line last:border-r-0">
                  <div className={`border-b border-vc-line py-[5px] text-center text-[12px] font-semibold leading-4 text-vc-gray-dark ${isSameDay(d, today()) ? "bg-vc-today" : "bg-vc-panel"}`}>{fmtDay(d)}</div>
                  <div className="min-h-[103px] space-y-[6.5px] p-[4.5px] text-[12px] leading-[15px]">
                    {evs.filter((e) => isSameDay(e.date, d)).map((e) => (
                      <Link key={e.title} to="/calendar" className="block text-vc-event-green hover:underline">{e.time && <b className="text-[10px] text-foreground">{e.time} </b>}{e.title}</Link>
                    ))}
                    {items.map((a) => <Button key={a.id} variant="ghost" onClick={() => setSelected(a)} className="block h-auto w-full truncate rounded-none p-0 text-left text-[12px] font-normal leading-[15px] text-vc-event hover:underline">{a.courseId}.{a.short}</Button>)}
                  </div>
                </div>
              );
            })}
          </div>
          <h2 className={`mb-[10.5px] mt-3 ${H2}`}>My Classes</h2>
          {COURSES.map((c) => <ClassRow key={c.id} c={c} variant="home" />)}
        </section>
        <aside>
          <h2 className={`mb-[11px] ${H2}`}>My Portal</h2>
          <Link to="/messages" className="flex h-[62px] items-center gap-3 border-2 border-vc-line px-2 text-[17px] hover:bg-vc-panel">
            <MailOutline className="size-[42px] shrink-0 text-vc-gray-light" />
            <span>{unread ? `${unread} unread message${unread === 1 ? "" : "s"}` : "No unread messages"}</span>
          </Link>
          <Link to="/assignments" className="mt-[8.5px] flex h-[38px] items-center justify-center gap-2.5 rounded-[3px] border-b-[4px] border-b-vc-success-edge bg-vc-success text-[16px] font-semibold text-primary-foreground [--cut:var(--vc-success)] hover:opacity-90">
            <PlayDisc className="size-[22px]" /> Submit Assignments
          </Link>
          <div className="mt-[8.5px] grid grid-cols-2 gap-2">
            <Tile to="/schedule" label="Daily Schedule" icon={ClockSolid} warm />
            <Tile to="/assignments" label="Assignment Planner" icon={BookRibbon} />
            <Tile to="/classes" label="Classes & Reports" icon={ListSquares} />
            <Tile to="/schedule" label="My Schedule" icon={CalendarCheck} solid />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <h2 className={H2}>Student Links</h2>

          </div>
          {links.length === 0 ? (
            <div className="flex flex-col items-center gap-[6.5px] pb-[15.5px] pt-[23px] text-[14px] leading-5 text-vc-link-soft"><Link2 className="size-4" strokeWidth={1.75} />No links to display</div>
          ) : (
            <ul className="space-y-1.5 py-3 text-[14px]">{links.map((l) => (
              <li key={l.url} className="flex items-center justify-between"><a href={l.url} target="_blank" rel="noreferrer" className="text-vc-link-strong hover:underline">{l.label}</a></li>))}
            </ul>
          )}
          <h2 className={`mb-[11px] ${links.length ? "mt-3" : ""} ${H2}`}>School Links</h2>
          <div className="grid grid-cols-2 gap-2">
            <Tile to="/calendar" label="School Calendar" icon={CalendarDays} solid />
            <Tile to="/calendar" label="Athletic Calendar" icon={Basketball} />
            <Tile to="/directories" label="Student Directory" icon={BookUser} solid />
            <Tile to="/directories" label="Faculty/Staff Directory" icon={BookUser} solid />
          </div>
          <Link to="/calendar" className="mt-2 flex h-9 items-center justify-center gap-2 bg-vc-tile text-[14px] font-semibold text-vc-tile-fg [--cut:var(--vc-tile)] hover:bg-vc-tile-hover hover:[--cut:var(--vc-tile-hover)]">
            <CloudDownload className="size-[18px] fill-current stroke-(--cut)" /> Subscribe to Calendars
          </Link>
        </aside>
      </div>
      <AssignmentDialog assignment={selected} onClose={() => setSelected(null)} />
    </PortalShell>
  );
}
