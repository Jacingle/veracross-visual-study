import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { COURSES, ME, SCHOOL, courseTitle, teacherFull } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/report-card")({
  head: () => pageHead("Progress Report", "Mid-Semester 1 progress report."),
  component: () => (
    <PortalShell>
      <StudentTabs />
      <div className="px-10 py-8">
        <div className="flex justify-between border-b-2 border-foreground/70 pb-4">
          <div><div className="text-sm uppercase tracking-wider text-muted-foreground">{SCHOOL.name} · Progress Report</div><h2 className="text-[30px] font-light">Mid-Semester 1 · {ME.first} {ME.last}</h2><div className="text-muted-foreground">Grade {ME.grade} · Advisor: {teacherFull(ME.advisorId)}</div></div>
          <button onClick={() => window.print()} className="flex h-10 items-center gap-2 border border-vc-line px-4 text-vc-link-strong"><Printer className="size-4" />Print / Save PDF</button>
        </div>
        {COURSES.map((c) => (
          <div key={c.id} className="border-b border-vc-line py-5"><div className="flex justify-between"><div className="text-[20px]">{courseTitle(c)} <span className="text-sm text-muted-foreground">· {teacherFull(c.teacherId)}</span></div><div className="text-[22px]">{c.letter}</div></div>
            <p className="mt-2 text-foreground/80">{ME.first} has been an engaged participant this term, demonstrating steady growth and thoughtful preparation for class discussions.</p></div>
        ))}
      </div>
    </PortalShell>
  ),
});
