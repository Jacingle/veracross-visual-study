import { Link } from "@tanstack/react-router";
import { fmtGrade } from "@/lib/fmt-grade";
import { Clock } from "lucide-react";
import { type Course, courseTitle, teacherShort, today } from "@/lib/sis-data";
import { letterFor } from "@/lib/grading";
import { staffIds, useClassAverage, useStudentAssignments, useSchool } from "@/lib/school-store";
import { teacherNames } from "@/lib/student-presentation";
import { usePortal } from "@/lib/portal-store";

/** Key for a published score change; reading the class grades marks it seen. */
export const updateKey = (id: string, score: number | undefined) => `upd:${id}:${score}`;

export function ClassRow({ c, variant }: { c: Course; variant: "home" | "overview" }) {
  const meets = c.days.includes(today().getDay());
  const av = useClassAverage(c.id);
  const { users, sections } = useSchool();
  const section = sections.find((s) => s.id === c.id);
  const faculty = teacherNames(section ? staffIds(section) : [c.teacherId], users.map((u) => ({ ...u, id: u.personId })));
  
  const { read } = usePortal();
  const fresh = useStudentAssignments().filter((a) => a.courseId === c.id && a.score !== undefined && !read.includes(updateKey(a.id, a.score))).length;
  const grade = av !== null
    ? <>{variant === "overview" ? <span className="w-[22px] text-right">{letterFor(av)}</span> : <span className="w-9">{letterFor(av)}</span>}<span>{fmtGrade(av)}%</span></>
    : <span>-</span>;
  const updates = (
    <Link to="/grades/$classId" params={{ classId: c.id }} search={{ filter: "updates" }} className={`flex items-center text-[16px] leading-[22px] hover:underline ${fresh ? "text-vc-tile-warm-fg" : "text-vc-gray-light"}`}>
      <span className={`mr-[5px] inline-grid h-[20px] min-w-[19px] place-items-center rounded-[4px] px-[5px] text-[14px] font-semibold leading-none ${fresh ? "bg-vc-badge-warm text-vc-badge-warm-fg" : "bg-vc-badge font-medium text-vc-badge-fg"}`}>{fresh}</span>new updates
    </Link>
  );
  const tools = (
    <>
      <Link to="/class/$classId" params={{ classId: c.id }} target="_blank" rel="noopener noreferrer" className="hover:underline">Website</Link>
      <Link to="/calendar" className="hover:underline">Calendar</Link>
      <Link to="/class/$classId" params={{ classId: c.id }} search={{ tab: "directory" }} target="_blank" rel="noopener noreferrer" className="hover:underline">Directory</Link>
    </>
  );
  // Class names and grades have no hover effect; only the small links underline on hover.
  if (variant === "overview") return (
    <div className="flex justify-between border-b border-vc-line px-5 pb-6 pt-[18px] last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-center gap-3.5">
          <Link to="/class/$classId" params={{ classId: c.id }} target="_blank" rel="noopener noreferrer" className="text-[22px] font-light leading-[26px] text-foreground/90">{courseTitle(c)}</Link>
          <span className="border border-foreground/80 px-[5px] py-[3px] text-[10px] leading-[15px] tracking-wide text-foreground/80">{c.type}</span>
        </div>
        <div className="mt-[9px] text-[16px] font-light leading-6 text-vc-gray-dark">{faculty}</div>
        <div className="mt-[9px] flex gap-[18px] text-[12.5px] leading-[18px] text-vc-gray-dark">{tools}</div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <Link to="/grades/$classId" params={{ classId: c.id }} search={{ tab: "detail" }} className="flex gap-6 text-[22px] font-light leading-[26px] text-foreground">{grade}</Link>
        <div className="mt-[10.5px]">{updates}</div>
        <Link to="/grades/$classId" params={{ classId: c.id }} className="mt-[12.5px] text-[12.5px] leading-[18px] text-vc-gray-dark hover:underline">View All Assignments</Link>
      </div>
    </div>
  );
  // "home" variant: Student Home "My Classes" list.
  return (
    <div className="flex justify-between border-b border-vc-line pb-[25px] pt-[16.5px] last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <Link to="/class/$classId" params={{ classId: c.id }} target="_blank" rel="noopener noreferrer" className="text-[22px] font-light leading-[26px] text-vc-link">{courseTitle(c)}</Link>
          <span className="text-[12.5px] italic text-vc-gray">{faculty}</span>
        </div>
        <div className="mt-[5.5px]">
          {meets
            ? <div className="inline-flex h-[21px] items-center gap-[7px] bg-vc-now pr-3.5 text-[13px] leading-[21px] text-foreground/90"><Clock className="size-3.5 shrink-0 text-vc-gray-dark" /><span><b className="font-semibold">{c.block}:</b> {c.time}</span></div>
            : <div className="flex h-[21px] items-center gap-[7px] text-[13px] leading-[21px] text-vc-gray-light"><Clock className="size-3.5 shrink-0" />Not Scheduled Today</div>}
        </div>
        <div className="mt-1.5 flex gap-[18px] text-[12.5px] leading-[18px] text-vc-gray-dark">{tools}</div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <Link to="/grades/$classId" params={{ classId: c.id }} search={{ tab: "detail" }} className="-mr-1.5 flex text-[22px] font-light leading-[26px] text-foreground">{grade}</Link>
        <div className="mt-[6.5px]">{updates}</div>
        <Link to="/grades/$classId" params={{ classId: c.id }} className="mt-[11.5px] text-[12.5px] leading-[18px] text-vc-gray-dark hover:underline">View All Assignments</Link>
      </div>
    </div>
  );
}
