// Views for one student's schedule on the administrator's Student Schedules page. They only draw what
// reviewStudent() worked out; every change goes back to the page through callbacks.
import { CircleCheck, Pencil, Plus, TriangleAlert, Info, X } from "lucide-react";
import { axTd, axTh } from "@/components/admin/AxiomDetail";
import { blockTimes, dayLabel, fmtTime, weeklyGrid, type Issue, type ReviewSection, type StudentReview, type TermReview } from "@/lib/schedule-review";
import type { SchedulingSet } from "@/lib/scheduling";
import { teacherFull } from "@/lib/sis-data";

export type ClassActions = { onChange: (c: ReviewSection) => void; onDrop: (c: ReviewSection) => void };
const ghost = "grid size-6 place-items-center text-vc-link-strong hover:bg-vc-panel";

/** The problems found for this student, worst first; an empty-block problem offers to add a class straight into that block. */
export function IssueList({ review, onAdd }: { review: StudentReview; onAdd: (i: Issue) => void }) {
  if (!review.issues.length) return <p className="flex items-center gap-2 bg-vc-success-soft px-3 py-2"><CircleCheck className="size-4 text-vc-success" />No problems found: every block has exactly one class and both terms are even.</p>;
  return (
    <ul aria-label="Schedule problems" className="divide-y divide-vc-line border border-vc-line">
      {review.issues.map((i) => (
        <li key={i.id} className={`flex items-start gap-2 px-3 py-2 ${i.severity === "error" ? "bg-vc-danger-soft" : "bg-vc-tile-warm"}`}>
          {i.severity === "error" ? <TriangleAlert aria-label="Error" className="mt-0.5 size-4 shrink-0 text-destructive" /> : <Info aria-label="Warning" className="mt-0.5 size-4 shrink-0 text-vc-gray-dark" />}
          <span className="min-w-0 flex-1">{i.message}</span>
          {i.kind === "empty-block" && <button type="button" onClick={() => onAdd(i)} className="shrink-0 text-vc-link-strong underline">Add a class</button>}
        </li>))}
    </ul>
  );
}

function ClassTile({ c, actions }: { c: ReviewSection; actions: ClassActions }) {
  const teacher = c.teacherIds[0];
  return (
    <div className="flex items-start justify-between gap-2 py-0.5">
      <div className="min-w-0"><div className="font-semibold">{c.name}</div><div className="text-[12px] text-vc-gray">{[c.code, teacher ? teacherFull(teacher) : "", c.room].filter(Boolean).join(" · ")}</div></div>
      <div className="flex shrink-0">
        <button type="button" aria-label={`Change section of ${c.name}`} title="Change section" onClick={() => actions.onChange(c)} className={ghost}><Pencil className="size-3.5" /></button>
        <button type="button" aria-label={`Drop ${c.name}`} title="Drop this class (all of its terms)" onClick={() => actions.onDrop(c)} className={`${ghost} text-destructive`}><X className="size-4" /></button>
      </div>
    </div>
  );
}

function BlockCell({ term, name, actions, onAdd }: { term: TermReview; name: string; actions: ClassActions; onAdd: (term: TermReview, blockId: string, blockName: string) => void }) {
  const row = term.rows.find((r) => r.block.name === name);
  if (!row) return <td className={`${axTd} bg-vc-panel align-top text-vc-gray`}>Not in this timetable</td>;
  const conflict = row.sections.length > 1;
  const empty = row.sections.length === 0;
  const tone = conflict || (empty && row.required) ? "bg-vc-danger-soft" : empty ? "bg-vc-panel text-vc-gray" : "bg-background";
  return (
    <td className={`${axTd} align-top ${tone}`} data-state={conflict ? "conflict" : empty ? (row.required ? "empty" : "free") : "ok"}>
      {conflict && <div className="mb-1 flex items-center gap-1 text-[12px] font-semibold text-destructive"><TriangleAlert className="size-3.5" />{row.sections.length} classes in one block</div>}
      {row.sections.map((c) => <ClassTile key={c.id} c={c} actions={actions} />)}
      {empty && (row.required
        ? <div className="flex items-center justify-between gap-2"><span className="font-semibold text-destructive">Nothing scheduled</span><button type="button" onClick={() => onAdd(term, row.block.id, row.block.name)} className="flex items-center gap-1 text-vc-link-strong underline"><Plus className="size-3.5" />Add class</button></div>
        : <span>Free</span>)}
    </td>
  );
}

