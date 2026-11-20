import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { blockMeetings } from '@/lib/scheduling';
import { useState } from "react";
import { toast } from "sonner";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { AxAction, AxAdd, AxBanner, AxDetail, AxEmpty, AxField, AxFooter, AxOpen, AxToggle, axInput, axTd, axTh, type AxGroup } from "@/components/admin/AxiomDetail";
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
  const { courseFlags, update, scores, weights, schedulingSets, users, courses, sections: allSections } = useSchool();
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
    const teacherId = d.teacherIds[0] ?? "";
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
  const groups: AxGroup[] = [
    { heading: "General", items: [{ id: "general", label: "General" }, { id: "registrations", label: "Registrations" }, { id: "teachers", label: "Teachers" }] },
    { heading: "Communication", items: [{ id: "emails", label: "Student Email Recipients" }] },
    { heading: "Schedule", items: [{ id: "schedule", label: "Schedule" }, { id: "suggest", label: "Schedule Suggestions" }] },
    { heading: "Configuration", items: [{ id: "settings", label: "Settings" }] },
    { heading: "Other", items: [{ id: "others", label: "Other Sections" }] },
  ];
  const TITLES: Record<string, string> = { general: "General", registrations: "Registrations", teachers: "Teachers", emails: "Student Email Recipients", schedule: "Schedule", suggest: "Schedule Suggestions", settings: "Settings", others: "Other Sections" };
  const LETTER = ["M", "T", "W", "R", "F"];
  const scheduleText = d.days.length && d.time ? `${d.days.map((n) => LETTER[n - 1]).join("")}: ${d.time}` : "<None Specified>";
  const bandNames = schedule ? schedule.blocks.map((b) => b.name) : BLOCKS;
  const suggestions = bandNames.map((name) => {
    const days = d.days.length ? d.days : [1, 2, 3, 4, 5];
    const same = allSections.filter((x) => x.id !== c.id && x.block === name && x.terms.some((tm) => d.terms.includes(tm)) && x.days.some((n) => days.includes(n)));
    const busy = same.some((x) => x.teacherIds.some((id) => d.teacherIds.includes(id)) || (!!d.room && x.room === d.room));
    return { name, days, busy, affected: roster.filter((s) => same.some((x) => x.studentIds.includes(s.id))).length };
  }).filter((s) => !s.busy);
  const applySuggestion = (s: { name: string; days: number[] }) => {
    const b = schedule?.blocks.find((x) => x.name === s.name);
    if (schedule && b) { const ms = schedule.meetings ? blockMeetings(schedule, b.id) : []; setD({ ...d, scheduleBlockId: b.id, block: b.name, days: schedule.meetings ? [...new Set(ms.map((m) => m.day))] : b.days, time: ms[0] ? `${ms[0].start}–${ms[0].end}` : `${b.start}–${b.end}` }); }
    else setD({ ...d, block: s.name, days: s.days });
    toast.success(`${s.name} chosen. Choose Update to save it.`);
    setTab("schedule");
  };
  return (
    <AxiomShell compactRail title={`Class: ${c.code}: ${c.name}`} crumbs={[{ label: "System", to: "/admin/courses" }]}
      actions={<div className="flex gap-2"><button onClick={remove} className="h-[34px] border border-primary-foreground/60 px-3 text-[13px] uppercase text-primary-foreground hover:bg-primary-foreground/10">Delete</button><AxAction onClick={save}>Update</AxAction></div>}>
      <AxDetail groups={groups} active={tab} onSelect={setTab} title={TITLES[tab] ?? "General"} banner={tab === "general" ? <AxBanner /> : undefined}>
        {(tab === "general" || tab === "registrations") && <>
          {tab === "general" && <div className="grid grid-cols-1 gap-x-8 gap-y-1 px-6 py-4 md:grid-cols-2 xl:grid-cols-4 [&>div]:border-l [&>div]:border-vc-line [&>div]:pl-5">
            <div>
              <AxField label="Course" required><div className={`${axInput} flex items-center bg-vc-panel`}>{courseRecord?.name ?? c.name}</div></AxField>
              <AxField label="Class ID" required><input aria-label="Class identifier" className={axInput} value={d.code} onChange={(e) => setD({ ...d, code: e.target.value })} /></AxField>
              <AxField label="Description" required><input aria-label="Class name" className={axInput} value={d.name} maxLength={80} onChange={(e) => setD({ ...d, name: e.target.value })} /></AxField>
            </div>
            <div>
              <AxField label="Teacher"><div className={`${axInput} flex items-center justify-between bg-vc-panel`}><span className="truncate">{d.teacherIds[0] ? teacherFull(d.teacherIds[0]) : "<None Specified>"}{d.teacherIds.length > 1 ? ` +${d.teacherIds.length - 1}` : ""}</span><button type="button" onClick={() => setTab("teachers")} className="shrink-0 pl-2 text-[12px] text-vc-link-strong hover:underline">Change</button></div></AxField>
              <AxField label="Room"><input aria-label="Room" className={axInput} value={d.room} maxLength={12} placeholder="<None Specified>" onChange={(e) => setD({ ...d, room: e.target.value })} /></AxField>
              <AxField label="Schedule"><div className={`${axInput} flex items-center bg-vc-panel`}>{scheduleText}</div></AxField>
            </div>
            <div>
              <AxField label="School Year" required><select aria-label="School year" className={axInput} value={year} onChange={(e) => setTerms(e.target.value, termMode)}>{years.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}</select></AxField>
              <AxField label="Terms"><select aria-label="Terms" className={axInput} value={termMode} onChange={(e) => setTerms(year, e.target.value)}><option value="FY">Full Year (S1 + S2)</option><option value="S1">Semester 1 only</option><option value="S2">Semester 2 only</option></select></AxField>
              <AxField label="Section"><input aria-label="Section identifier" className={axInput} value={d.section} onChange={(e) => setD({ ...d, section: e.target.value })} /></AxField>
            </div>
            <div>
              <AxField label="Status" required><div className={`${axInput} flex items-center bg-vc-panel capitalize`}>{status}</div></AxField>
              <AxField label="Counts"><div className={`${axInput} flex items-center bg-vc-panel`}>{roster.length}</div></AxField>
              <AxField label="Published"><AxToggle label="Published to portals" on={d.published} onChange={(on) => setD({ ...d, published: on })} /></AxField>
            </div>
          </div>}
          <div className="flex flex-wrap items-center gap-3 border-y border-vc-line bg-vc-panel px-4 py-2"><AxAdd onClick={() => setAdding((v) => !v)} aria-expanded={adding}>{adding ? "Done Adding" : "Add Record"}</AxAdd><span className="text-[13px] text-vc-gray">{adding ? "Tick the students to enroll, then choose Enroll selected." : "Enrolls a student in this class."}</span></div>
          {adding && <div className="border-b border-vc-line px-4 pt-3">
        <div className="mb-3 flex flex-wrap items-center gap-2"><input aria-label="Find students to enroll" className={`${inp} max-w-80`} placeholder="Find students by name or email" value={search} onChange={(e) => setSearch(e.target.value)} /><select aria-label="Filter students by grade" className={`${inp} w-32`} value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}><option value="">All grades</option>{grades.map((g) => <option key={g} value={String(g)}>Grade {g}</option>)}</select><Button variant="outline" size="sm" disabled={!pool.length} onClick={() => setSelected([...new Set([...selected, ...pool.map((u) => u.personId)])])}>Select all shown ({pool.length})</Button><Button variant="outline" size="sm" disabled={!selected.length} onClick={() => setSelected([])}>Clear</Button><Button size="sm" disabled={!selected.length} onClick={() => { setRoster([...c.studentIds, ...selected]); toast.success(`${selected.length} ${selected.length === 1 ? "student" : "students"} enrolled`); setSelected([]); }}>Enroll selected ({selected.length})</Button></div>
        <div className="mb-3 grid max-h-44 grid-cols-1 gap-1 overflow-y-auto border-b border-vc-line pb-3 md:grid-cols-2">{pool.map((u) => <label key={u.id} className="flex items-center gap-2 px-2 py-1"><input type="checkbox" aria-label={`Enroll ${u.first} ${u.last}`} checked={selected.includes(u.personId)} onChange={(e) => setSelected((ids) => e.target.checked ? [...ids, u.personId] : ids.filter((id) => id !== u.personId))} /><PersonPhoto personId={u.personId} className="size-7" /><span>{u.last}, {u.first}<span className="ml-2 text-[11px] text-muted-foreground">Grade {u.grade ?? 9}</span></span></label>)}{!pool.length && <p className="px-2 text-muted-foreground">No matching unenrolled students.</p>}</div>
          </div>}
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] border-collapse">
            <thead><tr><th className={axTh}>Person</th><th className={axTh}>Grade</th><th className={axTh}>Level</th><th className={axTh}>Roles</th><th className={axTh}>Late Date Enrolled</th><th className={axTh}>Date Withdrawn</th><th className={axTh}>Notes</th><th className={`${axTh} w-10`} /><th className={`${axTh} w-10`} /></tr></thead>
            <tbody>{roster.map((s) => (
              <tr key={s.id} className="bg-[#fafafa] hover:bg-vc-panel">
                <td className={axTd}><Link to="/admin/enrollment/$courseId/$studentId" params={{ courseId: c.id, studentId: s.id }} className="text-vc-link-strong underline">{s.last}, {s.first}</Link></td>
                <td className={axTd}>{s.grade}</td><td className={`${axTd} text-vc-gray`}>N/A</td><td className={axTd}>Student ({s.grade})</td>
                <td className={axTd}><input type="date" aria-label={`Late date enrolled for ${s.first} ${s.last}`} className="h-7 w-[140px] border border-vc-line bg-background px-1 text-[13px]" value={d.regs?.[s.id]?.late ?? ""} onChange={(e) => setD({ ...d, regs: { ...d.regs, [s.id]: { ...d.regs?.[s.id], late: e.target.value } } })} /></td>
                <td className={`${axTd} text-vc-gray`}>—</td>
                <td className={axTd}><input aria-label={`Notes for ${s.first} ${s.last}`} className="h-7 w-full min-w-[120px] border border-vc-line bg-background px-1 text-[13px]" value={d.regs?.[s.id]?.notes ?? ""} onChange={(e) => setD({ ...d, regs: { ...d.regs, [s.id]: { ...d.regs?.[s.id], notes: e.target.value } } })} /></td>
                <td className={`${axTd} text-center`}><Link to="/admin/enrollment/$courseId/$studentId" params={{ courseId: c.id, studentId: s.id }} aria-label={`Open ${s.first} ${s.last}'s enrollment`}><AxOpen label="Open enrollment" /></Link></td>
                <td className={`${axTd} text-center`}><button type="button" aria-label={`Withdraw ${s.first} ${s.last}`} title="Withdraw from this class" onClick={() => { if (!confirm(`Withdraw ${s.first} ${s.last} from ${c.code}?`)) return; setRoster(c.studentIds.filter((x) => x !== s.id)); toast.success(`${s.first} ${s.last} withdrawn`); }} className="text-[18px] font-bold leading-none text-destructive">×</button></td>
              </tr>))}</tbody>
          </table>
          {!roster.length && <AxEmpty />}</div>
          <AxFooter count={roster.length} />
          <p className="px-4 py-2 text-[12px] text-vc-gray">Notes and late dates are saved with Update.</p>
        </>}
        {tab === "teachers" && <div className="px-6 py-4">
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
        </div>}
        {tab === "emails" && <div className="px-6 py-4">
          <p className="mb-2 text-[13px] text-vc-gray">Student email recipients for {c.code}. Copy the list into a message.</p>
          <textarea readOnly aria-label="Student email recipients" className="h-32 w-full border border-vc-line bg-vc-panel p-2 font-mono text-[13px]" value={roster.map((s) => s.email).filter(Boolean).join("; ")} />
          <div className="mt-2 flex items-center gap-3"><AxAction onClick={() => { void navigator.clipboard?.writeText(roster.map((s) => s.email).filter(Boolean).join("; ")); toast.success("Recipients copied"); }}>Copy</AxAction><Link to="/admin/messages" className="text-vc-link-strong hover:underline">Compose a message</Link></div>
          <p className="mt-4 text-[13px] text-vc-gray">Parent email recipients: parent accounts are not part of this portal yet.</p>
        </div>}
        {tab === "others" && <div className="overflow-x-auto"><table className="w-full min-w-[560px] border-collapse"><thead><tr><th className={axTh}>Class ID</th><th className={axTh}>Description</th><th className={axTh}>Teacher(s)</th><th className={axTh}>Block</th><th className={axTh}>Enrolled</th></tr></thead>
          <tbody>{allSections.filter((x) => x.courseNo === c.courseNo && x.id !== c.id).map((x) => <tr key={x.id} className="bg-[#fafafa]"><td className={axTd}><Link to="/admin/courses/$courseId" params={{ courseId: x.id }} className="text-vc-link-strong underline">{x.code}</Link></td><td className={axTd}>{x.name}</td><td className={axTd}>{x.teacherIds.map(teacherFull).join(", ") || "—"}</td><td className={axTd}>{x.block || "—"}</td><td className={axTd}>{x.studentIds.length}</td></tr>)}</tbody></table>
          {!allSections.some((x) => x.courseNo === c.courseNo && x.id !== c.id) && <AxEmpty />}
          <AxFooter count={allSections.filter((x) => x.courseNo === c.courseNo && x.id !== c.id).length} /></div>}
        {tab === "suggest" && <div>
          <p className="px-6 py-3 text-[13px] text-vc-gray">Open times for this class: blocks where none of its teachers already teach and the room is free. Students Affected counts enrolled students who already have a class in that block.</p>
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] border-collapse"><thead><tr><th className={axTh}>Block</th><th className={axTh}>Days</th><th className={axTh}>Room</th><th className={axTh}>Students Affected</th><th className={axTh} /></tr></thead>
            <tbody>{suggestions.map((s) => <tr key={s.name} className="bg-[#fafafa]"><td className={axTd}>{s.name}</td><td className={axTd}>{s.days.map((n) => DAYS[n - 1]).join(" ") || "—"}</td><td className={axTd}>{d.room || "<None Specified>"}</td><td className={axTd}>{s.affected}</td><td className={axTd}><button type="button" onClick={() => applySuggestion(s)} className="text-vc-link-strong underline">Use this schedule</button></td></tr>)}</tbody></table>
            {!suggestions.length && <AxEmpty />}</div>
          <AxFooter count={suggestions.length} />
        </div>}
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
          <div>
              <AxField label="Scheduling Set"><select aria-label="Scheduling set" className={axInput} value={d.scheduleSetId ?? ""} onChange={(e) => setD({ ...d, scheduleSetId: e.target.value || undefined, scheduleBlockId: undefined, block: "" })}><option value="">Manual timetable</option>{schedulingSets.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></AxField>
            <AxField label="Lock Schedule"><AxToggle label="Lock schedule for future scheduler results" on={!!d.scheduleLocked} onChange={(on) => setD({ ...d, scheduleLocked: on })} /></AxField>
            {FLAGS.slice(0, 2).map(([k, l, def]) => flag(k, l, def))}
          </div>
          <div>{FLAGS.slice(2).map(([k, l, def]) => flag(k, l, def))}</div>
        </div>}
      </AxDetail>
    </AxiomShell>
  );
}
