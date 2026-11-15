import { createFileRoute } from "@tanstack/react-router";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { BarChart3, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, FileText, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { course, courseTitle, events, teacherShort, today, type Assignment } from "@/lib/sis-data";
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
        <DialogContent className="max-w-[840px] gap-0 overflow-hidden rounded-sm p-0 text-[13px]">
          {sel && <>
            <DialogHeader className="flex-row items-start justify-between space-y-0 bg-vc-panel px-6 py-4 text-left"><div><DialogTitle className="text-[20px] font-light"><strong className="font-semibold">{sel.courseId}:</strong> {sections.find((c) => c.id === sel.courseId)?.name ?? ""}</DialogTitle>
              <div className="text-[14px] text-muted-foreground">{teacherShort(sections.find((c) => c.id === sel.courseId)?.teacherId ?? "")}</div></div><span className="mr-6 text-[14px] font-semibold tracking-wide text-muted-foreground">ASSIGNMENT</span></DialogHeader>
            <div className="px-6 py-8">
              <div className="text-[14px] font-semibold uppercase text-vc-link">{sel.category}</div>
              <h2 className="text-[30px] font-semibold">{sel.title}</h2>
              <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                {([[CalendarPlus, "Date Assigned", format(sel.assigned, "EEEE, MMM dd")], [CalendarDays, "Due Date", format(sel.due, "EEEE, MMM dd")], [BarChart3, "Max Score", String(sel.points)], [PieChart, "Weight", String(sel.points)]] as const).map(([Icon, label, value]) => (
                  <div key={label} className="flex items-center gap-4"><Icon className="size-8 shrink-0" strokeWidth={1.3} /><div className="border-l border-vc-line pl-3"><div className="text-[14px] text-muted-foreground">{label}</div><div className="text-[20px] font-semibold">{value}</div></div></div>))}
              </div>
              <div className="mt-8 flex gap-4"><FileText className="size-8 shrink-0" strokeWidth={1.3} /><div className="border-l border-vc-line pl-3"><div className="text-[14px] text-muted-foreground">Notes</div><p className="mt-3 whitespace-pre-line text-[15px]">{sel.notes || "-"}</p></div></div>
            </div>
            <div className="flex justify-end bg-vc-panel px-4 py-3"><Button variant="outline" onClick={() => setSel(null)}>Close</Button></div>
          </>}
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}
