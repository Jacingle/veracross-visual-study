import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { type Course, courseTitle, teacherShort, today } from "@/lib/sis-data";
import { letterFor } from "@/lib/grading";
import { useClassAverage } from "@/lib/school-store";

export function ClassRow({ c, variant }: { c: Course; variant: "home" | "overview" }) {
  const meets = c.days.includes(today().getDay());
  const av = useClassAverage(c.id);
  return (
    <div className="flex justify-between border-b border-vc-line py-5 last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2.5">
          <Link to="/class/$classId" params={{ classId: c.id }}
            className={variant === "home" ? "text-[22px] font-light text-vc-link hover:underline" : "text-[21px] font-light text-foreground/80 hover:text-vc-link"}>
            {courseTitle(c)}
          </Link>
          {variant === "home" ? <span className="text-[13px] italic text-muted-foreground">{teacherShort(c.teacherId)}</span>
            : <span className="border border-foreground/70 px-1 py-px text-[10px] tracking-wide text-foreground/80">{c.type}</span>}
        </div>
        {variant === "home"
          ? <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground"><Clock className="size-3.5" /> {meets ? `${c.time} • ${c.block} • ${c.room}` : "Not Scheduled Today"}</div>
          : <div className="mt-2 text-[15px] text-muted-foreground">{teacherShort(c.teacherId)}</div>}
        <div className="mt-2.5 flex gap-5 text-[13px] text-foreground/80">
          <Link to="/class/$classId" params={{ classId: c.id }} className="hover:text-vc-link">Website</Link>
          <Link to="/calendar" className="hover:text-vc-link">Calendar</Link>
          <Link to="/class/$classId" params={{ classId: c.id }} search={{ tab: "directory" }} className="hover:text-vc-link">Directory</Link>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <Link to="/grades/$classId" params={{ classId: c.id }} search={{ tab: "detail" }} className="flex gap-4 text-[22px] font-light text-foreground/85 hover:text-vc-link">
          {av !== null ? <><span>{letterFor(av)}</span><span>{av.toFixed(2)}%</span></> : <span className="text-[15px] text-muted-foreground">No grades yet</span>}
        </Link>
        <div className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className="rounded-sm bg-vc-line px-1 text-[12px] font-semibold text-foreground">0</span> new updates
        </div>
        <Link to="/grades/$classId" params={{ classId: c.id }} className="mt-2.5 text-[13px] text-foreground/80 hover:text-vc-link">View All Assignments</Link>
      </div>
    </div>
  );
}
