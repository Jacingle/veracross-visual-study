import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, format, isSameDay, isWeekend, startOfDay } from "date-fns";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { AssignmentMini } from "@/components/portal/AssignmentDialog";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { categoryColor } from "@/lib/category-colors";
import { courseTitle, today } from "@/lib/sis-data";
import { usePortal } from "@/lib/portal-store";
import { useMySections, useSchool, useStudentAssignments } from "@/lib/school-store";
import { teacherFullNames } from "@/lib/student-presentation";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/assignments")({
  head: () => pageHead("Assignments", "Assignment center: every class's work by day, scrolling back and forward in time."),
  component: Planner,
});

const COL = 158;   // one weekday column
const LEFT = 178;  // the class column

function Planner() {
  const classes = useMySections().filter((c) => c.status === "current");
  const all = useStudentAssignments();
  const { weights, users } = useSchool();
  const { done } = usePortal();
  const [details, setDetails] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);

  // Weekdays only, from three weeks back to ten weeks ahead; the scroller starts at yesterday.
  const days = useMemo(() => {
    const out: Date[] = [];
    for (let i = -21; i <= 70; i++) { const d = addDays(startOfDay(today()), i); if (!isWeekend(d)) out.push(d); }
    return out;
  }, []);
  const anchor = Math.max(0, days.findIndex((d) => +d >= +addDays(startOfDay(today()), -1)));
  const toAnchor = (smooth: boolean) => scroller.current?.scrollTo({ left: anchor * COL, behavior: smooth ? "smooth" : "auto" });
  useEffect(() => { toAnchor(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const by = (n: number) => scroller.current?.scrollBy({ left: n * COL, behavior: "smooth" });

  const linkBtn = "flex items-center gap-1.5 text-[16px] uppercase text-vc-site-blue hover:underline";
  return (
    <PortalShell portal="student" fullWidth>
      <StudentTabs />
      <div className="flex items-center justify-end gap-3 px-6 pb-8 pt-[22px]">
        <button onClick={() => toAnchor(true)} className={linkBtn}>Today</button><span className="text-vc-gray">·</span>
        <button onClick={() => by(-5)} className={linkBtn}><ArrowLeft className="size-4" strokeWidth={3} />Previous</button><span className="text-vc-gray">·</span>
        <button onClick={() => by(5)} className={linkBtn}>Next<ArrowRight className="size-4" strokeWidth={3} /></button>
      </div>
      <div ref={scroller} className="overflow-x-auto pb-1">
        <div className="grid" style={{ gridTemplateColumns: `${LEFT}px repeat(${days.length}, ${COL}px)`, width: LEFT + days.length * COL }}>
          {/* date headings */}
          <div className="sticky left-0 z-10 border-r-2 border-foreground bg-background" />
          {days.map((d) => <div key={+d} className="whitespace-nowrap px-3 pb-2 pt-2.5 text-[15px] leading-5 text-foreground/85">{format(d, "EEEE, MMM d")}</div>)}
          {/* counts */}
          <div className="sticky left-0 z-10 flex items-center justify-between border-b-2 border-r-2 border-t border-foreground border-t-vc-line bg-background px-2 py-1.5 text-[12px] uppercase text-foreground/85"><span>Class details:</span><button type="button" onClick={() => setDetails((v) => !v)} className="hover:underline">+ Show - Hide</button></div>
          {days.map((d) => {
            const n = all.filter((a) => isSameDay(a.due, d)).length;
            return <div key={+d} className="flex items-center gap-2 whitespace-nowrap border-b-2 border-t border-foreground border-t-vc-line px-3 py-1.5 text-[12px] uppercase text-foreground/85"><span className="grid h-[22px] min-w-[22px] place-items-center rounded-[2px] border border-vc-gray-light bg-background px-1 text-[12px] font-semibold">{n}</span>Assignments due</div>;
          })}
          {/* one row per class */}
          {classes.map((c) => (
            <ClassCells key={c.id}>
              <div className="sticky left-0 z-10 min-h-[80px] overflow-hidden border-b border-r-2 border-b-vc-line border-r-foreground bg-background px-2 py-1">
                <div className="flex items-start gap-2.5">
                  <span className="mt-1.5 size-3.5 shrink-0 border border-vc-line bg-vc-panel" />
                  <div className="min-w-0">
                    <Link to="/class/$classId" params={{ classId: c.id }} target="_blank" rel="noopener noreferrer" className="block whitespace-nowrap text-[18px] font-light leading-6 text-vc-site-blue">{courseTitle(c)}</Link>
                    {details && <div className="text-[13.5px] leading-[19px]">
                      <div className="italic text-vc-gray">{teacherFullNames(c.teacherIds, users.map((u) => ({ ...u, id: u.personId })))}</div>
                      <Link to="/class/$classId" params={{ classId: c.id }} target="_blank" rel="noopener noreferrer" className="block text-vc-gray-dark hover:underline">view website</Link>
                      <Link to="/grades/$classId" params={{ classId: c.id }} className="block text-vc-gray-dark hover:underline">view all assignments</Link>
                    </div>}
                  </div>
                </div>
              </div>
              {days.map((d) => (
                <div key={+d} className={`min-h-[80px] space-y-1.5 border-b border-vc-line px-[7px] py-[7px] ${isSameDay(d, today()) ? "bg-vc-now" : ""} ${d.getDay() === 5 ? "border-r" : ""}`}>
                  {all.filter((a) => a.courseId === c.id && isSameDay(a.due, d)).map((a) => (
                    <Popover key={a.id}>
                      <PopoverTrigger className="flex h-[19px] w-full items-stretch border border-vc-gray-light/70 bg-background text-left text-[12px] uppercase shadow-[0_1px_2px_rgba(0,0,0,.15)]">
                        <span className="w-1 shrink-0" style={{ background: categoryColor(weights[a.courseId], a.category) }} />
                        <span className="min-w-0 flex-1 truncate px-1.5 leading-[17px]">{a.category}</span>
                        <span className="bg-vc-sky px-3 text-[12px] font-bold leading-[17px] text-vc-site-blue">{done.includes(a.id) ? "Done" : "Due"}</span>
                      </PopoverTrigger>
                      <PopoverContent align="start" sideOffset={6} className="w-[330px] max-w-[calc(100vw-2rem)] rounded-none border-2 border-foreground bg-background p-0 shadow-[0_2px_10px_rgba(0,0,0,.35)]">
                        <AssignmentMini assignment={a} close={<PopoverClose aria-label="Close" className="grid size-5 place-items-center outline-none"><X className="size-4" strokeWidth={4} /></PopoverClose>} />
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>
              ))}
            </ClassCells>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}

const ClassCells = ({ children }: { children: React.ReactNode }) => <>{children}</>;
