import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { format } from "date-fns";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { ASSIGNMENTS, COURSES, courseTitle, teacherFull } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/grades/$classId")({
  loader: ({ params }) => { const c = COURSES.find((x) => x.id === params.classId); if (!c) throw notFound(); return { c }; },
  head: ({ loaderData }) => pageHead(loaderData ? `${courseTitle(loaderData.c)} Grades` : "Grades", "Grade detail and all assignments for this class."),
  component: Grades,
});

function Grades() {
  const { c } = Route.useLoaderData();
  const list = ASSIGNMENTS.filter((a) => a.courseId === c.id).sort((a, b) => +b.due - +a.due);
  return (
    <PortalShell>
      <StudentTabs />
      <div className="px-8 py-8">
        <div className="flex items-end justify-between border-b border-vc-line pb-4">
          <div><h2 className="text-[30px] font-light">{courseTitle(c)}</h2><div className="text-muted-foreground">{teacherFull(c.teacherId)} · {c.block} · {c.room}</div></div>
          <div className="text-[34px] font-light">{c.letter} <span className="ml-3">{c.pct.toFixed(2)}%</span></div>
        </div>
        <table className="mt-4 w-full text-[15px]">
          <thead><tr className="border-b-2 border-foreground/70 text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="py-2">Due</th><th>Assignment</th><th>Type</th><th className="text-right">Score</th><th className="text-right">%</th></tr></thead>
          <tbody>{list.map((a) => (
            <tr key={a.id} className="border-b border-vc-line"><td className="py-3">{format(a.due, "EEE, MMM d")}</td><td>{a.title}</td><td className="text-xs">{a.category}</td>
              <td className="text-right">{a.score !== undefined ? `${a.score} / ${a.points}` : <span className="text-muted-foreground">—</span>}</td>
              <td className="text-right font-semibold">{a.score !== undefined ? `${Math.round((a.score / a.points) * 100)}%` : ""}</td></tr>))}</tbody>
        </table>
        <Link to="/classes" className="mt-6 inline-block text-vc-link-strong hover:underline">← Back to Classes & Reports</Link>
      </div>
    </PortalShell>
  );
}
