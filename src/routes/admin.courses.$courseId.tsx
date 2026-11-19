import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { blockMeetings } from '@/lib/scheduling';
import { useState } from "react";
import { toast } from "sonner";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { AxAction, AxAdd, AxBanner, AxDetail, AxEmpty, AxField, AxFooter, AxToggle, axInput, axTd, axTh, type AxGroup } from "@/components/admin/AxiomDetail";
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
  const [gradeFilter, setGradeFilter] = useState("");
  const [drop, setDrop] = useState<string[]>([]);
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
  const allStudents = enrollmentPeople(users, "student");
  const grades = [...new Set(allStudents.map((s) => s.grade ?? 9))].sort((a, b) => a - b);
  const pool = allStudents.filter((s) => !c.studentIds.includes(s.personId) && (!gradeFilter || String(s.grade ?? 9) === gradeFilter) && `${s.first} ${s.last} ${s.email}`.toLowerCase().includes(search.toLowerCase()));
  const addable = faculty.filter((t) => !d.teacherIds.includes(t.personId) && `${t.first} ${t.last} ${t.email}`.toLowerCase().includes(facultySearch.toLowerCase()));
  const makePrimary = (id: string) => setD({ ...d, teacherIds: [id, ...d.teacherIds.filter((x) => x !== id)] });
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
  const [tab, setTab] = useState("general");
  const [adding, setAdding] = useState(false);
  const flag = (k: string, label: string, def: boolean) => <AxField key={k} label={label}><AxToggle label={label} on={f[k] ?? def} onChange={(on) => update((s) => ({ ...s, courseFlags: { ...s.courseFlags, [c.id]: { ...s.courseFlags[c.id], [k]: on } } }))} /></AxField>;
  const groups: AxGroup[] = [{ heading: "General", items: [{ id: "general", label: "General" }] }, { heading: "Schedule", items: [{ id: "schedule", label: "Schedule" }] }, { heading: "Configuration", items: [{ id: "settings", label: "Settings" }] }];
  return (
    <AxiomShell compactRail title={`Class: ${c.code}: ${c.name}`} crumbs={[{ label: "System", to: "/admin/courses" }]}
      actions={<div className="flex gap-2"><button onClick={remove} className="h-[34px] border border-primary-foreground/60 px-3 text-[13px] uppercase text-primary-foreground hover:bg-primary-foreground/10">Delete</button><AxAction onClick={save}>Update</AxAction></div>}>
      <AxDetail groups={groups} active={tab} onSelect={setTab} title={tab === "general" ? "General" : tab === "schedule" ? "Schedule" : "Settings"} banner={tab === "general" ? <AxBanner /> : undefined}>
        {tab === "general" && <>
          <div className="grid grid-cols-1 gap-x-8 px-6 py-5 lg:grid-cols-3 [&>div]:border-l [&>div]:border-vc-line [&>div]:pl-5">
            <div>
              <AxField label="School Year" required><select aria-label="School year" className={axInput} value={year} onChange={(e) => setTerms(e.target.value, termMode)}>{years.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}</select></AxField>
              <AxField label="Terms"><select aria-label="Terms" className={axInput} value={termMode} onChange={(e) => setTerms(year, e.target.value)}><option value="FY">Full Year (S1 + S2)</option><option value="S1">Semester 1 only</option><option value="S2">Semester 2 only</option></select></AxField>
              <AxField label="Course" required><div className={`${axInput} flex items-center bg-vc-panel`}>{c.courseNo} · {courseRecord?.name ?? c.name}</div></AxField>
              <AxField label="Class ID" required><input aria-label="Class identifier" className={axInput} value={d.code} onChange={(e) => setD({ ...d, code: e.target.value })} /></AxField>
              <AxField label="Description" required><input aria-label="Class name" className={axInput} value={d.name} maxLength={80} onChange={(e) => setD({ ...d, name: e.target.value })} /></AxField>
              <AxField label="Section"><input className={axInput} value={d.section} maxLength={4} onChange={(e) => setD({ ...d, section: e.target.value })} /></AxField>
              <AxField label="Room"><input className={axInput} value={d.room} maxLength={12} placeholder="<None Specified>" onChange={(e) => setD({ ...d, room: e.target.value })} /></AxField>
              <AxField label="Status" required><div className={`${axInput} flex items-center bg-vc-panel capitalize`}>{status}</div></AxField>
            </div>
            <div>
              <AxField label="Scheduling Set"><select aria-label="Scheduling set" className={axInput} value={d.scheduleSetId ?? ""} onChange={(e) => setD({ ...d, scheduleSetId: e.target.value || undefined, scheduleBlockId: undefined, block: "" })}><option value="">Manual timetable</option>{schedulingSets.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></AxField>
              <AxField label="Max Students"><div className={`${axInput} flex items-center justify-end bg-vc-panel`}>{roster.length}</div></AxField>
              <AxField label="Published"><AxToggle label="Published to portals" on={d.published} onChange={(on) => setD({ ...d, published: on })} /></AxField>
              <p className="mt-2 text-[12px] text-vc-gray">{d.published ? "Teachers and students can see this class." : "Hidden from teacher and student portals."}</p>
            </div>
            <div>
              {flag("attendance", "Track Class Attendance", true)}
              {flag("gpa", "Include in GPA", true)}
              {flag("report", "Show on Report Card", true)}
              {flag("transcript", "Show on Transcript", true)}
            </div>
          </div>
          <div className="border-y border-vc-line bg-vc-panel px-6 py-2.5 text-[15px] font-semibold">Teachers</div>
          <div className="px-6 py-3">
          <Row l="Teacher(s)">
  <div className="space-y-1">
    {d.teacherIds.map((id, i) => (
      <div key={id} className="flex items-center gap-2">
        <PersonPhoto personId={id} className="size-7" />
        <span className="flex-1">{teacherFull(id)}</span>
        {i === 0 ? <span className="border border-vc-line px-1.5 text-[10px] uppercase text-muted-foreground">Primary</span> : <button type="button" onClick={() => makePrimary(id)} className="text-[12px] text-vc-link-strong hover:underline">Make primary</button>}
        <button type="button" aria-label={`Remove ${teacherFull(id)}`} disabled={d.teacherIds.length < 2} onClick={() => setD({ ...d, teacherIds: d.teacherIds.filter((x) => x !== id) })} className="text-[12px] text-destructive hover:underline disabled:opacity-40 disabled:no-underline">Remove</button>
      </div>))}
    {!d.teacherIds.length && <p className="text-muted-foreground">No teacher assigned.</p>}
  </div>
  <input aria-label="Find teachers" className={`${inp} mt-2`} placeholder="Add a teacher: search faculty by name or email" value={facultySearch} onChange={(e) => setFacultySearch(e.target.value)} />
  <div className="mt-1 max-h-36 overflow-y-auto">
    {addable.slice(0, 6).map((t) => (
      <button type="button" key={t.id} aria-label={`Add ${t.first} ${t.last}`} onClick={() => { setD({ ...d, teacherIds: [...d.teacherIds, t.personId] }); setFacultySearch(""); }} className="flex w-full items-center gap-2 px-1 py-1 text-left hover:bg-vc-panel">
        <PersonPhoto personId={t.personId} className="size-7" />
        <span>{t.prefix} {t.first} {t.last}<span className="ml-2 text-[11px] text-muted-foreground">{t.email}</span></span>
        <span className="ml-auto text-[12px] text-vc-link-strong">+ Add</span>
      </button>))}
    {addable.length > 6 && <div className="px-1 text-[11px] text-muted-foreground">{addable.length - 6} more: keep typing to narrow the list</div>}
    {!addable.length && <div className="px-1 text-[11px] text-muted-foreground">No matching faculty to add.</div>}
  </div>
</Row>
          </div>
          <div className="border-t border-vc-line bg-vc-panel px-6 py-2.5 text-[15px] font-semibold">Registrations</div>
      <Panel title={`Registrations (${roster.length})`} className="m-4">
        <div className="mb-3 flex items-center gap-3"><AxAdd onClick={() => setAdding((v) => !v)} aria-expanded={adding}>{adding ? "Done Adding" : "Add Record"}</AxAdd><span className="text-[13px] text-vc-gray">Search for a student, tick the names and enroll them in this class.</span></div>
        {adding && <>
        <div className="mb-3 flex flex-wrap items-center gap-2"><input aria-label="Find students to enroll" className={`${inp} max-w-80`} placeholder="Find students by name or email" value={search} onChange={(e) => setSearch(e.target.value)} /><select aria-label="Filter students by grade" className={`${inp} w-32`} value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}><option value="">All grades</option>{grades.map((g) => <option key={g} value={String(g)}>Grade {g}</option>)}</select><Button variant="outline" size="sm" disabled={!pool.length} onClick={() => setSelected([...new Set([...selected, ...pool.map((u) => u.personId)])])}>Select all shown ({pool.length})</Button><Button variant="outline" size="sm" disabled={!selected.length} onClick={() => setSelected([])}>Clear</Button><Button size="sm" disabled={!selected.length} onClick={() => { setRoster([...c.studentIds, ...selected]); toast.success(`${selected.length} ${selected.length === 1 ? "student" : "students"} enrolled`); setSelected([]); }}>Enroll selected ({selected.length})</Button></div>
        <div className="mb-3 grid max-h-44 grid-cols-1 gap-1 overflow-y-auto border-b border-vc-line pb-3 md:grid-cols-2">{pool.map((u) => <label key={u.id} className="flex items-center gap-2 px-2 py-1"><input type="checkbox" aria-label={`Enroll ${u.first} ${u.last}`} checked={selected.includes(u.personId)} onChange={(e) => setSelected((ids) => e.target.checked ? [...ids, u.personId] : ids.filter((id) => id !== u.personId))} /><PersonPhoto personId={u.personId} className="size-7" /><span>{u.last}, {u.first}<span className="ml-2 text-[11px] text-muted-foreground">Grade {u.grade ?? 9}</span></span></label>)}{!pool.length && <p className="px-2 text-muted-foreground">No matching unenrolled students.</p>}</div>
        </>}
        <div className="mb-2 flex items-center justify-between"><span className="text-[12px] text-muted-foreground">{roster.length} enrolled{drop.length ? ` · ${drop.length} selected` : ""}</span>
          <Button variant="outline" size="sm" disabled={!drop.length} onClick={() => { if (!confirm(`Withdraw ${drop.length} ${drop.length === 1 ? "student" : "students"} from ${c.id}?`)) return; setRoster(c.studentIds.filter((x) => !drop.includes(x))); toast.success(`${drop.length} withdrawn`); setDrop([]); }}>Withdraw selected ({drop.length})</Button></div>
        <table className="w-full [&_td]:border-r [&_td]:border-dotted [&_td]:border-vc-line [&_td]:px-2 [&_th]:border-r [&_th]:border-dotted [&_th]:border-vc-line [&_th]:px-2 [&_tbody_tr]:bg-[#fafafa] [&_tbody_tr]:h-[40px]">
          <thead><tr className="border-b border-vc-line text-left text-[11px] uppercase text-muted-foreground"><th className="w-8 py-1.5"><input type="checkbox" aria-label="Select all enrolled students" disabled={!roster.length} checked={!!roster.length && drop.length === roster.length} onChange={(e) => setDrop(e.target.checked ? roster.map((s) => s.id) : [])} /></th><th className="py-1.5">Student</th><th>Grade Level</th><th>Teacher(s)</th><th className="text-right">Current Grade</th><th /></tr></thead>
          <tbody>{roster.map((s) => { const av = weightedAverage(list.map((a) => ({ category: a.category, points: a.points, score: scoreOf(scores, a, s.id) })), w); return (
            <tr key={s.id} className="border-b border-vc-line hover:bg-vc-panel">
              <td className="w-8 py-1.5"><input type="checkbox" aria-label={`Select ${s.first} ${s.last}`} checked={drop.includes(s.id)} onChange={(e) => setDrop((ids) => e.target.checked ? [...ids, s.id] : ids.filter((id) => id !== s.id))} /></td>
              <td className="py-1.5"><Link to="/admin/enrollment/$courseId/$studentId" params={{ courseId: c.id, studentId: s.id }} className="text-vc-link-strong hover:underline">{s.last}, {s.first}</Link></td>
              <td>{s.grade}</td><td>{c.teacherIds.map(teacherFull).join(", ")}</td><td className="text-right">{av !== null ? `${letterFor(av)} · ${av.toFixed(2)}%` : "—"}</td>
              <td className="text-right"><button onClick={() => setRoster(c.studentIds.filter((x) => x !== s.id))} className="text-[12px] text-destructive hover:underline">Withdraw</button></td>
            </tr>); })}
            {!roster.length && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No students enrolled yet.</td></tr>}</tbody>
        </table>
      </Panel>
        </>}
        {tab === "schedule" && <>
          <div className="grid grid-cols-1 gap-x-8 px-6 py-5 lg:grid-cols-3 [&>div]:border-l [&>div]:border-vc-line [&>div]:pl-5">
            <div>
              <AxField label="Scheduling Set"><select aria-label="Scheduling set (schedule tab)" className={axInput} value={d.scheduleSetId ?? ""} onChange={(e) => setD({ ...d, scheduleSetId: e.target.value || undefined, scheduleBlockId: undefined, block: "" })}><option value="">Manual timetable</option>{schedulingSets.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></AxField>
              <AxField label="Block group"><div className={`${axInput} flex items-center bg-vc-panel`}>{schedule?.name ?? "<Default>"}</div></AxField>
              <AxField label="Terms"><div className={`${axInput} flex items-center bg-vc-panel`}>{termMode === "FY" ? "Full Year (S1 + S2)" : termMode === "S1" ? "Semester 1" : "Semester 2"}</div></AxField>
            </div>
            <div>
          <Row l="Block">{schedule ? <select aria-label="Class block" className={inp} value={d.scheduleBlockId ?? ''} onChange={(e) => { const b = schedule.blocks.find((x) => x.id === e.target.value); if (b) { const ms = schedule.meetings ? blockMeetings(schedule, b.id) : []; setD({ ...d, scheduleBlockId: b.id, block: b.name, days: schedule.meetings ? [...new Set(ms.map((m) => m.day))] : b.days, time: ms[0] ? `${ms[0].start}–${ms[0].end}` : `${b.start}–${b.end}` }); } }}><option value="">— choose —</option>{schedule.blocks.map((b) => <option key={b.id} value={b.id}>{b.name}{!schedule.meetings && ` · ${b.start}–${b.end}`}</option>)}</select> : <input aria-label="Class block" className={inp} value={d.block} onChange={(e) => setD({ ...d, block: e.target.value })} />}</Row>

              <Row l="Meeting Days"><div className="flex flex-wrap gap-3">{DAYS.map((l, i) => (
                <label key={l} className="flex items-center gap-1"><input type="checkbox" checked={d.days.includes(i + 1)} onChange={(e) => setD({ ...d, days: e.target.checked ? [...d.days, i + 1].sort() : d.days.filter((x) => x !== i + 1) })} />{l}</label>))}</div></Row>
              <Row l="Start Time"><input className={inp} value={d.time} placeholder="9:10 am" maxLength={10} onChange={(e) => setD({ ...d, time: e.target.value })} /></Row>
            </div>
            <div>
              <AxField label="Meets Today"><div className={`${axInput} flex items-center bg-vc-panel`}>{d.days.includes(((new Date().getDay() + 6) % 7) + 1) ? "Yes" : "No"}</div></AxField>
              <AxField label="Room"><input className={axInput} value={d.room} maxLength={12} onChange={(e) => setD({ ...d, room: e.target.value })} /></AxField>
            </div>
          </div>
          <div className="overflow-x-auto border-t border-vc-line">
            <table className="w-full min-w-[640px] border-collapse"><thead><tr><th className={axTh}>Grading Period</th><th className={axTh}>Day</th><th className={axTh}>Block</th><th className={axTh}>Start Time</th><th className={axTh}>Room (Class Sched)</th></tr></thead>
              <tbody>{d.days.map((n) => <tr key={n} className="bg-[#fafafa]"><td className={axTd}>{termMode === "FY" ? "ALL" : termMode}</td><td className={axTd}>{DAYS[n - 1]}</td><td className={axTd}>{d.block || "—"}</td><td className={axTd}>{d.time || "—"}</td><td className={`${axTd} text-vc-gray`}>{d.room || "<None Specified>"}</td></tr>)}</tbody></table>
            {!d.days.length && <AxEmpty />}
            <AxFooter count={d.days.length} />
          </div>
        </>}
        {tab === "settings" && <div className="grid grid-cols-1 gap-x-8 px-6 py-5 lg:grid-cols-2 [&>div]:border-l [&>div]:border-vc-line [&>div]:pl-5">
          <div>{FLAGS.slice(0, 4).map(([k, l, def]) => flag(k, l, def))}</div>
          <div>{FLAGS.slice(4).map(([k, l, def]) => flag(k, l, def))}</div>
        </div>}
      </AxDetail>
    </AxiomShell>
  );
}
