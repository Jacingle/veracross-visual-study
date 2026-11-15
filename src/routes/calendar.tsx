import { createFileRoute } from "@tanstack/react-router";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { course, courseTitle, events, today, type Assignment } from "@/lib/sis-data";
import { useSchool, useStudentAssignments } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/calendar")({
  head: () => pageHead("My Calendar", "Month view of school events and assignments due."),
  component: Cal,
});

function Cal() {
  const { user, sections } = useSchool();
  const all = useStudentAssignments();
  const [m, setM] = useState(startOfMonth(today()));
  const [showHw, setShowHw] = useState(true);
  const [sel, setSel] = useState<Assignment | null>(null);
  const days = eachDayOfInterval({ start: startOfWeek(m), end: endOfWeek(endOfMonth(m)) });
  const evs = events();
  const hw = user?.role === "student" ? all : [];
  return (
    <PortalShell>
      <div className="flex items-center justify-between border-b border-vc-line px-4 py-3">
        <div className="text-[18px]">My Calendar</div>
        <div className="flex items-center gap-3 text-[13px]">
          {user?.role === "student" && <label className="flex items-center gap-1.5"><input type="checkbox" checked={showHw} onChange={(e) => setShowHw(e.target.checked)} />Show assignments</label>}
          <button aria-label="Previous month" onClick={() => setM(addMonths(m, -1))} className="border border-vc-line p-1.5"><ChevronLeft className="size-4" /></button>
          <div className="w-32 text-center text-[15px] font-semibold">{format(m, "MMMM yyyy")}</div>
          <button aria-label="Next month" onClick={() => setM(addMonths(m, 1))} className="border border-vc-line p-1.5"><ChevronRight className="size-4" /></button>
          <button onClick={() => setM(startOfMonth(today()))} className="font-semibold text-vc-link-strong">TODAY</button>
        </div>
      </div>
      <div className="grid grid-cols-7 p-3">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="border-b border-vc-line bg-vc-panel py-1.5 text-center text-[12px] font-semibold">{d}</div>)}
        {days.map((d) => (
          <div key={+d} className={`min-h-[96px] min-w-0 border-b border-r border-vc-line p-1 text-[11px] ${isSameMonth(d, m) ? "" : "bg-vc-panel text-muted-foreground"}`}>
            <div className={`mb-0.5 text-right ${isSameDay(d, today()) ? "font-bold text-vc-link-strong" : ""}`}>{format(d, "d")}</div>
            {evs.filter((e) => isSameDay(e.date, d)).map((e) => <div key={e.title} className="mb-0.5 leading-tight text-vc-event">{e.time && <b className="text-foreground">{e.time} </b>}{e.title}</div>)}
            {showHw && hw.filter((a) => isSameDay(a.due, d)).map((a) => <button key={a.id} onClick={() => setSel(a)} className="block w-full truncate text-left text-vc-link-strong hover:underline">{a.courseId}.{a.short}</button>)}
          </div>
        ))}
      </div>
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-[560px] gap-0 p-0 text-[13px]">
          {sel && <>
            <DialogHeader className="border-b border-vc-line px-5 py-3"><DialogTitle className="text-[17px] font-normal">{sel.title}</DialogTitle>
              <div className="text-[12px] text-muted-foreground">{sections.find((c) => c.id === sel.courseId)?.name ?? sel.courseId}</div></DialogHeader>
            <dl className="grid grid-cols-[140px_1fr] gap-y-2.5 px-5 py-4">
              <dt className="text-muted-foreground">Category</dt><dd>{sel.category}</dd>
              <dt className="text-muted-foreground">Assignment Date</dt><dd>{format(sel.assigned, "EEEE, MMMM d, yyyy")}</dd>
              <dt className="text-muted-foreground">Due Date</dt><dd>{format(sel.due, "EEEE, MMMM d, yyyy")}</dd>
              <dt className="text-muted-foreground">Score / Weight</dt><dd>{sel.score !== undefined ? `${sel.score} out of ${sel.points}` : `Not graded · out of ${sel.points}`}</dd>
              <dt className="text-muted-foreground">Notes</dt><dd className="whitespace-pre-line">{sel.notes}</dd>
            </dl>
          </>}
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}
