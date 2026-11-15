import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, isSameDay } from "date-fns";
import { BookUser, CalendarCheck, CalendarDays, CirclePlay, Clock, Bookmark, Link2, List, Mail, Volleyball, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PortalShell } from "@/components/portal/PortalShell";
import { ClassRow } from "@/components/portal/ClassRow";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ASSIGNMENTS, COURSES, MESSAGES, events, fmtDay, today } from "@/lib/sis-data";
import { usePortal } from "@/lib/portal-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/")({
  head: () => pageHead("Student Portal", "Your Cedar Ridge Academy home: upcoming work, classes, grades and links."),
  component: Home,
});

function Tile({ to, label, icon: Icon, warm }: { to: string; label: string; icon: typeof Clock; warm?: boolean }) {
  return (
    <Link to={to} className={`flex h-[97px] flex-col items-center justify-center gap-3 text-[17px] ${warm ? "bg-vc-tile-warm text-vc-tile-warm-fg" : "bg-vc-tile text-vc-link-strong hover:bg-vc-tile-hover"}`}>
      <Icon className="size-8" />{label}
    </Link>
  );
}

function Home() {
  const { read, links, addLink, removeLink } = usePortal();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(""); const [url, setUrl] = useState("");
  const unread = MESSAGES.filter((m) => !read.includes(m.id)).length;
  const days = Array.from({ length: 5 }, (_, i) => addDays(today(), i - 1));
  const evs = events();
  return (
    <PortalShell>
      <div className="border-b border-vc-line px-5 py-5 text-[22px]">Home</div>
      <div className="grid grid-cols-[1fr_397px] gap-10 px-4 pb-10 pt-5">
        <section>
          <h2 className="mb-4 text-[26px]">Upcoming</h2>
          <div className="grid grid-cols-5 border border-vc-line">
            {days.map((d) => {
              const wk = d.getDay() === 0 || d.getDay() === 6;
              const items = ASSIGNMENTS.filter((a) => isSameDay(a.due, d));
              return (
                <div key={d.toISOString()} className="border-r border-vc-line last:border-r-0">
                  <div className={`border-b border-vc-line py-2 text-center text-[15px] font-semibold text-foreground/75 ${isSameDay(d, today()) ? "bg-vc-weekend" : "bg-vc-panel"}`}>{fmtDay(d)}</div>
                  <div className="min-h-[134px] space-y-2 p-1.5 text-[14px]">
                    {items.map((a) => <Link key={a.id} to="/grades/$classId" params={{ classId: a.courseId }} className="block text-vc-event hover:underline">{a.courseId.split("-")[0]}-1.{a.short}</Link>)}
                    {evs.filter((e) => isSameDay(e.date, d)).map((e) => (
                      <Link key={e.title} to="/calendar" className="block leading-tight text-vc-event hover:underline">{e.time && <b className="text-xs text-foreground">{e.time} </b>}{e.title}</Link>
                    ))}
                    {!wk && items.length === 0 && null}
                  </div>
                </div>
              );
            })}
          </div>
          <h2 className="mb-2 mt-6 text-[26px]">My Classes</h2>
          {COURSES.map((c) => <ClassRow key={c.id} c={c} variant="home" />)}
        </section>
        <aside>
          <h2 className="mb-4 text-[26px]">My Portal</h2>
          <Link to="/messages" className="flex items-center gap-4 border border-vc-line px-3 py-5 text-[20px] hover:bg-vc-panel">
            <Mail className="size-10 text-muted-foreground" strokeWidth={1} />
            {unread ? `${unread} unread message${unread > 1 ? "s" : ""}` : "No unread messages"}
          </Link>
          <Link to="/assignments" className="mt-3 flex h-11 items-center justify-center gap-2 bg-vc-success text-[17px] font-semibold text-primary-foreground hover:opacity-90">
            <CirclePlay className="size-5 fill-current stroke-vc-success" /> Submit Assignments
          </Link>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Tile to="/schedule" label="Daily Schedule" icon={Clock} warm />
            <Tile to="/assignments" label="Assignment Planner" icon={Bookmark} />
            <Tile to="/classes" label="Classes & Reports" icon={List} />
            <Tile to="/schedule" label="My Schedule" icon={CalendarCheck} />
          </div>
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-[26px]">Student Links</h2>
            <button onClick={() => setOpen(true)} className="text-sm text-vc-link-strong hover:underline">+ Add link</button>
          </div>
          {links.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-[17px] text-vc-link-strong"><Link2 className="size-5" />No links to display</div>
          ) : (
            <ul className="space-y-2 py-4">{links.map((l) => (
              <li key={l.url} className="flex items-center justify-between"><a href={l.url} target="_blank" rel="noreferrer" className="text-vc-link-strong hover:underline">{l.label}</a>
                <button onClick={() => removeLink(l.url)} aria-label="Remove link"><X className="size-4 text-muted-foreground" /></button></li>))}
            </ul>
          )}
          <h2 className="mb-4 text-[26px]">School Links</h2>
          <div className="grid grid-cols-2 gap-2.5">
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
          <form className="space-y-3" onSubmit={(e) => {
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
