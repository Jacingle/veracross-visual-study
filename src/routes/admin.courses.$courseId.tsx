import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { blockMeetings } from '@/lib/scheduling';
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { EXTRA, ME_STUDENT, STUDENTS, TEACHERS, teacherFull } from "@/lib/sis-data";
import { defaultWeights, letterFor, weightedAverage } from "@/lib/grading";
import { scoreOf } from "@/lib/gradebook";
import { rosterOf, useSchool, useSection, useSectionAssignments, type Section } from "@/lib/school-store";
import { classStatus, schoolYears } from "@/lib/terms";
import { Button } from "@/components/ui/button";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { enrollmentPeople, validateClassRecord } from "@/lib/class-records";
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
  const { courseFlags, update, scores, weights, schedulingSets, users, courses } = useSchool();
  const nav = useNavigate();
  const [d, setD] = useState(c);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [facultySearch, setFacultySearch] = useState("");
  const list = useSectionAssignments(c.id);
  const roster = rosterOf(c);
  const f = courseFlags[c.id] ?? {};
  const w = weights[c.id] ?? [];
  const years = schoolYears();
  const year = d.terms[0]?.split("-")[0] ?? years[1]?.id ?? years[0]?.id ?? "";
  const termMode = d.terms.length === 2 ? "FY" : d.terms[0]?.endsWith("S2") ? "S2" : "S1";
  const setTerms = (y: string, m: string) => setD({ ...d, terms: m === "FY" ? [`${y}-S1`, `${y}-S2`] : [`${y}-${m}`] });
  const faculty = enrollmentPeople(users, "teacher");
  const courseRecord = courses.find((x) => x.id === c.courseNo);
  const schedule = schedulingSets.find((s) => s.id === d.scheduleSetId);
  const pool = enrollmentPeople(users, "student").filter((s) => !c.studentIds.includes(s.personId) && `${s.first} ${s.last} ${s.email}`.toLowerCase().includes(search.toLowerCase()));
  const save = () => {
    const error = validateClassRecord({ ...d, studentIds: c.studentIds }, users);
    if (error) { toast.error(error); return; }
    if (d.published && (!d.block || !d.room)) { toast.error("Set a block and room before publishing."); return; }
    const teacherId = d.teacherIds[0];
    if (!teacherId) return;
    if (d.scheduleSetId && !schedule?.blocks.some((b) => b.id === d.scheduleBlockId)) { toast.error("Choose a block from the scheduling set."); return; }
    update((s) => ({ ...s, sections: s.sections.map((x) => (x.id === c.id ? { ...d, name: d.name.trim(), section: d.section.trim(), studentIds: x.studentIds, website: x.website, teacherId, code: d.code.trim() || d.id } : x)) }));
    toast.success(d.published ? "Class saved — visible on teacher and student portals" : "Class saved as draft (not on portals)");
  };
  const setRoster = (ids: string[]) => update((s) => ({ ...s, sections: s.sections.map((x) => (x.id === c.id ? { ...x, studentIds: [...new Set(ids)] } : x)) }));
  const remove = () => { if (!confirm(`Delete class ${c.id}? Its grades and attendance will no longer be shown.`)) return; update((s) => ({ ...s, sections: s.sections.filter((x) => x.id !== c.id) })); nav({ to: "/admin/courses" }); };
  const status = classStatus(d.terms);
  const Row = ({ l, children }: { l: string; children: React.ReactNode }) => <div className="grid grid-cols-[130px_1fr] items-center gap-2 border-b border-vc-line py-1.5 last:border-0"><span className="text-muted-foreground">{l}</span><div>{children}</div></div>;
  return (
    <AxiomShell title={`${c.id}: ${c.name}`} crumbs={[{ label: "Courses & Enrollment", to: "/admin/courses" }]}
      actions={<div className="flex gap-2"><button onClick={remove} className="h-7 border border-vc-line bg-background px-3 text-destructive">Delete</button><button onClick={save} className="h-7 bg-ax-go px-4 font-semibold text-primary-foreground">Save</button></div>}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <Panel title="Class Section Detail">
          <Row l="Class ID"><input aria-label="Class identifier" className={inp} value={d.code} onChange={(e) => setD({ ...d, code: e.target.value })} /></Row>
          <Row l="Class Name"><input aria-label="Class name" className={inp} value={d.name} maxLength={80} onChange={(e) => setD({ ...d, name: e.target.value })} /></Row>
          <Row l="Course">{c.courseNo} · {courseRecord?.name ?? c.name}</Row>
          <Row l="Section"><input className={inp} value={d.section} maxLength={4} onChange={(e) => setD({ ...d, section: e.target.value })} /></Row>
          <Row l="Teacher(s)"><input aria-label="Find teachers" className={inp} placeholder="Find faculty by name or email" value={facultySearch} onChange={(e) => setFacultySearch(e.target.value)} /><div className="mt-2 max-h-40 space-y-1 overflow-y-auto">{faculty.filter((t) => `${t.first} ${t.last} ${t.email}`.toLowerCase().includes(facultySearch.toLowerCase())).map((t) => <label key={t.id} className="flex items-center gap-2"><input type="checkbox" aria-label={`Assign ${t.first} ${t.last}`} checked={d.teacherIds.includes(t.personId)} onChange={(e) => setD({ ...d, teacherIds: e.target.checked ? [...new Set([...d.teacherIds, t.personId])] : d.teacherIds.filter((x) => x !== t.personId) })} /><PersonPhoto personId={t.personId} className="size-7" /><span>{t.prefix} {t.first} {t.last}<span className="ml-2 text-[11px] text-muted-foreground">{t.email}</span></span></label>)}</div><div className="mt-1 text-[11px] text-muted-foreground">{d.teacherIds.length} assigned</div></Row>
          <Row l="Room"><input className={inp} value={d.room} maxLength={12} onChange={(e) => setD({ ...d, room: e.target.value })} /></Row>
          <Row l="Scheduling Set"><select aria-label="Scheduling set" className={inp} value={d.scheduleSetId ?? ''} onChange={(e) => setD({ ...d, scheduleSetId: e.target.value || undefined, scheduleBlockId: undefined, block: '' })}><option value="">Manual timetable</option>{schedulingSets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Row>
          <Row l="Block">{schedule ? <select aria-label="Class block" className={inp} value={d.scheduleBlockId ?? ''} onChange={(e) => { const b = schedule.blocks.find((x) => x.id === e.target.value); if (b) { const ms = schedule.meetings ? blockMeetings(schedule, b.id) : []; setD({ ...d, scheduleBlockId: b.id, block: b.name, days: schedule.meetings ? [...new Set(ms.map((m) => m.day))] : b.days, time: ms[0] ? `${ms[0].start}–${ms[0].end}` : `${b.start}–${b.end}` }); } }}><option value="">— choose —</option>{schedule.blocks.map((b) => <option key={b.id} value={b.id}>{b.name}{!schedule.meetings && ` · ${b.start}–${b.end}`}</option>)}</select> : <input aria-label="Class block" className={inp} value={d.block} onChange={(e) => setD({ ...d, block: e.target.value })} />}</Row>
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
      <Panel title={`Class Enrollment (${roster.length})`} className="mt-3">
        <div className="mb-3 flex flex-wrap items-center gap-2"><input aria-label="Find students to enroll" className={`${inp} max-w-80`} placeholder="Find students by name or email" value={search} onChange={(e) => setSearch(e.target.value)} /><Button variant="outline" size="sm" onClick={() => setSelected([...new Set([...selected, ...pool.map((u) => u.personId)])])}>Select results</Button><Button size="sm" disabled={!selected.length} onClick={() => { setRoster([...c.studentIds, ...selected]); setSelected([]); toast.success("Students enrolled"); }}>Enroll selected ({selected.length})</Button></div>
        <div className="mb-3 grid max-h-44 grid-cols-1 gap-1 overflow-y-auto border-b border-vc-line pb-3 md:grid-cols-2">{pool.map((u) => <label key={u.id} className="flex items-center gap-2 px-2 py-1"><input type="checkbox" aria-label={`Enroll ${u.first} ${u.last}`} checked={selected.includes(u.personId)} onChange={(e) => setSelected((ids) => e.target.checked ? [...ids, u.personId] : ids.filter((id) => id !== u.personId))} /><PersonPhoto personId={u.personId} className="size-7" /><span>{u.last}, {u.first}<span className="ml-2 text-[11px] text-muted-foreground">Grade {u.grade ?? 9}</span></span></label>)}{!pool.length && <p className="px-2 text-muted-foreground">No matching unenrolled students.</p>}</div>
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
