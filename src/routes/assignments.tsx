import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { addDays, format, isSameDay, isWeekend, parseISO, isValid } from "date-fns";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CATEGORY_TOKEN, COURSES, courseTitle, teacherFull, today } from "@/lib/sis-data";
import { usePortal } from "@/lib/portal-store";
import { useStudentAssignments } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/assignments")({
  validateSearch: z.object({ start: z.string().optional() }),
  head: () => pageHead("Assignments", "Week-at-a-glance assignment planner for every class."),
  component: Planner,
});

function Planner() {
  const { start } = Route.useSearch();
  const nav = useNavigate({ from: "/assignments" });
  const { done, toggleDone } = usePortal();
  const [showDetails, setShowDetails] = useState(true);
  const ASSIGNMENTS = useStudentAssignments();
  const s0 = start ? parseISO(start) : addDays(today(), -1);
  const s = isValid(s0) ? s0 : today();
  const days: Date[] = []; for (let d = s; days.length < 7; d = addDays(d, 1)) if (!isWeekend(d)) days.push(d);
  const shift = (n: number) => { let d = s, c = 0; while (c < Math.abs(n)) { d = addDays(d, Math.sign(n)); if (!isWeekend(d)) c++; } nav({ search: { start: format(d, "yyyy-MM-dd") } }); };
  return (
    <PortalShell portal="student" wide>
      <StudentTabs />
      <div className="flex justify-end gap-3 px-6 py-2 text-[13px] font-semibold text-vc-link-strong">
        <button onClick={() => nav({ search: {} })}>TODAY</button>·
        <button onClick={() => shift(-5)} className="flex items-center gap-1"><ArrowLeft className="size-3.5" />PREVIOUS</button>·
        <button onClick={() => shift(5)} className="flex items-center gap-1">NEXT<ArrowRight className="size-4" /></button>
      </div>
      <div className="grid overflow-x-auto pt-4" style={{ gridTemplateColumns: `214px repeat(7, minmax(140px, 1fr))` }}>
        <div className="border-r border-foreground/80" />
        {days.map((d) => <div key={+d} className="border-r border-vc-line px-3 pb-1.5 text-[13px]">{format(d, "EEEE, MMM d")}</div>)}
        <div className="flex justify-between border-b-2 border-r border-b-foreground/80 border-r-foreground/80 border-t border-t-vc-line px-2 py-1.5 text-[10px]">CLASS DETAILS:<button onClick={() => setShowDetails((v) => !v)}>+ SHOW - HIDE</button></div>
        {days.map((d) => (
          <div key={+d} className="flex items-center gap-2 border-b-2 border-t border-b-foreground/80 border-t-vc-line px-3 py-1.5 text-[10px]">
            <span className="border border-vc-line px-1.5 font-semibold">{ASSIGNMENTS.filter((a) => isSameDay(a.due, d)).length}</span> ASSIGNMENTS DUE
          </div>
        ))}
        {COURSES.map((c) => (
          <Row key={c.id}>
            <div className="border-b border-r border-b-vc-line border-r-foreground/80 px-2 py-2">
              <div className="flex items-start gap-2"><span className="mt-1.5 size-2.5 border border-vc-line" />
                <div className="min-w-0">
                  <Link to="/class/$classId" params={{ classId: c.id }} className="block truncate text-[15px] text-vc-link-strong hover:underline">{courseTitle(c)}</Link>
                  {showDetails && <div className="mt-1 space-y-1 text-[12px]"><div className="italic text-muted-foreground">{teacherFull(c.teacherId)}</div>
                    <Link to="/class/$classId" params={{ classId: c.id }} className="block text-foreground/70 hover:underline">view website</Link>
                    <Link to="/grades/$classId" params={{ classId: c.id }} className="block text-foreground/70 hover:underline">view all assignments</Link></div>}
                </div>
              </div>
            </div>
            {days.map((d) => (
              <div key={+d} className="min-h-[92px] space-y-1.5 border-b border-r border-vc-line p-2">
                {ASSIGNMENTS.filter((a) => a.courseId === c.id && isSameDay(a.due, d)).map((a) => (
                  <Popover key={a.id}>
                    <PopoverTrigger className={`flex w-full items-center border border-l-4 border-vc-line text-left text-[10px] shadow-sm ${CATEGORY_TOKEN[a.category]} ${done.includes(a.id) ? "opacity-50" : ""}`}>
                      <span className="flex-1 truncate px-1.5 py-1">{a.category}</span>
                      <span className="bg-vc-tile px-2 py-1 font-semibold text-vc-link-strong">{done.includes(a.id) ? "DONE" : "DUE"}</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-72">
                      <div className="text-xs text-muted-foreground">{a.category} · {courseTitle(c)}</div>
                      <div className="mt-1 font-semibold">{a.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{a.notes}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Due {format(a.due, "EEEE, MMM d")} · {a.points} pts</div>
                      <button onClick={() => toggleDone(a.id)} className="mt-3 w-full bg-vc-success py-1.5 text-sm text-primary-foreground">{done.includes(a.id) ? "Mark as not done" : "Mark as done"}</button>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            ))}
          </Row>
        ))}
      </div>
    </PortalShell>
  );
}
const Row = ({ children }: { children: React.ReactNode }) => <>{children}</>;