/** Veracross "Block View": one row per block of the timetable, one column per term, so a gap or a double-booking stands out. */
export function BlockView({ review, actions, onAdd, onRequired }: { review: StudentReview; actions: ClassActions; onAdd: (term: TermReview, blockId: string, blockName: string) => void; onRequired: (blockIds: string[], on: boolean) => void }) {
  const names = [...new Set(review.terms.flatMap((t) => t.rows.map((r) => r.block.name)))];
  const unplaced = review.terms.some((t) => t.unplaced.length);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse">
        <thead><tr><th className={`${axTh} w-[260px]`}>Block</th>{review.terms.map((t) => <th key={t.termId} className={axTh}>{t.label}<div className="text-[12px] font-normal text-vc-gray">{t.classes.length} {t.classes.length === 1 ? "class" : "classes"}{t.expected ? ` · ${t.expected} expected` : ""}</div></th>)}</tr></thead>
        <tbody>
          {names.map((name) => {
            const rows = review.terms.flatMap((t) => t.rows.filter((r) => r.block.name === name).map((r) => ({ t, r })));
            const first = rows[0];
            const required = first?.r.required ?? true;
            return (
              <tr key={name}>
                <td className={`${axTd} align-top`}>
                  <div className="font-semibold">{name}</div>
                  <div className="text-[12px] text-vc-gray">{blockTimes(first?.t.set, first?.r.block.id) || "No meeting times"}</div>
                  <label className="mt-1 flex items-center gap-1.5 text-[12px] text-vc-gray-dark"><input type="checkbox" checked={required} aria-label={`${name} needs a class`} onChange={(e) => onRequired(rows.map((x) => x.r.block.id), e.target.checked)} />Needs a class</label>
                </td>
                {review.terms.map((t) => <BlockCell key={t.termId} term={t} name={name} actions={actions} onAdd={onAdd} />)}
              </tr>);
          })}
          {unplaced && <tr><td className={`${axTd} align-top`}><div className="font-semibold">Not in a block</div><div className="text-[12px] text-vc-gray">Classes the timetable can't place</div></td>{review.terms.map((t) => <td key={t.termId} className={`${axTd} align-top bg-vc-tile-warm`}>{t.unplaced.map((c) => <ClassTile key={c.id} c={c} actions={actions} />)}</td>)}</tr>}
        </tbody>
      </table>
    </div>
  );
}

/** The set's week for one term: days across, meeting times down, each time showing its block and the student's class in it. */
export function WeekView({ term }: { term: TermReview }) {
  if (!term.set) return <p className="px-3 py-6 text-center text-vc-gray">No scheduling set covers {term.label}.</p>;
  const grid = weeklyGrid(term.set);
  if (!grid.slots.length) return <p className="px-3 py-6 text-center text-vc-gray">{term.set.name} has no meeting times yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead><tr><th className={`${axTh} w-[120px]`}>Time</th>{grid.days.map((d) => <th key={d} className={axTh}>{dayLabel(d)}</th>)}</tr></thead>
        <tbody>
          {grid.slots.map((slot) => (
            <tr key={slot.key}>
              <td className={`${axTd} align-top text-[13px]`}>{blockTimesOf(slot.start, slot.end)}</td>
              {grid.days.map((d) => {
                const m = grid.cell(d, slot.key);
                const row = m ? term.rows.find((r) => r.block.id === m.blockId) : undefined;
                if (!m || !row) return <td key={d} className={`${axTd} bg-vc-panel`} />;
                const bad = row.sections.length > 1 || (row.required && row.sections.length === 0);
                return (
                  <td key={d} className={`${axTd} align-top ${bad ? "bg-vc-danger-soft" : row.sections.length ? "bg-background" : "bg-vc-panel text-vc-gray"}`}>
                    <div className="text-[11px] font-semibold uppercase text-vc-gray-dark">{row.block.name}</div>
                    {row.sections.map((c) => <div key={c.id} className="font-semibold">{c.name}<span className="font-normal text-vc-gray"> {c.room}</span></div>)}
                    {!row.sections.length && <div>{row.required ? <span className="font-semibold text-destructive">Nothing scheduled</span> : "Free"}</div>}
                  </td>);
              })}
            </tr>))}
        </tbody>
      </table>
    </div>
  );
}
const blockTimesOf = (start: string, end: string) => `${fmtTime(start)}–${fmtTime(end)}`;

/** A plain list of the student's classes with their block, times and room. */
export function ListView({ review, sets, actions }: { review: StudentReview; sets: SchedulingSet[]; actions: ClassActions }) {
  const classes = [...new Map(review.terms.flatMap((t) => t.classes).map((c) => [c.id, c])).values()];
  const blockOf = (c: ReviewSection) => { const set = sets.find((s) => s.id === c.scheduleSetId); return { set, block: set?.blocks.find((b) => b.id === c.scheduleBlockId) }; };
  const order = (c: ReviewSection) => { const { set, block } = blockOf(c); return set && block ? set.blocks.indexOf(block) : 999; };
  classes.sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
  if (!classes.length) return <p className="px-3 py-6 text-center text-vc-gray">This student isn't enrolled in any classes this year.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse">
        <thead><tr>{["Block", "Class", "Teacher", "Room", "Terms", "Meets", ""].map((h, i) => <th key={i} className={axTh}>{h}</th>)}</tr></thead>
        <tbody>{classes.map((c) => {
          const { set, block } = blockOf(c);
          return (
            <tr key={c.id}>
              <td className={axTd}>{block?.name ?? <span className="text-vc-gray">None</span>}</td>
              <td className={axTd}><span className="font-semibold">{c.name}</span> <span className="text-vc-gray">{c.code}</span></td>
              <td className={axTd}>{c.teacherIds[0] ? teacherFull(c.teacherIds[0]) : "—"}</td>
              <td className={axTd}>{c.room || "—"}</td>
              <td className={axTd}>{c.terms.map((t) => t.split("-")[1]).join(" + ")}</td>
              <td className={`${axTd} text-[13px]`}>{blockTimes(set, block?.id) || "—"}</td>
              <td className={`${axTd} w-[72px]`}><div className="flex">
                <button type="button" aria-label={`Change section of ${c.name}`} title="Change section" onClick={() => actions.onChange(c)} className={ghost}><Pencil className="size-3.5" /></button>
                <button type="button" aria-label={`Drop ${c.name}`} title="Drop this class (all of its terms)" onClick={() => actions.onDrop(c)} className={`${ghost} text-destructive`}><X className="size-4" /></button>
              </div></td>
            </tr>);
        })}</tbody>
      </table>
    </div>
  );
}
