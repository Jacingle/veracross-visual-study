import { createFileRoute, notFound } from "@tanstack/react-router";
import { format } from "date-fns";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { ALL_SECTIONS, courseTitle, teacherFull, teacherRoster } from "@/lib/sis-data";
import { defaultWeights, letterFor, weightedAverage } from "@/lib/grading";
import { scoreOf } from "@/lib/gradebook";
import { useSchool, useSectionAssignments } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/enrollment/$courseId/$studentId")({
  loader: ({ params }) => {
    const c = ALL_SECTIONS.find((x) => x.id === params.courseId); const s = c && teacherRoster(c.id).find((x) => x.id === params.studentId);
    if (!c || !s) throw notFound(); return { c, s };
  },
  head: ({ loaderData }) => pageHead(loaderData ? `Axiom · ${loaderData.s.first} ${loaderData.s.last} in ${loaderData.c.name}` : "Axiom · Enrollment", "Class enrollment record with attendance totals and grade detail."),
  component: Enrollment,
});

function Enrollment() {
  const { c, s } = Route.useLoaderData();
  const { scores, weights, attendance, termGrades, comments } = useSchool();
  const list = useSectionAssignments(c.id);
  const w = weights[c.id] ?? defaultWeights(list.map((a) => a.category));
  const av = weightedAverage(list.map((a) => ({ category: a.category, points: a.points, score: scoreOf(scores, a, s.id) })), w);
  const att = Object.entries(attendance).filter(([k]) => k.startsWith(`${c.id}|`) && k.endsWith(`|${s.id}`)).map(([, v]) => v);
  const count = (st: string) => att.filter((v) => v === st).length;
  const F = ({ l, v }: { l: string; v: string }) => <div className="grid grid-cols-[130px_1fr] border-b border-vc-line py-1.5 last:border-0"><span className="text-muted-foreground">{l}</span><span>{v}</span></div>;
  return (
    <AxiomShell title={`${s.first} ${s.last}: ${c.name}`} crumbs={[{ label: "Courses & Enrollment", to: "/admin/courses" }, { label: courseTitle(c) }]}>
      <div className="grid grid-cols-3 gap-3">
        <Panel title="Student"><F l="Name" v={`${s.first} ${s.last}`} /><F l="Grade Level" v={String(s.grade)} /><F l="Address" v={s.address} /><F l="Home Phone" v={s.homePhone} /></Panel>
        <Panel title="Class"><F l="Class" v={courseTitle(c)} /><F l="Teacher" v={teacherFull(c.teacherId)} /><F l="Block / Room" v={`${c.block} · ${c.room}`} /><F l="Enrolled" v="08/26/2026" /><F l="Status" v="Enrolled" /></Panel>
        <Panel title="Attendance Totals"><F l="Recorded days" v={String(att.length)} /><F l="Tardy" v={String(count("Tardy"))} /><F l="Absent - Excused" v={String(count("Absent - Excused"))} /><F l="Absent - Unexcused" v={String(count("Absent - Unexcused"))} /><F l="Dismissed" v={String(count("Dismissed"))} /></Panel>
      </div>
      <div className="mt-3 grid grid-cols-[320px_minmax(0,1fr)] gap-3">
        <Panel title="Report Flags & Grades">
          <F l="Current Average" v={av !== null ? `${letterFor(av)} · ${av.toFixed(2)}%` : "—"} />
          <F l="Mid-Semester 1" v={termGrades[`${c.id}|${s.id}|MS1`] || (av !== null ? `${letterFor(av)} (calculated)` : "—")} />
          <F l="Semester 1" v={termGrades[`${c.id}|${s.id}|S1`] || "Not posted"} />
          <F l="MS1 Comment" v={comments[`${c.id}|${s.id}|MS1`] ? "Entered" : "Not entered"} />
        </Panel>
        <Panel title={`Grade Detail Records (${list.length})`}>
          <table className="w-full">
            <thead><tr className="border-b border-vc-line text-left text-[11px] uppercase text-muted-foreground"><th className="py-1">Due</th><th>Assignment</th><th>Type</th><th className="text-right">Score</th></tr></thead>
            <tbody>{[...list].reverse().map((a) => { const sc = scoreOf(scores, a, s.id); return (
              <tr key={a.id} className="border-b border-vc-line"><td className="py-1">{format(a.due, "M/d")}</td><td>{a.title}</td><td className="text-[11px]">{a.category}</td><td className="text-right">{sc !== undefined ? `${sc} / ${a.points}` : "—"}</td></tr>); })}</tbody>
          </table>
        </Panel>
      </div>
    </AxiomShell>
  );
}
