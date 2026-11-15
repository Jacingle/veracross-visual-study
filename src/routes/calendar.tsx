import { createFileRoute, Link } from "@tanstack/react-router";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { ASSIGNMENTS, events, today } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/calendar")({
  head: () => pageHead("My Calendar", "Month view of school events and assignments due."),
  component: Cal,
});

function Cal() {
  const [m, setM] = useState(startOfMonth(today()));
  const [showHw, setShowHw] = useState(true);
  const days = eachDayOfInterval({ start: startOfWeek(m), end: endOfWeek(endOfMonth(m)) });
  const evs = events();
  return (
    <PortalShell>
      <div className="flex items-center justify-between border-b border-vc-line px-5 py-4">
        <div className="text-[22px]">My Calendar</div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showHw} onChange={(e) => setShowHw(e.target.checked)} />Show assignments</label>
          <button onClick={() => setM(addMonths(m, -1))} className="border border-vc-line p-2"><ChevronLeft className="size-4" /></button>
          <div className="w-40 text-center text-lg font-semibold">{format(m, "MMMM yyyy")}</div>
          <button onClick={() => setM(addMonths(m, 1))} className="border border-vc-line p-2"><ChevronRight className="size-4" /></button>
          <button onClick={() => setM(startOfMonth(today()))} className="text-sm font-semibold text-vc-link-strong">TODAY</button>
        </div>
      </div>
      <div className="grid grid-cols-7 p-4">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="border-b border-vc-line bg-vc-panel py-2 text-center text-sm font-semibold">{d}</div>)}
        {days.map((d) => (
          <div key={+d} className={`min-h-[120px] border-b border-r border-vc-line p-1.5 text-[13px] ${isSameMonth(d, m) ? "" : "bg-vc-panel text-muted-foreground"}`}>
            <div className={`mb-1 text-right ${isSameDay(d, today()) ? "font-bold text-vc-link-strong" : ""}`}>{format(d, "d")}</div>
            {evs.filter((e) => isSameDay(e.date, d)).map((e) => <div key={e.title} className="mb-1 leading-tight text-vc-event">{e.time && <b className="text-foreground">{e.time} </b>}{e.title}</div>)}
            {showHw && ASSIGNMENTS.filter((a) => isSameDay(a.due, d)).map((a) => <Link key={a.id} to="/grades/$classId" params={{ classId: a.courseId }} className="block truncate text-vc-link-strong hover:underline">{a.courseId}.{a.short}</Link>)}
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
