import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { type Course, courseTitle, teacherShort, today } from "@/lib/sis-data";
import { letterFor } from "@/lib/grading";
import { useClassAverage, useSchool, useStudentAssignments } from "@/lib/school-store";
import { usePortal } from "@/lib/portal-store";

/** Key for a published score change; reading the class grades marks it seen. */
export const updateKey = (id: string, score: number | undefined) => `upd:${id}:${score}`;

export function ClassRow({ c, variant }: { c: Course; variant: "home" | "overview" }) {
  const meets = c.days.includes(today().getDay());
  const av = useClassAverage(c.id);
  const { courses, sections } = useSchool();
  const { read } = usePortal();
  const fresh = useStudentAssignments().filter((a) => a.courseId === c.id && a.score !== undefined && !read.includes(updateKey(a.id, a.score))).length;
  void courses; const _c = .find((x) => x.id === sections.find((section) => section.id === c.id)?.courseNo)?.credits; void _c;
  return (
    <div className="flex justify-between border-b border-vc-line mx-2 px-7 py-6 last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2.5">
          <Link to="/class/$classId" params={{ classId: c.id }}
            className={variant === "home" ? "text-[22px] font-light text-vc-link hover:underline" : "text-[24px] font-light text-foreground/80 hover:text-vc-link"}>
            {courseTitle(c)}
          </Link>
          {variant === "home" ? <span className="text-[13px] italic text-muted-foreground">{teacherShort(c.teacherId)}</span>
            : <span className="border border-foreground/70 px-1 py-px text-[10px] tracking-wide text-foreground/80">{c.type}</span>}
        </div>
        {variant === "home"
          ? <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground"><Clock className="size-3.5" /> {meets ? `${c.time} • ${c.block} • ${c.room}` : "Not Scheduled Today"}</div>
          : <div className="mt-2.5 text-[16px] font-light text-muted-foreground">{teacherShort(c.teacherId)}</div>}
        <div className="mt-3 flex gap-5 text-[14px] text-foreground/80">
          <Link to="/class/$classId" params={{ classId: c.id }} className="hover:text-vc-link">Website</Link>
          <Link to="/calendar" className="hover:text-vc-link">Calendar</Link>
          <Link to="/class/$classId" params={{ classId: c.id }} search={{ tab: "directory" }} className="hover:text-vc-link">Directory</Link>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <Link to="/grades/$classId" params={{ classId: c.id }} search={{ tab: "detail" }} className="flex gap-8 text-[24px] font-light text-foreground/85 hover:text-vc-link">
          {av !== null ? <><span>{letterFor(av)}</span><span>{av.toFixed(2)}%</span></> : <span>-</span>}
        </Link>
        <div className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className={`rounded-sm px-1 text-[12px] font-semibold ${fresh ? "bg-vc-tile-warm-fg text-primary-foreground" : "bg-vc-line text-foreground"}`}>{fresh}</span> new updates
        </div>
        <Link to="/grades/$classId" params={{ classId: c.id }} className="mt-2.5 text-[13px] text-foreground/80 hover:text-vc-link">View All Assignments</Link>
      </div>
    </div>
  );
}
