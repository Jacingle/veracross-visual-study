import { createFileRoute } from "@tanstack/react-router";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { AssignmentDialog } from "@/components/portal/AssignmentDialog";
import { events, today, type Assignment } from "@/lib/sis-data";
import { useSchool, useStudentAssignments } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/calendar")({
  head: () => pageHead("My Calendar", "Month, week and day views of school events and assignments due."),
  component: Cal,
});

type View = "day" | "week" | "month";
const VIEWS: View[] = ["day", "week", "month"];

function Cal() {
  const { user } = useSchool();
  const all = useStudentAssignments();
  const [view, setView] = useState<View>("month");
  const [cur, setCur] = useState(today());
  const [sel, setSel] = useState<Assignment | null>(null);
  const student = user?.role === "student";
  const hw = student ? all : [];
  const evs = events();

  const step = (n: number) => setCur(view === "month" ? addMonths(cur, n) : addDays(cur, n * (view === "week" ? 7 : 1)));
  const days = view === "month" ? eachDayOfInterval({ start: startOfWeek(startOfMonth(cur)), end: endOfWeek(endOfMonth(cur)) })
    : view === "week" ? eachDayOfInterval({ start: startOfWeek(cur), end: endOfWeek(cur) }) : [cur];
  const title = view === "month" ? format(cur, "MMMM yyyy")
    : view === "week" ? `${format(days[0] ?? cur, "MMM d")} – ${format(days[days.length - 1] ?? cur, "MMM d, yyyy")}` : format(cur, "EEEE, MMMM d, yyyy");
  const minH = view === "month" ? "min-h-[154px]" : "min-h-[320px]";

  return (
    <PortalShell fullWidth>
      <div className="px-3.5 pb-[18px] pt-[22px] text-[20px] font-normal leading-7 text-foreground/85">{student ? "Student Calendar" : "My Calendar"}</div>
      <div className="relative flex min-h-[52px] flex-wrap items-center justify-between gap-y-2 border-t border-vc-line pr-0">
        <div className="flex items-center">
          <button aria-label="Previous" onClick={() => step(-1)} className="grid h-9 w-[54px] place-items-center text-foreground"><ChevronLeft className="size-[18px]" strokeWidth={3} /></button>
          <button aria-label="Next" onClick={() => step(1)} className="grid h-9 w-[54px] place-items-center text-foreground"><ChevronRight className="size-[18px]" strokeWidth={3} /></button>
          <button onClick={() => setCur(today())} className="ml-[26px] text-[18px] text-vc-gray hover:text-foreground">Today</button>
        </div>
        <h2 className="pointer-events-none order-last w-full text-center text-[24px] font-semibold leading-8 text-foreground/80 sm:absolute sm:left-1/2 sm:top-2.5 sm:order-none sm:w-auto sm:-translate-x-1/2 sm:whitespace-nowrap">{title}</h2>
        <div className="flex h-[26px] items-stretch self-start text-[17px]">
          {VIEWS.map((v) => <button key={v} onClick={() => setView(v)} className={`px-[18px] capitalize ${view === v ? "bg-foreground text-background" : "text-foreground/85 hover:bg-vc-panel"}`}>{v}</button>)}
        </div>
      </div>
      <div className="px-0 pb-6 pt-[34px]">
        <div className={`grid ${view === "day" ? "grid-cols-1" : "grid-cols-7"}`}>
          {days.slice(0, view === "day" ? 1 : 7).map((d) => (
            <div key={`h${+d}`} className="px-2 pb-1.5 text-right text-[16px] leading-6 text-foreground/80"><span className="hidden lg:inline">{format(d, "EEEE")}</span><span className="lg:hidden">{format(d, "EEE")}</span></div>
          ))}
        </div>
        <div className={`grid border-t border-vc-line ${view === "day" ? "grid-cols-1" : "grid-cols-7"}`}>
          {days.map((d) => {
            const dayEvents = evs.filter((e) => isSameDay(e.date, d));
            const due = hw.filter((a) => isSameDay(a.due, d));
            return (
              <div key={+d} className={`min-w-0 border-b border-r border-vc-line px-1 pb-1 text-[13px] leading-[15px] last:border-r-0 ${minH} ${isSameDay(d, today()) ? "bg-vc-now" : ""} ${view === "month" && !isSameMonth(d, cur) ? "text-vc-gray" : ""}`}>
                <div className="pr-1 pt-1 text-right text-[15px] leading-5">{format(d, "d")}</div>
                <div className="mt-1 space-y-[1px]">
                  {dayEvents.map((e) => e.time
                    ? <div key={e.title} className="truncate text-vc-event-green"><b className="font-semibold text-foreground">{e.time} </b>{e.title}</div>
                    : <div key={e.title} className="truncate rounded-[3px] bg-vc-event-green px-1 py-px text-primary-foreground">{e.title}</div>)}
                  {due.map((a) => <button key={a.id} type="button" onClick={() => setSel(a)} className="block w-full truncate text-left text-vc-event hover:underline">* {a.courseId}.{a.short}</button>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <AssignmentDialog assignment={sel} onClose={() => setSel(null)} />
    </PortalShell>
  );
}
