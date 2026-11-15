import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { ME, SCHOOL, courseTitle, teacherFull } from "@/lib/sis-data";
import { useSchool , useMySections } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/report-card")({
  head: () => pageHead("Progress Report", "Mid-Semester 1 progress report."),
  component: Report,
});

function Report() {
  const COURSES = useMySections().filter((c) => c.status === "current");
  const { comments, termGrades } = useSchool();
  return (
    <PortalShell portal="student">
      <StudentTabs />
      <div className="px-8 py-6">
        <div className="flex justify-between border-b-2 border-foreground/70 pb-3">
          <div><div className="text-[12px] uppercase tracking-wider text-muted-foreground">{SCHOOL.name} · Progress Report</div><h2 className="text-[24px] font-light">Mid-Semester 1 · {ME.first} {ME.last}</h2><div className="text-[13px] text-muted-foreground">Grade {ME.grade} · Advisor: {teacherFull(ME.advisorId)}</div></div>
          <button onClick={() => window.print()} className="flex h-8 items-center gap-2 border border-vc-line px-3 text-[13px] text-vc-link-strong"><Printer className="size-4" />Print / Save PDF</button>
        </div>
        {COURSES.map((c) => (
          <div key={c.id} className="border-b border-vc-line py-4"><div className="flex justify-between"><div className="text-[16px]">{courseTitle(c)} <span className="text-[13px] text-muted-foreground">· {teacherFull(c.teacherId)}</span></div><div className="text-[18px]">{termGrades[`${c.id}|me|MS1`] || c.letter}</div></div>
            <p className="mt-1.5 whitespace-pre-line text-[14px] text-foreground/80">{comments[`${c.id}|me|MS1`] || `${ME.first} has been an engaged participant this term, demonstrating steady growth and thoughtful preparation for class discussions.`}</p></div>
        ))}
      </div>
    </PortalShell>
  );
}
