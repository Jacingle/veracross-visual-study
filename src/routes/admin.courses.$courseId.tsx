import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { EXTRA, ME_STUDENT, STUDENTS, TEACHERS, teacherFull } from "@/lib/sis-data";
import { defaultWeights, letterFor, weightedAverage } from "@/lib/grading";
import { scoreOf } from "@/lib/gradebook";
import { rosterOf, useSchool, useSection, useSectionAssignments, type Section } from "@/lib/school-store";
import { classStatus, schoolYears } from "@/lib/terms";
import { pageHead } from "@/lib/head";

const FLAGS = [
  ["gpa", "Include in GPA", true], ["report", "Show on Report Card", true], ["transcript", "Show on Transcript", true],
  ["portal", "Display Grades on Portals", true], ["website", "Enable Class Website", true], ["dropbox", "Allow Assignment Dropbox", true],
  ["attendance", "Take Attendance", true], ["honors", "Honors Weighting", false],
] as const;
const BLOCKS = ["US Block A", "US Block B", "US Block C", "US Block D", "US Block E", "US Block F", "US Block G", "US Roundtable", "Community Time"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export const Route = createFileRoute("/admin/courses/$courseId")({
  head: ({ params }) => pageHead(`Axiom · Class ${params.courseId}`, "Class section setup: teachers, room, block, terms, enrollment and publishing."),
  component: ClassRecord,
});

const inp = "h-7 w-full border border-vc-line bg-background px-2 text-[13px] outline-none focus:border-vc-link";

function ClassRecord() {
  const { courseId } = Route.useParams();
  const c = useSection(courseId);
  if (!c) return <AxiomShell title="Class not found" crumbs={[{ label: "Courses & Enrollment", to: "/admin/courses" }]}><p>No class with ID {courseId}. <Link to="/admin/courses" className="text-vc-link-strong">Back to courses</Link></p></AxiomShell>;
  return <Editor key={c.id} c={c} />;
}

function Editor({ c }: { c: Section }) {
  const { courseFlags, update, scores, weights } = useSchool();
  const nav = useNavigate();
  const [d, setD] = useState(c);
  const [add, setAdd] = useState("");
  const list = useSectionAssignments(c.id);
  const roster = rosterOf(c);
  const f = courseFlags[c.id] ?? {};
  const w = weights[c.id] ?? defaultWeights(list.map((a) => a.category));
  const years = schoolYears();
  const year = d.terms[0]?.split("-")[0] ?? years[1]!.id;
  const termMode = d.terms.length === 2 ? "FY" : d.terms[0]?.endsWith("S2") ? "S2" : "S1";
  const setTerms = (y: string, m: string) => setD({ ...d, terms: m === "FY" ? [`${y}-S1`, `${y}-S2`] : [`${y}-${m}`] });
  const faculty = [...TEACHERS, ...EXTRA.teachers];
  const pool = [...STUDENTS, ...EXTRA.students].filter((s) => !c.studentIds.includes(s.id));
  const save = () => {
    if (!d.teacherIds.length) { toast.error("Assign at least one teacher."); return; }
    if (d.published && (!d.block || !d.room)) { toast.error("Set a block and room before publishing."); return; }
    update((s) => ({ ...s, sections: s.sections.map((x) => (x.id === c.id ? { ...d, studentIds: x.studentIds, website: x.website, teacherId: d.teacherIds[0]!, code: d.id } : x)) }));
    toast.success(d.published ? "Class saved — visible on teacher and student portals" : "Class saved as draft (not on portals)");
  };
  const setRoster = (ids: string[]) => update((s) => ({ ...s, sections: s.sections.map((x) => (x.id === c.id ? { ...x, studentIds: ids } : x)) }));
  const remove = () => { if (!confirm(`Delete class ${c.id}? Its grades and attendance will no longer be shown.`)) return; update((s) => ({ ...s, sections: s.sections.filter((x) => x.id !== c.id) })); nav({ to: "/admin/courses" }); };
  const status = classStatus(d.terms);
  const Row = ({ l, children }: { l: string; children: React.ReactNode }) => <div className="grid grid-cols-[130px_1fr] items-center gap-2 border-b border-vc-line py-1.5 last:border-0"><span className="text-muted-foreground">{l}</span><div>{children}</div></div>;
  return (
    <AxiomShell title={`${c.id}: ${c.name}`} crumbs={[{ label: "Courses & Enrollment", to: "/admin/courses" }]}
      actions={<div className="flex gap-2"><button onClick={remove} className="h-7 border border-vc-line bg-background px-3 text-destructive">Delete</button><button onClick={save} className="h-7 bg-ax-go px-4 font-semibold text-primary-foreground">Save</button></div>}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <Panel title="Class Section Detail">
          <Row l="Class ID"><span className="font-mono">{c.id}</span></Row>
          <Row l="Course">{c.courseNo} · {c.name}</Row>
          <Row l="Section"><input className={inp} value={d.section} maxLength={4} onChange={(e) => setD({ ...d, section: e.target.value })} /></Row>
          <Row l="Teacher(s)"><div className="flex flex-wrap gap-x-3 gap-y-1">{faculty.map((t) => (
            <label key={t.id} className="flex items-center gap-1"><input type="checkbox" checked={d.teacherIds.includes(t.id)} onChange={(e) => setD({ ...d, teacherIds: e.target.checked ? [...d.teacherIds, t.id] : d.teacherIds.filter((x) => x !== t.id) })} />{t.prefix} {t.last}</label>))}</div></Row>
          <Row l="Room"><input className={inp} value={d.room} maxLength={12} onChange={(e) => setD({ ...d, room: e.target.value })} /></Row>
          <Row l="Block"><select className={inp} value={d.block} onChange={(e) => setD({ ...d, block: e.target.value })}><option value="">— choose —</option>{BLOCKS.map((b) => <option key={b}>{b}</option>)}</select></Row>
          <Row l="Meeting Days"><div className="flex gap-3">{DAYS.map((l, i) => (
            <label key={l} className="flex items-center gap-1"><input type="checkbox" checked={d.days.includes(i + 1)} onChange={(e) => setD({ ...d, days: e.target.checked ? [...d.days, i + 1].sort() : d.days.filter((x) => x !== i + 1) })} />{l}</label>))}</div></Row>
          <Row l="Start Time"><input className={inp} value={d.time} placeholder="9:10 am" maxLength={10} onChange={(e) => setD({ ...d, time: e.target.value })} /></Row>
        </Panel>
        <div className="space-y-3">
          <Panel title="Timetable & Publishing">
            <Row l="School Year"><select className={inp} value={year} onChange={(e) => setTerms(e.target.value, termMode)}>{years.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}</select></Row>
            <Row l="Terms"><select className={inp} value={termMode} onChange={(e) => setTerms(year, e.target.value)}><option value="FY">Full Year (S1 + S2)</option><option value="S1">Semester 1 only</option><option value="S2">Semester 2 only</option></select></Row>
            <Row l="Status today"><span className="capitalize">{status}</span> <span className="text-[11px] text-muted-foreground">— appears under {status === "current" ? "Active" : status === "future" ? "Future" : "Past"} classes</span></Row>
            <Row l="Published"><div className="flex items-center gap-2"><Switch aria-label="Published to portals" checked={d.published} onCheckedChange={(on) => setD({ ...d, published: on })} /><span className="text-[12px] text-muted-foreground">{d.published ? "Teachers and students can see this class" : "Hidden from teacher and student portals"}</span></div></Row>
          </Panel>
          <Panel title="Inclusion & Settings">
            {FLAGS.map(([k, label, def]) => (
              <div key={k} className="flex items-center justify-between border-b border-vc-line py-1 last:border-0"><span>{label}</span>
                <Switch aria-label={label} checked={f[k] ?? def} onCheckedChange={(on) => update((s) => ({ ...s, courseFlags: { ...s.courseFlags, [c.id]: { ...s.courseFlags[c.id], [k]: on } } }))} /></div>))}
          </Panel>
        </div>
      </div>
      <Panel title={`Class Enrollment (${roster.length})`} className="mt-3"
        right={<div className="flex gap-2 font-normal"><select aria-label="Add student" value={add} onChange={(e) => setAdd(e.target.value)} className="h-6 border border-vc-line bg-background px-1"><option value="">Add student…</option>{pool.map((s) => <option key={s.id} value={s.id}>{s.last}, {s.first} (Gr {s.grade})</option>)}</select>
          <button disabled={!add} onClick={() => { setRoster([...c.studentIds, add]); setAdd(""); toast.success("Student enrolled"); }} className="h-6 bg-ax-go px-2 text-primary-foreground disabled:opacity-40">Enroll</button></div>}>
        <table className="w-full">
          <thead><tr className="border-b border-vc-line text-left text-[11px] uppercase text-muted-foreground"><th className="py-1.5">Student</th><th>Grade Level</th><th>Teacher(s)</th><th className="text-right">Current Grade</th><th /></tr></thead>
          <tbody>{roster.map((s) => { const av = weightedAverage(list.map((a) => ({ category: a.category, points: a.points, score: scoreOf(scores, a, s.id) })), w); return (
            <tr key={s.id} className="border-b border-vc-line hover:bg-vc-panel">
              <td className="py-1.5"><Link to="/admin/enrollment/$courseId/$studentId" params={{ courseId: c.id, studentId: s.id }} className="text-vc-link-strong hover:underline">{s.last}, {s.first}</Link></td>
              <td>{s.grade}</td><td>{c.teacherIds.map(teacherFull).join(", ")}</td><td className="text-right">{av !== null ? `${letterFor(av)} · ${av.toFixed(2)}%` : "—"}</td>
              <td className="text-right"><button onClick={() => setRoster(c.studentIds.filter((x) => x !== s.id))} className="text-[12px] text-destructive hover:underline">Withdraw</button></td>
            </tr>); })}
            {!roster.length && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No students enrolled yet.</td></tr>}</tbody>
        </table>
      </Panel>
    </AxiomShell>
  );
}
