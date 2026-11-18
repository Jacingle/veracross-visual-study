import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { type Course, courseTitle, teacherShort, today } from "@/lib/sis-data";
import { letterFor } from "@/lib/grading";
import { useClassAverage, useStudentAssignments } from "@/lib/school-store";
import { usePortal } from "@/lib/portal-store";

/** Key for a published score change; reading the class grades marks it seen. */
export const updateKey = (id: string, score: number | undefined) => `upd:${id}:${score}`;

export function ClassRow({ c, variant }: { c: Course; variant: "home" | "overview" }) {
  const meets = c.days.includes(today().getDay());
  const av = useClassAverage(c.id);
  
  const { read } = usePortal();
  const fresh = useStudentAssignments().filter((a) => a.courseId === c.id && a.score !== undefined && !read.includes(updateKey(a.id, a.score))).length;
  if (variant === "overview") return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 border-b border-vc-line px-5 pb-6 pt-3.5">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <Link to="/class/$classId" params={{ classId: c.id }} className="text-[24px] font-light text-foreground/80 hover:text-vc-link">{courseTitle(c)}</Link>
        <span className="border border-foreground/70 px-[5px] py-[3px] text-[10px] tracking-wide text-foreground/80">{c.type}</span>
      </div>
      <Link to="/grades/$classId" params={{ classId: c.id }} search={{ tab: "detail" }} className="flex justify-self-end gap-8 text-[24px] font-light text-foreground/85 hover:text-vc-link">
        {av !== null ? <><span>{letterFor(av)}</span><span>{av.toFixed(2)}%</span></> : <span>-</span>}
      </Link>
      <div className="mt-1.5 text-[16px] font-light text-muted-foreground">{teacherShort(c.teacherId)}</div>
      <div className="mt-1.5 flex items-center justify-self-end gap-1.5 text-[14px] text-muted-foreground">
        <span className={`rounded-sm px-1.5 text-[13px] font-semibold ${fresh ? "bg-vc-tile-warm-fg text-primary-foreground" : "bg-vc-line text-foreground"}`}>{fresh}</span> new updates
      </div>
      <div className="mt-2 flex gap-5 text-[13px] text-foreground/80">
        <Link to="/class/$classId" params={{ classId: c.id }} className="hover:text-vc-link">Website</Link>
        <Link to="/calendar" className="hover:text-vc-link">Calendar</Link>
        <Link to="/class/$classId" params={{ classId: c.id }} search={{ tab: "directory" }} className="hover:text-vc-link">Directory</Link>
      </div>
      <Link to="/grades/$classId" params={{ classId: c.id }} className="mt-2 justify-self-end text-[13px] text-foreground/80 hover:text-vc-link">View All Assignments</Link>
    </div>
  );
  // "home" variant: Student Home "My Classes" list.
  return (
    <div className="flex justify-between border-b border-vc-line pb-[25px] pt-[16.5px] last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <Link to="/class/$classId" params={{ classId: c.id }} className="text-[22px] font-light leading-[26px] text-vc-link hover:underline">{courseTitle(c)}</Link>
          <span className="text-[12.5px] italic text-vc-gray">{teacherShort(c.teacherId)}</span>
        </div>
        <div className="mt-[5.5px]">
          {meets
            ? <div className="inline-flex h-[21px] items-center gap-[7px] bg-vc-now pr-3.5 text-[13px] leading-[21px] text-foreground/90"><Clock className="size-3.5 shrink-0 text-vc-gray-dark" /><span><b className="font-semibold">{c.block}:</b> {c.time}</span></div>
            : <div className="flex h-[21px] items-center gap-[7px] text-[13px] leading-[21px] text-vc-gray-light"><Clock className="size-3.5 shrink-0" />Not Scheduled Today</div>}
        </div>
        <div className="mt-1.5 flex gap-[18px] text-[12.5px] leading-[18px] text-vc-gray-dark">
          <Link to="/class/$classId" params={{ classId: c.id }} className="hover:text-vc-link">Website</Link>
          <Link to="/calendar" className="hover:text-vc-link">Calendar</Link>
          <Link to="/class/$classId" params={{ classId: c.id }} search={{ tab: "directory" }} className="hover:text-vc-link">Directory</Link>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <Link to="/grades/$classId" params={{ classId: c.id }} search={{ tab: "detail" }} className="-mr-1.5 flex text-[22px] font-light leading-[26px] text-foreground hover:text-vc-link">
          {av !== null ? <><span className="w-9">{letterFor(av)}</span><span>{av.toFixed(2)}%</span></> : <span>-</span>}
        </Link>
        <div className="mt-[6.5px] flex items-center gap-2 text-[14px] leading-[17px] text-vc-gray-light">
          <span className={`grid h-[17px] min-w-[17px] place-items-center rounded-sm px-1 text-[13px] font-semibold leading-none ${fresh ? "bg-vc-tile-warm-fg text-primary-foreground" : "bg-vc-chip text-foreground"}`}>{fresh}</span> new updates
        </div>
        <Link to="/grades/$classId" params={{ classId: c.id }} className="mt-[11.5px] text-[12.5px] leading-[18px] text-vc-gray-dark hover:text-vc-link">View All Assignments</Link>
      </div>
    </div>
  );
}
