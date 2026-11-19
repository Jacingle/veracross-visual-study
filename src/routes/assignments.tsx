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

const COL = 159;   // one weekday column
const LEFT = 177;  // the class column

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

  const linkBtn = "flex items-center gap-1.5 text-[14.5px] uppercase text-vc-site-blue hover:underline";
  return (
    <PortalShell portal="student" fullWidth>
      <StudentTabs compact />
      <div className="flex items-center justify-end gap-3 pl-6 pr-7 pb-[22px] pt-[7px]">
        <button onClick={() => toAnchor(true)} className={linkBtn}>Today</button><span className="text-vc-gray">·</span>
        <button onClick={() => by(-5)} className={linkBtn}><ArrowLeft className="size-4" strokeWidth={3} />Previous</button><span className="text-vc-gray">·</span>
        <button onClick={() => by(5)} className={linkBtn}>Next<ArrowRight className="size-4" strokeWidth={3} /></button>
      </div>
      <div ref={scroller} className="overflow-x-auto pb-1">
        <div className="grid" style={{ gridTemplateColumns: `${LEFT}px repeat(${days.length}, ${COL}px)`, width: LEFT + days.length * COL }}>
          {/* date headings */}
          <div className="sticky left-0 z-10 border-r-2 border-foreground bg-background" />
          {days.map((d) => <div key={+d} className={`whitespace-nowrap px-2.5 pb-[3px] pt-[3px] text-[15px] leading-[17px] text-foreground/85 ${d.getDay() === 5 ? "border-r border-vc-line" : ""}`}>{format(d, "EEEE, MMM d")}</div>)}
          {/* counts */}
          <div className="sticky left-0 z-10 flex items-center justify-between border-b-2 border-r-2 border-t border-foreground border-t-vc-line bg-background px-[5px] py-[2px] text-[12px] uppercase text-foreground/85"><span>Class details:</span><button type="button" onClick={() => setDetails((v) => !v)} className="hover:underline">+ Show - Hide</button></div>
          {days.map((d) => {
            const n = all.filter((a) => isSameDay(a.due, d)).length;
            return <div key={+d} className={`flex items-center gap-2 whitespace-nowrap border-b-2 border-t border-foreground border-t-vc-line px-2.5 py-[2px] text-[12px] uppercase text-foreground/85 ${d.getDay() === 5 ? "border-r border-r-vc-line" : ""}`}><span className="grid h-[17px] min-w-[17px] place-items-center rounded-[2px] border border-vc-gray-light bg-background px-1 text-[11px] leading-none font-semibold">{n}</span>Assignments due</div>;
          })}
          {/* one row per class */}
          {classes.map((c) => (
            <ClassCells key={c.id}>
              <div className="sticky left-0 z-10 min-h-[80px] overflow-hidden border-b border-r-2 border-b-vc-line border-r-foreground bg-background pl-[5px] pr-[5px] py-0">
                <div className="flex items-start gap-2">
                  <span className="mt-[7px] size-2.5 shrink-0 border border-vc-line bg-vc-panel" />
                  <div className="min-w-0">
                    <Link to="/class/$classId" params={{ classId: c.id }} target="_blank" rel="noopener noreferrer" className="block max-w-[131px] overflow-hidden whitespace-nowrap text-[16px] font-light leading-6 text-vc-site-blue">{courseTitle(c)}</Link>
                    {details && <div className="text-[12.5px] leading-[18px]">
                      <div className="italic text-vc-gray">{teacherFullNames(c.teacherIds, users.map((u) => ({ ...u, id: u.personId })))}</div>
                      <Link to="/class/$classId" params={{ classId: c.id }} target="_blank" rel="noopener noreferrer" className="block text-vc-gray-dark hover:underline">view website</Link>
                      <Link to="/grades/$classId" params={{ classId: c.id }} className="block text-vc-gray-dark hover:underline">view all assignments</Link>
                    </div>}
                  </div>
                </div>
              </div>
              {days.map((d) => (
                <div key={+d} className={`min-h-[80px] space-y-[7.5px] border-b border-vc-line pb-2 pl-2.5 pr-1.5 pt-2 ${isSameDay(d, today()) ? "bg-vc-now" : ""} ${d.getDay() === 5 ? "border-r" : ""}`}>
                  {all.filter((a) => a.courseId === c.id && isSameDay(a.due, d)).map((a) => (
                    <Popover key={a.id}>
                      <PopoverTrigger className="flex h-[19px] w-full items-stretch border border-vc-gray-light/70 bg-background text-left text-[11.5px] uppercase shadow-[0_1px_2px_rgba(0,0,0,.15)]">
                        <span className="w-[3px] shrink-0" style={{ background: categoryColor(weights[a.courseId], a.category) }} />
                        <span className="min-w-0 flex-1 truncate px-1.5 leading-[17px]">{a.category}</span>
                        <span className="min-w-[33px] bg-vc-sky px-1.5 text-center text-[12px] font-bold leading-[17px] text-vc-site-blue">{done.includes(a.id) ? "Done" : "Due"}</span>
                      </PopoverTrigger>
                      <PopoverContent side="right" align="start" sideOffset={-8} alignOffset={2} className="w-[325px] max-w-[calc(100vw-2rem)] rounded-none border-2 border-foreground bg-background p-0 shadow-[0_2px_10px_rgba(0,0,0,.35)]">
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
