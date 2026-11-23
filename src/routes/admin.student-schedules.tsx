import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { AxAction, axInput } from "@/components/admin/AxiomDetail";
import { BlockView, IssueList, ListView, WeekView, type ClassActions } from "@/components/admin/ScheduleViews";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { enrollmentPeople } from "@/lib/class-records";
import { blockTimes, changeSection, enrollStudent, placementFor, reviewStudent, sectionsInYear, withdrawStudent, type ReviewSection, type StudentReview } from "@/lib/schedule-review";
import { useSchool } from "@/lib/school-store";
import { teacherFull } from "@/lib/sis-data";
import { schoolYears, termLabel } from "@/lib/terms";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/student-schedules")({
  head: () => pageHead("Axiom · Student Schedules", "Review one student's schedule by block, fix conflicts and gaps, and add or change courses."),
  component: StudentSchedules,
});

type Person = ReturnType<typeof enrollmentPeople>[number];
type Target = { termId?: string | undefined; blockId?: string | undefined; blockName?: string | undefined; replace?: ReviewSection | undefined };
const personName = (u: Person) => `${u.last}, ${u.preferred || u.first}`;
const VIEWS = [{ id: "block", label: "Block View" }, { id: "week", label: "Weekly Grid" }, { id: "list", label: "List View" }] as const;

