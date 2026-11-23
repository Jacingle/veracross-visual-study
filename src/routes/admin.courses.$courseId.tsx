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
import { AdvancedSearch, type SearchRow } from "@/components/admin/AdvancedSearch";
import { PersonField } from "@/components/admin/PersonField";
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
  const [picking, setPicking] = useState<"teacher" | "aide" | "student" | null>(null);
  const [pending, setPending] = useState(false);
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
  const facultyRows: SearchRow[] = faculty.map((u) => ({ id: u.personId, first: u.first, last: u.last, cells: [`${u.last}, ${u.preferred || u.first}`, "Faculty", u.email] }));
  const studentRows: SearchRow[] = allStudents.map((u) => ({ id: u.personId, first: u.first, last: u.last, grade: u.grade ?? 9, cells: [`${u.last}, ${u.preferred || u.first}`, `Grade ${u.grade ?? 9}`, `Student (${u.grade ?? 9})`] }));
  const personName = (id: string) => { const u = users.find((x) => x.personId === id); return u ? `${u.last}, ${u.preferred || u.first}` : teacherFull(id); };
  const openPerson = (id: string) => { const u = users.find((x) => x.personId === id); if (u) nav({ to: "/admin/users", search: { q: u.email } }); };
  const aides = d.aideIds ?? [];
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
  const flag = (k: string, label: string, def: boolean) => <AxField key={k} label={label}><AxToggle label={label} on={f[k] ?? def} onChange={(on) => update((s) => ({ ...s, courseFlags: { ...s.courseFlags, [c.id]: { ...s.courseFlags[c.id], [k]: on } } }))} /></AxField>;
  const groups: AxGroup[] = [
    { heading: "General", items: [{ id: "general", label: "General" }, { id: "registrations", label: "Registrations" }] },
    { heading: "Communication", items: [{ id: "emails", label: "Student Email Recipients" }] },
    { heading: "Schedule", items: [{ id: "schedule", label: "Schedule" }, { id: "suggest", label: "Schedule Suggestions" }] },
    { heading: "Configuration", items: [{ id: "settings", label: "Settings" }] },
    { heading: "Other", items: [{ id: "others", label: "Other Sections" }] },
  ];
  const TITLES: Record<string, string> = { general: "General", registrations: "Registrations", emails: "Student Email Recipients", schedule: "Schedule", suggest: "Schedule Suggestions", settings: "Settings", others: "Other Sections" };
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
      actions={<div className="flex gap-2"><button onClick={remove} className="h-[34px] border border-primary-foreground/60 px-3 text-[13px] uppercase text-primary-foreground hover:bg-primary-foreground/10">Delete</button><AxAction data-ax-update onClick={save}>Update</AxAction></div>}>
      <AxDetail groups={groups} active={tab} onSelect={setTab} title={TITLES[tab] ?? "General"} banner={tab === "general" ? <AxBanner /> : undefined}>
        {(tab === "general" || tab === "registrations") && <>
          {tab === "general" && <div className="grid grid-cols-1 gap-x-8 gap-y-1 px-6 py-4 md:grid-cols-2 xl:grid-cols-4 [&>div]:border-l [&>div]:border-vc-line [&>div]:pl-5">
            <div>
              <AxField label="Course" required><div className={`${axInput} flex items-center bg-vc-panel`}>{courseRecord?.name ?? c.name}</div></AxField>
              <AxField label="Class ID" required dirty={d.code !== c.code}><input aria-label="Class identifier" className={axInput} value={d.code} onChange={(e) => setD({ ...d, code: e.target.value })} /></AxField>
              <AxField label="Description" required dirty={d.name !== c.name}><input aria-label="Class name" className={axInput} value={d.name} maxLength={80} onChange={(e) => setD({ ...d, name: e.target.value })} /></AxField>
            </div>
            <div>
              <AxField label="Teacher" dirty={d.teacherIds.join() !== c.teacherIds.join()}><PersonField label="Teacher" ids={d.teacherIds.slice(0, 1)} onChange={(ids) => setD({ ...d, teacherIds: ids.slice(0, 1) })} nameOf={personName} onSearch={() => setPicking("teacher")} onOpen={openPerson} /></AxField>
              <AxField label="Teacher's Aide" dirty={aides.join() !== (c.aideIds ?? []).join()}><PersonField label="Teacher's Aide" multi ids={aides} onChange={(ids) => setD({ ...d, aideIds: ids })} nameOf={personName} onSearch={() => setPicking("aide")} onOpen={openPerson} /></AxField>
              <AxField label="Room" dirty={d.room !== c.room}><input aria-label="Room" className={axInput} value={d.room} maxLength={12} placeholder="<None Specified>" onChange={(e) => setD({ ...d, room: e.target.value })} /></AxField>
              <AxField label="Schedule"><div className={`${axInput} flex items-center bg-vc-panel`}>{scheduleText}</div></AxField>
            </div>
            <div>
              <AxField label="School Year" required dirty={d.terms.join() !== c.terms.join()}><select aria-label="School year" className={axInput} value={year} onChange={(e) => setTerms(e.target.value, termMode)}>{years.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}</select></AxField>
              <AxField label="Terms" dirty={d.terms.join() !== c.terms.join()}><select aria-label="Terms" className={axInput} value={termMode} onChange={(e) => setTerms(year, e.target.value)}><option value="FY">Full Year (S1 + S2)</option><option value="S1">Semester 1 only</option><option value="S2">Semester 2 only</option></select></AxField>
              <AxField label="Section" dirty={d.section !== c.section}><input aria-label="Section identifier" className={axInput} value={d.section} onChange={(e) => setD({ ...d, section: e.target.value })} /></AxField>
            </div>
            <div>
              <AxField label="Status" required><div className={`${axInput} flex items-center bg-vc-panel capitalize`}>{status}</div></AxField>
              <AxField label="Counts"><div className={`${axInput} flex items-center bg-vc-panel`}>{roster.length}</div></AxField>
              <AxField label="Published" dirty={d.published !== c.published}><AxToggle label="Published to portals" on={d.published} onChange={(on) => setD({ ...d, published: on })} /></AxField>
            </div>
          </div>}
          <div className="flex flex-wrap items-center gap-3 border-y border-vc-line bg-vc-panel px-4 py-2"><AxAdd onClick={() => setPending(true)}>Add Record...</AxAdd><span className="text-[13px] text-vc-gray">Enrolls a student: use the search icon on the new row.</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] border-collapse">
            <thead><tr><th className={axTh}>Person</th><th className={axTh}>Grade</th><th className={axTh}>Level</th><th className={axTh}>Roles</th><th className={axTh}>Late Date Enrolled</th><th className={axTh}>Date Withdrawn</th><th className={axTh}>Notes</th><th className={`${axTh} w-10`} /><th className={`${axTh} w-10`} /></tr></thead>
            <tbody>{pending && <tr className="bg-vc-tile-warm"><td className={axTd} colSpan={9}><div className="flex max-w-xl items-center gap-3"><div className="min-w-0 flex-1"><PersonField label="Person" ids={[]} onChange={() => {}} nameOf={personName} onSearch={() => setPicking("student")} placeholder="Search for a student" /></div><button type="button" onClick={() => setPending(false)} className="text-[13px] text-vc-gray hover:underline">Cancel</button></div></td></tr>}{roster.map((s) => (
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
      <AdvancedSearch open={picking === "teacher"} onClose={() => setPicking(null)} noun="Person" kind="person" heads={["Full Name", "Roles", "Email"]} rows={facultyRows} exclude={aides} onSelect={(ids) => setD({ ...d, teacherIds: ids.slice(0, 1) })} onAddNew={() => window.open("/admin/users?add=user", "_blank", "popup=yes,width=1100,height=760")} />
      <AdvancedSearch open={picking === "aide"} onClose={() => setPicking(null)} noun="Person" kind="person" multi heads={["Full Name", "Roles", "Email"]} rows={facultyRows} exclude={[...aides, ...d.teacherIds]} onSelect={(ids) => setD({ ...d, aideIds: [...new Set([...aides, ...ids])] })} onAddNew={() => window.open("/admin/users?add=user", "_blank", "popup=yes,width=1100,height=760")} />
      <AdvancedSearch open={picking === "student"} onClose={() => setPicking(null)} noun="Person" kind="person" multi heads={["Full Name", "Current Grade", "Roles"]} rows={studentRows} exclude={c.studentIds} onSelect={(ids) => { setRoster([...c.studentIds, ...ids]); setPending(false); toast.success(`${ids.length} ${ids.length === 1 ? "student" : "students"} enrolled`); }} onAddNew={() => window.open("/admin/users?add=user", "_blank", "popup=yes,width=1100,height=760")} />
    </AxiomShell>
  );
}
