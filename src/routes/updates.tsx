import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { course, courseTitle, today } from "@/lib/sis-data";
import { useMySections, useStudentAssignments } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/updates")({
  head: () => pageHead("Recent Updates", "Newly graded assignments across your classes."),
  component: Updates,
});

function Updates() {
  const all = useStudentAssignments();
  const sections = useMySections();
  const graded = all.filter((a) => a.score !== undefined && a.due < today()).sort((a, b) => +b.due - +a.due).slice(0, 25);
  return (
    <PortalShell portal="student">
      <StudentTabs />
      <div className="px-6 py-6">
        <h2 className="mb-4 text-[24px] font-light text-foreground/80">Recent Updates</h2>
        <table className="w-full text-[13px]">
          <thead><tr className="border-b-2 border-foreground/70 text-left text-[11px] uppercase tracking-wide text-muted-foreground"><th className="py-1.5">Date</th><th>Class</th><th>Assignment</th><th>Type</th><th className="text-right">Score</th></tr></thead>
          <tbody>{graded.map((a) => (
            <tr key={a.id} className="border-b border-vc-line">
              <td className="py-2">{format(a.due, "MMM d")}</td>
              <td><Link to="/grades/$classId" params={{ classId: a.courseId }} className="text-vc-link-strong hover:underline">{sections.find((c) => c.id === a.courseId)?.name ?? a.courseId}</Link></td>
              <td>{a.title}</td><td className="text-[11px]">{a.category}</td>
              <td className="text-right font-semibold">{a.score} / {a.points}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </PortalShell>
  );
}