function StudentSchedules() {
  const { users, sections, schedulingSets, scheduleReview, update } = useSchool();
  const settings = useMemo(() => scheduleReview ?? {}, [scheduleReview]);
  const years = schoolYears();
  const [year, setYear] = useState(years[1]?.id ?? years[0]?.id ?? "");
  const [pick, setPick] = useState("");
  const [q, setQ] = useState("");
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("block");
  const [weekTerm, setWeekTerm] = useState("");
  const [adding, setAdding] = useState<Target | null>(null);

  const students = useMemo(() => enrollmentPeople(users, "student"), [users]);
  const reviews = useMemo(() => new Map<string, StudentReview>(students.map((u) => [u.personId, reviewStudent({ sections, studentId: u.personId, yearId: year, sets: schedulingSets, settings })])), [students, sections, year, schedulingSets, settings]);
  const needle = q.trim().toLowerCase();
  const visible = students.filter((u) => (!needle || `${u.first} ${u.last} ${u.preferred ?? ""}`.toLowerCase().includes(needle)) && (!onlyErrors || (reviews.get(u.personId)?.errors ?? 0) > 0));
  const current = students.find((u) => u.personId === pick) ?? visible[0];
  const review = current ? reviews.get(current.personId) : undefined;
  const at = current ? visible.findIndex((u) => u.personId === current.personId) : -1;
  const flagged = [...reviews.values()].filter((r) => r.errors > 0).length;
  const mine = current ? sectionsInYear(sections, current.personId, year) : [];
  const term = review?.terms.find((t) => t.termId === weekTerm) ?? review?.terms.find((t) => t.set) ?? review?.terms[0];

  const step = (d: number) => {
    if (!visible.length) return;
    const next = at < 0 ? (d > 0 ? 0 : visible.length - 1) : (at + d + visible.length) % visible.length;
    setPick(visible[next]?.personId ?? "");
  };
  const nextProblem = () => {
    const from = current ? students.findIndex((u) => u.personId === current.personId) : -1;
    for (let i = 1; i <= students.length; i++) {
      const u = students[(from + i) % students.length];
      if (u && u.personId !== current?.personId && (reviews.get(u.personId)?.errors ?? 0) > 0) { setPick(u.personId); return; }
    }
    toast.success("No other students have schedule errors.");
  };
  const actions: ClassActions = {
    onChange: (c) => setAdding({ replace: c }),
    onDrop: (c) => {
      if (!current || !confirm(`Drop ${c.name} (${c.code}) for ${personName(current)}? This removes it from all of its terms.`)) return;
      update((s) => ({ ...s, sections: withdrawStudent(s.sections, c.id, current.personId) }));
      toast.success(`${c.name} dropped`);
    },
  };
  const setMin = (v: string) => update((s) => ({ ...s, scheduleReview: { ...s.scheduleReview, minPerTerm: v.trim() === "" ? null : Math.max(0, Math.floor(Number(v)) || 0) } }));
  const setRequired = (ids: string[], on: boolean) => update((s) => ({ ...s, scheduleReview: { ...s.scheduleReview, required: { ...s.scheduleReview?.required, ...Object.fromEntries(ids.map((id) => [id, on])) } } }));

  return (
    <AxiomShell title="Student Schedules" crumbs={[{ label: "System", to: "/admin/courses" }]} actions={<AxAction disabled={!current} onClick={() => setAdding({})}>Add Course</AxAction>}>
      <div className="grid gap-3 lg:grid-cols-[270px_minmax(0,1fr)]">
        <Panel title={`Students (${visible.length})`} className="self-start">
          <input aria-label="Find a student" className={axInput} placeholder="Find a student" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} />Only students with errors <span className="text-vc-gray">({flagged})</span></label>
          <ul aria-label="Students" className="-mx-3 mt-2 max-h-[60vh] overflow-y-auto border-t border-vc-line">
            {visible.map((u) => { const r = reviews.get(u.personId); const on = u.personId === current?.personId; return (
              <li key={u.personId}><button type="button" aria-current={on ? "true" : undefined} onClick={() => setPick(u.personId)} className={`flex w-full items-center justify-between gap-2 border-b border-l-[4px] border-b-vc-line px-3 py-2 text-left ${on ? "border-l-vc-link bg-vc-tile font-semibold" : "border-l-transparent text-vc-link-strong hover:bg-vc-panel"}`}>
                <span className="truncate">{personName(u)}</span>
                {r && r.errors > 0 ? <span title={`${r.errors} errors`} className="shrink-0 rounded-sm bg-destructive px-1.5 text-[11px] font-bold text-primary-foreground">{r.errors}</span> : <span className="shrink-0 text-[11px] text-vc-success">OK</span>}
              </button></li>); })}
            {!visible.length && <li className="px-3 py-4 text-vc-gray">{students.length ? "No students match." : "No active students yet. Add students under Users & Security."}</li>}
          </ul>
        </Panel>

        <div className="min-w-0 space-y-3">
          <Panel title="Review">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <label className="block">School Year<select aria-label="School year" className={`${axInput} mt-0.5 w-[130px]`} value={year} onChange={(e) => setYear(e.target.value)}>{years.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}</select></label>
              <label className="block">Minimum classes per term<input type="number" min={0} aria-label="Minimum classes per term" className={`${axInput} mt-0.5 w-[150px]`} placeholder="One per block" value={settings.minPerTerm ?? ""} onChange={(e) => setMin(e.target.value)} /></label>
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                <button type="button" aria-label="Previous student" title="Previous student" onClick={() => step(-1)} disabled={!visible.length} className="grid size-[30px] place-items-center border border-vc-gray-light/80 bg-background hover:bg-vc-panel disabled:opacity-50"><ChevronLeft className="size-4" /></button>
                <span className="min-w-[70px] text-center text-vc-gray-dark">{at >= 0 ? `${at + 1} of ${visible.length}` : `– of ${visible.length}`}</span>
                <button type="button" aria-label="Next student" title="Next student" onClick={() => step(1)} disabled={!visible.length} className="grid size-[30px] place-items-center border border-vc-gray-light/80 bg-background hover:bg-vc-panel disabled:opacity-50"><ChevronRight className="size-4" /></button>
                <button type="button" onClick={nextProblem} disabled={!flagged} className="h-[30px] border border-vc-gray-light/80 bg-background px-3 hover:bg-vc-panel disabled:opacity-50">Next student with errors</button>
              </div>
            </div>
            <p className="mt-2 text-[12px] text-vc-gray">Each term follows the scheduling set that covers it. A block that needs a class must have exactly one; every term needs at least the minimum above (blank means one per block that needs a class), and the terms should match.</p>
          </Panel>

          {!current || !review ? <Panel title="Schedule"><p className="py-8 text-center text-vc-gray">Choose a student to review their schedule.</p></Panel> : <>
            <section className="flex flex-wrap items-center gap-3 border border-vc-line bg-background px-3 py-2">
              <PersonPhoto personId={current.personId} className="size-12" />
              <div className="min-w-0"><h2 className="text-[18px] font-normal">{current.first} {current.last}</h2><div className="text-vc-gray">Grade {current.grade ?? 9} · {current.email}</div></div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {review.terms.map((t) => <span key={t.termId} className="border border-vc-line bg-vc-panel px-2 py-1">{t.label}: <b>{t.classes.length}</b></span>)}
                {review.errors > 0 ? <span className="flex items-center gap-1 bg-destructive px-2 py-1 font-semibold text-primary-foreground"><TriangleAlert className="size-3.5" />{review.errors} {review.errors === 1 ? "error" : "errors"}</span> : <span className="bg-ax-go px-2 py-1 font-semibold text-primary-foreground">No errors</span>}
                {review.warnings > 0 && <span className="bg-vc-tile-warm px-2 py-1">{review.warnings} {review.warnings === 1 ? "warning" : "warnings"}</span>}
              </div>
            </section>

            <Panel title="Problems"><IssueList review={review} onAdd={(i) => setAdding({ termId: i.termId, blockId: i.blockId, blockName: review.terms.flatMap((t) => t.rows).find((r) => r.block.id === i.blockId)?.block.name })} /></Panel>

            <section className="border border-vc-line bg-background">
              <div role="tablist" aria-label="Schedule view" className="flex flex-wrap items-center gap-1 border-b border-vc-line bg-ax-head px-2 pt-1.5">
                {VIEWS.map((v) => <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)} className={`-mb-px border border-b-0 px-4 py-1.5 text-[13px] ${view === v.id ? "border-vc-line bg-background font-semibold" : "border-transparent text-vc-link-strong hover:bg-vc-panel"}`}>{v.label}</button>)}
                {view === "week" && <span className="ml-auto flex gap-1 pb-1">{review.terms.map((t) => <button key={t.termId} type="button" aria-pressed={term?.termId === t.termId} onClick={() => setWeekTerm(t.termId)} className={`border px-2 py-0.5 text-[12px] ${term?.termId === t.termId ? "border-vc-link bg-vc-tile font-semibold" : "border-vc-line bg-background"}`}>{t.label}</button>)}</span>}
              </div>
              {review.terms.every((t) => !t.set) && <p className="border-b border-vc-line bg-vc-tile-warm px-3 py-2">No scheduling set covers this school year, so blocks can't be shown. <Link to="/admin/scheduling" className="text-vc-link-strong underline">Create a scheduling set</Link></p>}
              {view === "block" && <BlockView review={review} actions={actions} onRequired={setRequired} onAdd={(t, blockId, blockName) => setAdding({ termId: t.termId, blockId, blockName })} />}
              {view === "week" && term && <WeekView term={term} />}
              {view === "list" && <ListView review={review} sets={schedulingSets} actions={actions} />}
            </section>
          </>}
        </div>
      </div>
      {adding && current && <CourseDialog key={`${adding.replace?.id ?? "new"}:${adding.blockId ?? ""}:${adding.termId ?? ""}`} target={adding} student={current} year={year} mine={mine} onClose={() => setAdding(null)} />}
    </AxiomShell>
  );
}

