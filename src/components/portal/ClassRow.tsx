import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { type Course, courseTitle, teacherShort } from "@/lib/sis-data";

export function ClassRow({ c, variant }: { c: Course; variant: "home" | "overview" }) {
  return (
    <div className="flex justify-between border-b border-vc-line py-7 last:border-b-0">
      <div>
        <div className="flex items-baseline gap-3">
          <Link to="/class/$classId" params={{ classId: c.id }}
            className={variant === "home" ? "text-[28px] font-light text-vc-link hover:underline" : "text-[27px] font-light text-foreground/80 hover:text-vc-link"}>
            {courseTitle(c)}
          </Link>
          {variant === "home" ? <span className="italic text-muted-foreground">{teacherShort(c.teacherId)}</span>
            : <span className="border border-foreground/70 px-1.5 py-0.5 text-[11px] tracking-wide text-foreground/80">{c.type}</span>}
        </div>
        {variant === "home"
          ? <div className="mt-2 flex items-center gap-2 text-muted-foreground"><Clock className="size-4" /> Not Scheduled Today</div>
          : <div className="mt-3 text-lg text-muted-foreground">{teacherShort(c.teacherId)}</div>}
        <div className="mt-3 flex gap-6 text-[15px] text-foreground/80">
          <Link to="/class/$classId" params={{ classId: c.id }} className="hover:text-vc-link">Website</Link>
          <Link to="/calendar" className="hover:text-vc-link">Calendar</Link>
          <Link to="/class/$classId" params={{ classId: c.id }} search={{ tab: "directory" }} className="hover:text-vc-link">Directory</Link>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <Link to="/grades/$classId" params={{ classId: c.id }} className="flex gap-5 text-[28px] font-light text-foreground/85 hover:text-vc-link">
          <span>{c.letter}</span><span>{c.pct.toFixed(2)}%</span>
        </Link>
        <div className="mt-1 flex items-center gap-2 text-muted-foreground">
          <span className="rounded-sm bg-vc-line px-1.5 text-sm font-semibold text-foreground">0</span> new updates
        </div>
        <Link to="/grades/$classId" params={{ classId: c.id }} className="mt-3 text-[15px] text-foreground/80 hover:text-vc-link">View All Assignments</Link>
      </div>
    </div>
  );
}
