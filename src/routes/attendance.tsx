import { createFileRoute } from "@tanstack/react-router";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { COURSES, courseTitle } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/attendance")({
  head: () => pageHead("Attendance", "Semester 1 attendance summary by class."),
  component: () => (
    <PortalShell>
      <StudentTabs />
      <div className="px-8 py-8">
        <h2 className="mb-6 text-[30px] font-light text-foreground/80">Attendance · Semester 1</h2>
        <table className="w-full text-[15px]"><thead><tr className="border-b-2 border-foreground/70 text-left text-xs uppercase text-muted-foreground"><th className="py-2">Class</th><th className="text-right">Present</th><th className="text-right">Tardy</th><th className="text-right">Excused</th><th className="text-right">Unexcused</th></tr></thead>
          <tbody>{COURSES.map((c, i) => <tr key={c.id} className="border-b border-vc-line"><td className="py-3">{courseTitle(c)}</td><td className="text-right">{38 - (i % 3)}</td><td className="text-right">{i % 2}</td><td className="text-right">{i % 3 === 0 ? 1 : 0}</td><td className="text-right">0</td></tr>)}</tbody></table>
      </div>
    </PortalShell>
  ),
});