/** Add a course to the student's schedule (choose the course, then a section), or change the section of one they have. */
function CourseDialog({ target, student, year, mine, onClose }: { target: Target; student: Person; year: string; mine: ReviewSection[]; onClose: () => void }) {
  const { sections, courses, schedulingSets, update } = useSchool();
  const replace = target.replace;
  const [courseNo, setCourseNo] = useState(replace?.courseNo ?? "");
  const [courseQ, setCourseQ] = useState("");
  const [choice, setChoice] = useState("");
  const inYear = (terms: string[]) => terms.some((t) => t.startsWith(`${year}-`));
  const cq = courseQ.trim().toLowerCase();
  const courseOptions = courses.filter((c) => sections.some((s) => s.courseNo === c.id && inYear(s.terms)) && (!cq || `${c.name} ${c.id}`.toLowerCase().includes(cq))).sort((a, b) => a.name.localeCompare(b.name));
  const blockOf = (s: ReviewSection) => schedulingSets.find((x) => x.id === s.scheduleSetId)?.blocks.find((b) => b.id === s.scheduleBlockId);
  const fillsTarget = (s: ReviewSection) => Boolean(target.blockName) && blockOf(s)?.name === target.blockName && (!target.termId || s.terms.includes(target.termId));
  const candidates = sections
    .filter((s) => s.courseNo === courseNo && inYear(s.terms) && !s.studentIds.includes(student.personId))
    .map((s) => ({ s, fit: placementFor({ candidate: s, mine, sets: schedulingSets, replacing: replace?.id }) }))
    .sort((a, b) => Number(fillsTarget(b.s)) - Number(fillsTarget(a.s)) || a.s.code.localeCompare(b.s.code));
  const selected = candidates.find((c) => c.s.id === choice);
  const course = courses.find((c) => c.id === courseNo);
  const confirmAdd = () => {
    if (!selected) return;
    update((st) => ({ ...st, sections: replace ? changeSection(st.sections, student.personId, replace.id, selected.s.id) : enrollStudent(st.sections, selected.s.id, student.personId) }));
    toast.success(replace ? `Changed to ${selected.s.code}` : `${selected.s.name} added for ${student.first} ${student.last}`);
    onClose();
  };
  const bad = (selected?.fit.conflicts.length ?? 0) > 0;
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-[920px] overflow-y-auto text-[13px]">
        <DialogHeader>
          <DialogTitle>{replace ? `Change Section: ${replace.name}` : "Add Course"} <span className="font-normal text-vc-gray">· {personName(student)}</span></DialogTitle>
          <DialogDescription>{target.blockName ? `Pick a section that fills ${target.blockName}${target.termId ? ` in ${termLabel(target.termId)}` : ""}.` : replace ? "Pick another section of this course." : "Pick a course, then the section to put the student in."}</DialogDescription>
        </DialogHeader>
        {!replace && <div className="grid gap-2 sm:grid-cols-[200px_minmax(0,1fr)]">
          <input aria-label="Find a course" className={axInput} placeholder="Find a course" value={courseQ} onChange={(e) => setCourseQ(e.target.value)} />
          <select aria-label="Course" className={axInput} value={courseNo} onChange={(e) => { setCourseNo(e.target.value); setChoice(""); }}><option value="">— choose a course —</option>{courseOptions.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id}){c.dept ? ` · ${c.dept}` : ""}</option>)}</select>
        </div>}
        {courseNo && <div className="overflow-x-auto border border-vc-line">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead><tr className="bg-ax-head text-left">{["", "Section", "Teacher", "Room", "Terms", "Block", "Enrolled", "Fit"].map((h, i) => <th key={i} className="border-r border-dotted border-vc-line px-2 py-1.5 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{candidates.map(({ s, fit }) => {
              const set = schedulingSets.find((x) => x.id === s.scheduleSetId);
              return (
                <tr key={s.id} className={`border-t border-vc-line ${choice === s.id ? "bg-vc-tile" : ""}`}>
                  <td className="px-2 py-1.5"><input type="radio" name="section" aria-label={`Choose ${s.code}`} checked={choice === s.id} onChange={() => setChoice(s.id)} /></td>
                  <td className="px-2 py-1.5"><b>{s.code}</b> <span className="text-vc-gray">{s.name}</span>{!s.published && <span className="ml-1 text-vc-gray">(draft)</span>}</td>
                  <td className="px-2 py-1.5">{s.teacherIds[0] ? teacherFull(s.teacherIds[0]) : "—"}</td>
                  <td className="px-2 py-1.5">{s.room || "—"}</td>
                  <td className="px-2 py-1.5">{s.terms.map((t) => t.split("-")[1]).join(" + ")}</td>
                  <td className="px-2 py-1.5">{blockOf(s)?.name ?? <span className="text-vc-gray">None</span>}<div className="text-[12px] text-vc-gray">{blockTimes(set, s.scheduleBlockId)}</div>{fillsTarget(s) && <div className="text-[12px] font-semibold text-vc-success">Fills {target.blockName}</div>}</td>
                  <td className="px-2 py-1.5">{s.studentIds.length}</td>
                  <td className="px-2 py-1.5">{fit.conflicts.length ? <span className="font-semibold text-destructive">{fit.conflicts[0]}{fit.conflicts.length > 1 ? ` (+${fit.conflicts.length - 1} more)` : ""}</span> : fit.notes.length ? <span className="text-vc-gray">{fit.notes[0]}</span> : <span className="font-semibold text-vc-success">Fits</span>}</td>
                </tr>);
            })}</tbody>
          </table>
          {!candidates.length && <p className="px-3 py-6 text-center text-vc-gray">{course ? `No other sections of ${course.name} are offered in this school year.` : "No sections."}</p>}
        </div>}
        {bad && selected && <p role="alert" className="flex items-start gap-2 bg-vc-danger-soft px-3 py-2"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" /><span>{selected.fit.conflicts.join(" ")} Adding it will create a conflict you can fix on the schedule afterwards.</span></p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-[34px] border border-vc-gray-light/80 px-4 hover:bg-vc-panel">Cancel</button>
          <AxAction disabled={!selected} onClick={confirmAdd}>{replace ? "Change Section" : bad ? "Add Anyway" : "Add to Schedule"}</AxAction>
        </div>
      </DialogContent>
    </Dialog>
  );
}
