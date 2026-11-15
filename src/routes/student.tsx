import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, isSameDay } from "date-fns";
import { BookUser, CalendarCheck, CalendarDays, CirclePlay, Clock, Bookmark, Link2, List, Mail, Volleyball, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PortalShell } from "@/components/portal/PortalShell";
import { ClassRow } from "@/components/portal/ClassRow";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { events, fmtDay, today } from "@/lib/sis-data";
import { usePortal } from "@/lib/portal-store";
import { useInbox, useStudentAssignments , useMySections } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/student")({
  head: () => pageHead("Student Portal", "Your Cedar Ridge Academy home: upcoming work, classes, grades and links."),
  component: Home,
});

function Tile({ to, label, icon: Icon, warm }: { to: "/schedule" | "/assignments" | "/classes" | "/calendar" | "/directories"; label: string; icon: typeof Clock; warm?: boolean }) {
  return (
    <Link to={to} className={`flex h-[78px] flex-col items-center justify-center gap-2 text-[14px] ${warm ? "bg-vc-tile-warm text-vc-tile-warm-fg" : "bg-vc-tile text-vc-link-strong hover:bg-vc-tile-hover"}`}>
      <Icon className="size-6" />{label}
    </Link>
  );
}

function Home() {
  const COURSES = useMySections().filter((c) => c.status === "current");
  const { read, links, addLink, removeLink } = usePortal();
  const inbox = useInbox();
  const all = useStudentAssignments();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(""); const [url, setUrl] = useState("");
  const unread = inbox.filter((m) => !read.includes(m.id)).length;
  const days = Array.from({ length: 5 }, (_, i) => addDays(today(), i - 1));
  const evs = events();
  return (
    <PortalShell portal="student">
      <div className="border-b border-vc-line px-4 py-3.5 text-[18px]">Home</div>
      <div className="grid grid-cols-[minmax(0,1fr)_318px] gap-8 px-3.5 pb-8 pt-4">
        <section className="min-w-0">
          <h2 className="mb-3 text-[21px]">Upcoming</h2>
          <div className="grid grid-cols-5 border border-vc-line">
            {days.map((d) => {
              const items = all.filter((a) => isSameDay(a.due, d));
              return (
                <div key={d.toISOString()} className="min-w-0 border-r border-vc-line last:border-r-0">
                  <div className={`border-b border-vc-line py-1.5 text-center text-[12px] font-semibold text-foreground/75 ${isSameDay(d, today()) ? "bg-vc-weekend" : "bg-vc-panel"}`}>{fmtDay(d)}</div>
                  <div className="min-h-[108px] space-y-1.5 p-1.5 text-[12px]">
                    {items.map((a) => <Link key={a.id} to="/grades/$classId" params={{ classId: a.courseId }} className="block truncate text-vc-event hover:underline">{a.courseId.split("-")[0]}-1.{a.short}</Link>)}
                    {evs.filter((e) => isSameDay(e.date, d)).map((e) => (
                      <Link key={e.title} to="/calendar" className="block leading-tight text-vc-event hover:underline">{e.time && <b className="text-[10px] text-foreground">{e.time} </b>}{e.title}</Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <h2 className="mb-1 mt-5 text-[21px]">My Classes</h2>
          {COURSES.map((c) => <ClassRow key={c.id} c={c} variant="home" />)}
        </section>
        <aside>
          <h2 className="mb-3 text-[21px]">My Portal</h2>
          <Link to="/messages" className="flex items-center gap-3 border border-vc-line px-3 py-4 text-[16px] hover:bg-vc-panel">
            <Mail className="size-8 text-muted-foreground" strokeWidth={1} />
            <span>Unread messages</span><span className={`ml-auto rounded-sm px-2.5 py-1 text-[20px] ${unread ? "bg-vc-tile-warm-fg text-primary-foreground" : "bg-vc-line text-muted-foreground"}`}>{unread}</span>
          </Link>
          <Link to="/assignments" className="mt-2.5 flex h-9 items-center justify-center gap-2 bg-vc-success text-[14px] font-semibold text-primary-foreground hover:opacity-90">
            <CirclePlay className="size-4 fill-current stroke-vc-success" /> Submit Assignments
          </Link>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <Tile to="/schedule" label="Daily Schedule" icon={Clock} warm />
            <Tile to="/assignments" label="Assignment Planner" icon={Bookmark} />
            <Tile to="/classes" label="Classes & Reports" icon={List} />
            <Tile to="/schedule" label="My Schedule" icon={CalendarCheck} />
          </div>
          <div className="mt-5 flex items-center justify-between">
            <h2 className="text-[21px]">Student Links</h2>
            <button onClick={() => setOpen(true)} className="text-[12px] text-vc-link-strong hover:underline">+ Add link</button>
          </div>
          {links.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-6 text-[14px] text-vc-link-strong"><Link2 className="size-4" />No links to display</div>
          ) : (
            <ul className="space-y-1.5 py-3 text-[14px]">{links.map((l) => (
              <li key={l.url} className="flex items-center justify-between"><a href={l.url} target="_blank" rel="noreferrer" className="text-vc-link-strong hover:underline">{l.label}</a>
                <button onClick={() => removeLink(l.url)} aria-label="Remove link"><X className="size-3.5 text-muted-foreground" /></button></li>))}
            </ul>
          )}
          <h2 className="mb-3 text-[21px]">School Links</h2>
          <div className="grid grid-cols-2 gap-2">
            <Tile to="/calendar" label="School Calendar" icon={CalendarDays} />
            <Tile to="/calendar" label="Athletic Calendar" icon={Volleyball} />
            <Tile to="/directories" label="Student Directory" icon={BookUser} />
            <Tile to="/directories" label="Faculty/Staff Directory" icon={BookUser} />
          </div>
        </aside>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Student Link</DialogTitle></DialogHeader>
          <form className="space-y-3 text-[14px]" onSubmit={(e) => {
            e.preventDefault();
            if (!label.trim() || !/^https?:\/\/\S+\.\S+/.test(url)) { toast.error("Enter a name and a full web address (https://…)"); return; }
            addLink({ label: label.trim(), url }); setLabel(""); setUrl(""); setOpen(false); toast.success("Link added");
          }}>
            <input className="w-full border border-vc-line px-3 py-2" placeholder="Name" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} />
            <input className="w-full border border-vc-line px-3 py-2" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={300} />
            <button className="w-full bg-vc-link-strong py-2 text-primary-foreground">Save</button>
          </form>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}
