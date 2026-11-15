import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { ASSIGNMENTS, course, courseTitle, today } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/updates")({
  head: () => pageHead("Recent Updates", "Newly graded assignments across your classes."),
  component: Updates,
});

function Updates() {
  const graded = ASSIGNMENTS.filter((a) => a.score !== undefined && a.due < today()).sort((a, b) => +b.due - +a.due).slice(0, 25);
  return (
    <PortalShell>
      <StudentTabs />
      <div className="px-8 py-8">
        <h2 className="mb-6 text-[30px] font-light text-foreground/80">Recent Updates</h2>
        <table className="w-full text-[15px]">
          <thead><tr className="border-b-2 border-foreground/70 text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="py-2">Date</th><th>Class</th><th>Assignment</th><th>Type</th><th className="text-right">Score</th></tr></thead>
          <tbody>{graded.map((a) => (
            <tr key={a.id} className="border-b border-vc-line">
              <td className="py-3">{format(a.due, "MMM d")}</td>
              <td><Link to="/grades/$classId" params={{ classId: a.courseId }} className="text-vc-link-strong hover:underline">{courseTitle(course(a.courseId))}</Link></td>
              <td>{a.title}</td><td className="text-xs">{a.category}</td>
              <td className="text-right font-semibold">{a.score} / {a.points}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </PortalShell>
  );
}
