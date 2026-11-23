// Student schedule review: lays one student's classes onto the school year's timetable (the scheduling
// set that covers each term) and reports problems. Pure functions, no React, so the rules can be tested.
import { blockMeetings, type BlockMeeting, type ScheduleBlock, type SchedulingSet } from "./scheduling";
import { makeYear, termLabel } from "./terms";

/** The parts of a class (section) the review needs; the school store's Section fits this. */
export type ReviewSection = {
  id: string; code: string; name: string; courseNo: string; terms: string[];
  scheduleSetId?: string | undefined; scheduleBlockId?: string | undefined;
  teacherIds: string[]; room: string; studentIds: string[]; published: boolean;
};

/** Saved administrator choices: which blocks must hold a class, and the minimum classes per term (blank = one per required block). */
export type ReviewSettings = { required?: Record<string, boolean>; minPerTerm?: number | null };

export type IssueKind = "duplicate-course" | "block-conflict" | "empty-block" | "term-short" | "term-uneven" | "unscheduled" | "no-timetable" | "unpublished";
export type Issue = { id: string; kind: IssueKind; severity: "error" | "warning"; termId?: string | undefined; blockId?: string | undefined; sectionIds: string[]; message: string };

export type BlockRow = { block: ScheduleBlock; required: boolean; sections: ReviewSection[] };
export type TermReview = {
  termId: string; label: string; set: SchedulingSet | undefined; rows: BlockRow[];
  /** Every class the student has this term, including ones that are not in a block of the timetable. */
  classes: ReviewSection[]; /** Classes that are in the term but not placed in a block of this term's timetable. */ unplaced: ReviewSection[]; expected: number;
};
export type StudentReview = { terms: TermReview[]; issues: Issue[]; errors: number; warnings: number };

/** Blocks that are normally not a class (Lunch, Advisory ...) start as "does not need a class"; the administrator can change this. */
export const NON_CLASS_BLOCK = /lunch|break|recess|assembly|chapel|advisory|community|office hours|flex/i;
export const blockRequired = (b: ScheduleBlock, settings: ReviewSettings = {}) => settings.required?.[b.id] ?? !NON_CLASS_BLOCK.test(b.name);

export const yearTerms = (yearId: string) => makeYear(Number(yearId)).terms;
/** The timetable a term follows: the first scheduling set that lists the term. */
export const setForTerm = (sets: SchedulingSet[], termId: string) => sets.find((s) => s.terms.includes(termId));
export const sectionsInYear = <T extends { studentIds: string[]; terms: string[] }>(sections: T[], studentId: string, yearId: string) =>
  sections.filter((c) => c.studentIds.includes(studentId) && c.terms.some((t) => t.startsWith(`${yearId}-`)));

const plural = (n: number, one: string, many = `${one}es`) => `${n} ${n === 1 ? one : many}`;
const list = (xs: string[]) => xs.join(", ");

export function reviewStudent({ sections, studentId, yearId, sets, settings = {} }: { sections: ReviewSection[]; studentId: string; yearId: string; sets: SchedulingSet[]; settings?: ReviewSettings }): StudentReview {
  const mine = sectionsInYear(sections, studentId, yearId);
  const issues: Issue[] = [];
  const add = (i: Omit<Issue, "id">) => issues.push({ ...i, id: [i.kind, i.termId ?? "", i.blockId ?? "", ...i.sectionIds].join(":") });

  const terms: TermReview[] = yearTerms(yearId).map((t) => {
    const label = termLabel(t.id);
    const classes = mine.filter((c) => c.terms.includes(t.id));
    const set = setForTerm(sets, t.id);
    const rows: BlockRow[] = (set?.blocks ?? []).map((block) => ({
      block, required: blockRequired(block, settings),
      sections: classes.filter((c) => c.scheduleSetId === set?.id && c.scheduleBlockId === block.id),
    }));
    const placed = new Set(rows.flatMap((r) => r.sections.map((c) => c.id)));
    const unplaced = classes.filter((c) => !placed.has(c.id));
    const expected = settings.minPerTerm ?? rows.filter((r) => r.required).length;

    if (!set) add({ kind: "no-timetable", severity: "warning", termId: t.id, sectionIds: [], message: `No scheduling set covers ${label}, so its blocks can't be checked.` });
    for (const r of rows) {
      if (r.sections.length > 1) add({ kind: "block-conflict", severity: "error", termId: t.id, blockId: r.block.id, sectionIds: r.sections.map((c) => c.id), message: `${r.block.name} has ${r.sections.length} classes in ${label}: ${list(r.sections.map((c) => c.name))}.` });
      if (r.required && r.sections.length === 0) add({ kind: "empty-block", severity: "error", termId: t.id, blockId: r.block.id, sectionIds: [], message: `Nothing is scheduled in ${r.block.name} in ${label}.` });
    }
    for (const c of unplaced) add({ kind: "unscheduled", severity: "warning", termId: t.id, sectionIds: [c.id], message: set && c.scheduleSetId && c.scheduleSetId !== set.id ? `${c.name} uses a different scheduling set than ${label} follows (${set.name}).` : `${c.name} has no block yet in ${label}, so it can't be placed on the timetable.` });
    const byCourse = new Map<string, ReviewSection[]>();
    for (const c of classes) byCourse.set(c.courseNo, [...(byCourse.get(c.courseNo) ?? []), c]);
    for (const [courseNo, group] of byCourse) if (group.length > 1) add({ kind: "duplicate-course", severity: "error", termId: t.id, sectionIds: group.map((c) => c.id), message: `Enrolled in ${group.length} sections of ${group[0]?.name ?? courseNo} in ${label}: ${list(group.map((c) => c.code))}.` });
    if (expected > 0 && classes.length < expected) add({ kind: "term-short", severity: "error", termId: t.id, sectionIds: [], message: `${label} has ${plural(classes.length, "class")}; at least ${expected} ${settings.minPerTerm != null ? "are required" : "are expected (one per block that needs a class)"}.` });
    return { termId: t.id, label, set, rows, classes, unplaced, expected };
  });

  const [a, b] = terms;
  if (a && b && a.classes.length !== b.classes.length) add({ kind: "term-uneven", severity: "error", sectionIds: [], message: `Uneven terms: ${a.label} has ${plural(a.classes.length, "class")} but ${b.label} has ${plural(b.classes.length, "class")}.` });
  for (const c of mine) if (!c.published) add({ kind: "unpublished", severity: "warning", sectionIds: [c.id], message: `${c.name} (${c.code}) is a draft, so it doesn't show on the student's portal.` });

  issues.sort((x, y) => Number(y.severity === "error") - Number(x.severity === "error"));
  return { terms, issues, errors: issues.filter((i) => i.severity === "error").length, warnings: issues.filter((i) => i.severity === "warning").length };
}

