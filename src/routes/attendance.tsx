import { createFileRoute } from "@tanstack/react-router";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { courseTitle } from "@/lib/sis-data";
import { useMySections, useSchool } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/attendance")({
  head: () => pageHead("Attendance", "Attendance totals by class, as taken by your teachers."),
  component: Att,
});

const COLS = ["Present", "Tardy", "Absent - Excused", "Absent - Unexcused"];
function Att() {
  const { attendance, attDone, user } = useSchool();
  const mine = useMySections().filter((c) => c.status === "current");
  const sid = user?.personId || "me";
  return (
    <PortalShell portal="student">
      <StudentTabs />
      <div className="px-6 py-6">
        <h2 className="mb-4 text-[24px] font-light text-foreground/80">Attendance</h2>
        <table className="w-full text-[13px]"><thead><tr className="border-b-2 border-foreground/70 text-left text-[11px] uppercase text-muted-foreground"><th className="py-1.5">Class</th>{COLS.map((h) => <th key={h} className="text-right">{h}</th>)}</tr></thead>
          <tbody>{mine.map((c) => {
            const vals = Object.entries(attendance).filter(([k]) => k.startsWith(`${c.id}|`) && k.endsWith(`|${sid}`)).map(([, v]) => v);
            // Days marked complete count as Present unless the teacher recorded something else.
            const days = attDone.filter((k) => k.startsWith(`${c.id}|`)).map((k) => k.split("|")[1]);
            const count = (h: string) => h === "Present" ? days.filter((d) => (attendance[`${c.id}|${d}|${sid}`] ?? "Present") === "Present").length : vals.filter((v) => v === h).length;
            return <tr key={c.id} className="border-b border-vc-line"><td className="py-2">{courseTitle(c)}</td>{COLS.map((h) => <td key={h} className="text-right">{count(h)}</td>)}</tr>;
          })}</tbody></table>
        <p className="mt-3 text-[12px] text-muted-foreground">Counts update as teachers take attendance in each class.</p>
      </div>
    </PortalShell>
  );
}
