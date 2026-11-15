import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { ALL_SECTIONS, courseTitle, teacherFull, teacherRoster } from "@/lib/sis-data";
import { defaultWeights, letterFor, weightedAverage } from "@/lib/grading";
import { scoreOf } from "@/lib/gradebook";
import { useSchool, useSectionAssignments } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

const FLAGS = [
  ["gpa", "Include in GPA", true], ["report", "Show on Report Card", true], ["transcript", "Show on Transcript", true],
  ["portal", "Display Grades on Portals", true], ["website", "Enable Class Website", true], ["dropbox", "Allow Assignment Dropbox", true],
  ["attendance", "Take Attendance", true], ["honors", "Honors Weighting", false],
] as const;

export const Route = createFileRoute("/admin/courses/$courseId")({
  loader: ({ params }) => { const c = ALL_SECTIONS.find((x) => x.id === params.courseId); if (!c) throw notFound(); return { c }; },
  head: ({ loaderData }) => pageHead(loaderData ? `Axiom · ${courseTitle(loaderData.c)}` : "Axiom · Course", "Course settings, inclusion options and enrolled students."),
  component: CourseRecord,
});

function CourseRecord() {
  const { c } = Route.useLoaderData();
  const { courseFlags, update, scores, weights } = useSchool();
  const list = useSectionAssignments(c.id);
  const roster = teacherRoster(c.id);
  const f = courseFlags[c.id] ?? {};
  const w = weights[c.id] ?? defaultWeights(list.map((a) => a.category));
  const Field = ({ l, v }: { l: string; v: string }) => <div className="grid grid-cols-[140px_1fr] border-b border-vc-line py-1.5 last:border-0"><span className="text-muted-foreground">{l}</span><span>{v}</span></div>;
  return (
    <AxiomShell title={courseTitle(c)} crumbs={[{ label: "Courses & Enrollment", to: "/admin/courses" }]}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <Panel title="Course Detail">
          <Field l="Class ID" v={c.id} /><Field l="Course" v={c.name} /><Field l="Section" v={c.section} /><Field l="Teacher" v={teacherFull(c.teacherId)} />
          <Field l="Block" v={c.block} /><Field l="Room" v={c.room} /><Field l="Course Type" v={c.type} /><Field l="School Level" v="Upper School" /><Field l="Credits" v={c.type === "ADVISORY" ? "0.00" : "1.00"} />
        </Panel>
        <Panel title="Inclusion & Settings">
          {FLAGS.map(([k, label, def]) => (
            <div key={k} className="flex items-center justify-between border-b border-vc-line py-1.5 last:border-0"><span>{label}</span>
              <Switch aria-label={label} checked={f[k] ?? def} onCheckedChange={(on) => update((s) => ({ ...s, courseFlags: { ...s.courseFlags, [c.id]: { ...s.courseFlags[c.id], [k]: on } } }))} /></div>))}
        </Panel>
      </div>
      <Panel title={`Class Enrollment (${roster.length})`} className="mt-3">
        <table className="w-full">
          <thead><tr className="border-b border-vc-line text-left text-[11px] uppercase text-muted-foreground"><th className="py-1.5">Student</th><th>Grade Level</th><th>Enrollment Date</th><th>Status</th><th className="text-right">Current Grade</th></tr></thead>
          <tbody>{roster.map((s) => { const av = weightedAverage(list.map((a) => ({ category: a.category, points: a.points, score: scoreOf(scores, a, s.id) })), w); return (
            <tr key={s.id} className="border-b border-vc-line hover:bg-vc-panel">
              <td className="py-1.5"><Link to="/admin/enrollment/$courseId/$studentId" params={{ courseId: c.id, studentId: s.id }} className="text-vc-link-strong hover:underline">{s.last}, {s.first}</Link></td>
              <td>{s.grade}</td><td>08/26/2026</td><td>Enrolled</td><td className="text-right">{av !== null ? `${letterFor(av)} · ${av.toFixed(2)}%` : "—"}</td>
            </tr>); })}</tbody>
        </table>
      </Panel>
    </AxiomShell>
  );
}