/** What adding (or swapping in) a section would do to a student's schedule, before it is saved. */
export function placementFor({ candidate, mine, sets, replacing }: { candidate: ReviewSection; mine: ReviewSection[]; sets: SchedulingSet[]; replacing?: string | undefined }): { conflicts: string[]; notes: string[] } {
  const conflicts: string[] = [], notes: string[] = [];
  const set = sets.find((s) => s.id === candidate.scheduleSetId);
  const block = set?.blocks.find((b) => b.id === candidate.scheduleBlockId);
  if (!block) notes.push("This section has no block yet, so the schedule can't be checked.");
  for (const c of mine) {
    if (c.id === replacing || c.id === candidate.id) continue;
    const shared = c.terms.filter((t) => candidate.terms.includes(t));
    if (!shared.length) continue;
    const when = list(shared.map(termLabel));
    if (c.courseNo === candidate.courseNo) conflicts.push(`Already in ${c.name} (${c.code}) in ${when}.`);
    else if (block && c.scheduleSetId === candidate.scheduleSetId && c.scheduleBlockId === candidate.scheduleBlockId) conflicts.push(`${block.name} is already taken by ${c.name} in ${when}.`);
  }
  return { conflicts, notes };
}

export const enrollStudent = <T extends { id: string; studentIds: string[] }>(sections: T[], sectionId: string, studentId: string): T[] =>
  sections.map((c) => (c.id === sectionId && !c.studentIds.includes(studentId) ? { ...c, studentIds: [...c.studentIds, studentId] } : c));
export const withdrawStudent = <T extends { id: string; studentIds: string[] }>(sections: T[], sectionId: string, studentId: string): T[] =>
  sections.map((c) => (c.id === sectionId ? { ...c, studentIds: c.studentIds.filter((x) => x !== studentId) } : c));
/** Move a student from one section to another section of the same course. */
export const changeSection = <T extends { id: string; studentIds: string[] }>(sections: T[], studentId: string, fromId: string, toId: string): T[] =>
  enrollStudent(withdrawStudent(sections, fromId, studentId), toId, studentId);

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** 24-hour "13:05" as the school writes it: "1:05 pm". */
export const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) return t;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};
const dayOrder = (d: number) => (d + 6) % 7;
/** When a block meets, for example "Mon 8:00 am–8:50 am · Wed 9:00 am–9:50 am". */
export function blockTimes(set: SchedulingSet | undefined, blockId: string | undefined): string {
  if (!set || !blockId) return "";
  const ms = blockMeetings(set, blockId).sort((x, y) => dayOrder(x.day) - dayOrder(y.day) || x.start.localeCompare(y.start));
  if (ms.length) return ms.map((m) => `${DAY[m.day]} ${fmtTime(m.start)}–${fmtTime(m.end)}`).join(" · ");
  const b = set.blocks.find((x) => x.id === blockId);
  return b?.start && b.end ? `${[...b.days].sort((x, y) => dayOrder(x) - dayOrder(y)).map((d) => DAY[d]).join(" ")} ${fmtTime(b.start)}–${fmtTime(b.end)}` : "";
}

export type WeeklyGrid = { days: number[]; slots: { key: string; start: string; end: string }[]; cell: (day: number, slotKey: string) => BlockMeeting | undefined };
/** The set's week as a grid: a column per day, a row per distinct meeting time. */
export function weeklyGrid(set: SchedulingSet): WeeklyGrid {
  const days = [...(set.weekdays ?? [])].sort((x, y) => dayOrder(x) - dayOrder(y));
  const ms = (set.meetings ?? []).filter((m) => days.includes(m.day));
  const slots = [...new Map(ms.map((m) => [`${m.start}-${m.end}`, { key: `${m.start}-${m.end}`, start: m.start, end: m.end }])).values()].sort((x, y) => x.start.localeCompare(y.start));
  return { days, slots, cell: (day, key) => ms.find((m) => m.day === day && `${m.start}-${m.end}` === key) };
}
export const dayLabel = (d: number) => DAY[d] ?? "";
