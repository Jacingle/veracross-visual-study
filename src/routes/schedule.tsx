import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { addDays, format, parseISO, isValid } from "date-fns";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { scheduleFor, today } from "@/lib/sis-data";
import { useStudentAssignments } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/schedule")({
  validateSearch: z.object({ date: z.string().optional(), view: z.enum(["student", "school"]).optional() }),
  head: () => pageHead("Daily Schedule", "Your class schedule for the day, with blocks, rooms and homework."),
  component: Schedule,
});

function Schedule() {
  const { date, view = "student" } = Route.useSearch();
  const nav = useNavigate({ from: "/schedule" });
  const parsed = date ? parseISO(date) : today();
  const d = isValid(parsed) ? parsed : today();
  const go = (n: number) => nav({ search: (p) => ({ ...p, date: format(addDays(d, n), "yyyy-MM-dd") }) });
  const periods = scheduleFor(d);
  const all = useStudentAssignments();
  return (
    <PortalShell portal="student">
      <StudentTabs />
      <div className="relative px-5 pt-5">
        <div className="absolute left-5 flex border border-vc-line shadow-sm">
          <button onClick={() => go(-1)} title="Previous Day" className="px-3.5 py-1.5 hover:bg-vc-panel"><ChevronLeft className="size-4" /></button>
          <label className="relative flex cursor-pointer items-center gap-1 border-x border-vc-line px-3.5 hover:bg-vc-panel">
            <CalendarDays className="size-4" /><ChevronDown className="size-3" />
            <input type="date" className="absolute inset-0 opacity-0" value={format(d, "yyyy-MM-dd")} onChange={(e) => e.target.value && nav({ search: (p) => ({ ...p, date: e.target.value }) })} />
          </label>
          <button onClick={() => go(1)} title="Next Day" className="px-3.5 py-1.5 hover:bg-vc-panel"><ChevronRight className="size-4" /></button>
        </div>
        <div className="absolute right-6 flex border border-vc-line shadow-sm text-[13px] font-semibold">
          <button onClick={() => nav({ search: (p) => ({ ...p, view: "student" }) })} className={`px-3.5 py-1.5 ${view === "student" ? "bg-vc-link text-primary-foreground" : ""}`}>Student Schedule</button>
          <button onClick={() => nav({ search: (p) => ({ ...p, view: "school" }) })} className={`px-3.5 py-1.5 ${view === "school" ? "bg-vc-link text-primary-foreground" : ""}`}>School Schedule</button>
        </div>
        <div className="text-center"><div className="text-[19px] font-semibold text-foreground/80">{format(d, "EEEE, MMM d")}</div><div className="mt-1 text-[15px] text-foreground/75">{format(d, "EEEE")}</div></div>
      </div>
      <div className="px-10 pb-8 pt-7">
        {periods.length === 0 && <p className="py-12 text-center text-[13px] text-muted-foreground">No classes scheduled. <button className="text-vc-link-strong" onClick={() => go(1)}>Next day →</button></p>}
        {periods.map((p, i) => {
          const hw = p.courseId && view === "student" ? all.find((a) => a.courseId === p.courseId && format(a.due, "yyyy-MM-dd") === format(d, "yyyy-MM-dd")) : undefined;
          return (
            <div key={i} className="flex items-start border-b border-vc-line py-2.5">
              <div className="w-[74px] pt-0.5 text-right text-[13px] font-semibold text-foreground/85">{p.time}</div>
              <div className={`ml-5 w-[320px] border-l-[3px] pl-5 ${p.kind === "break" ? "border-cat-quiz" : "border-vc-link"}`}>
                {p.courseId ? <Link to="/class/$classId" params={{ classId: p.courseId }} className="text-[16px] hover:text-vc-link">{p.title}</Link> : <div className="text-[16px]">{p.title}</div>}
                <div className="mt-0.5 text-[13px] text-muted-foreground">{p.detail}</div>
              </div>
              {hw && <><span className="mt-1 border border-foreground/70 px-1.5 py-0.5 text-[10px]">HOMEWORK</span><span className="ml-8 mt-1 text-[13px]">{hw.title}</span></>}
            </div>
          );
        })}
      </div>
    </PortalShell>
  );
}
