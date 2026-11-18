import { createFileRoute } from "@tanstack/react-router";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { BarChart3, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, FileText, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { AssignmentDialog } from "@/components/portal/AssignmentDialog";
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-vc-line px-4 py-3">
        <div className="text-[18px]">My Calendar</div>
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          {user?.role === "student" && <label className="flex items-center gap-1.5"><input type="checkbox" checked={showHw} onChange={(e) => setShowHw(e.target.checked)} />Show assignments</label>}
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setM(addMonths(m, -1))} className="border border-vc-line p-1.5"><ChevronLeft className="size-4" /></Button>
          <div className="w-32 text-center text-[15px] font-semibold">{format(m, "MMMM yyyy")}</div>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setM(addMonths(m, 1))} className="border border-vc-line p-1.5"><ChevronRight className="size-4" /></Button>
          <Button variant="ghost" onClick={() => setM(startOfMonth(today()))} className="font-semibold text-vc-link-strong">TODAY</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 p-3">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="border-b border-vc-line bg-vc-panel py-1.5 text-center text-[12px] font-semibold">{d}</div>)}
        {days.map((d) => (
          <div key={+d} className={`min-h-[96px] min-w-0 border-b border-r border-vc-line p-1 text-[11px] ${isSameMonth(d, m) ? "" : "bg-vc-panel text-muted-foreground"}`}>
            <div className={`mb-0.5 text-right ${isSameDay(d, today()) ? "font-bold text-vc-link-strong" : ""}`}>{format(d, "d")}</div>
            {evs.filter((e) => isSameDay(e.date, d)).map((e) => <div key={e.title} className="mb-0.5 leading-tight text-vc-event">{e.time && <b className="text-foreground">{e.time} </b>}{e.title}</div>)}
            {showHw && hw.filter((a) => isSameDay(a.due, d)).map((a) => <Button variant="ghost" key={a.id} onClick={() => setSel(a)} className="block h-auto w-full truncate rounded-none p-0 text-left text-[11px] font-normal text-vc-link-strong hover:underline">{a.courseId}.{a.short}</Button>)}
          </div>
        ))}
      </div>
      <AssignmentDialog assignment={sel} onClose={() => setSel(null)} />
    </PortalShell>
  );
}
