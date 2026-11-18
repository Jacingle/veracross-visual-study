// Pure helpers for the student-facing class website (timeline, calendar, schedule list, colors).
import { addDays, endOfMonth, format, startOfMonth, startOfWeek } from "date-fns";
import { blockMeetings, meetingsOn, type SchedulingSet, type ScheduledSection } from "./scheduling";
import type { Assignment } from "./sis-data";

/** The light blue used for links, the active tab and buttons on class websites. */
export const SITE_BLUE = "#007DDE";

export type SiteLink = { label: string; url: string };
export type SitePost = { id: string; title: string; date: string; body: string; links: SiteLink[]; published: boolean };
export type ResourceTopic = { id: string; title: string; links: SiteLink[] };

/** Background colors a teacher can pick for the class website (plus any custom color). */
export const SITE_COLORS = [
  "#aeeeff", "#b7e4c7", "#fde68a", "#fbcfe8", "#ddd6fe", "#e5e7eb",
  "#007DDE", "#3a6ea5", "#1f4e79", "#14284b", "#2e7d5b", "#2d6a4f",
  "#7a2e3a", "#9c2f2f", "#c27c2c", "#ee9b35", "#5b4a8a", "#7a5ea8",
  "#4a5560", "#111827", "#0f766e", "#0891b2", "#be185d", "#a16207",
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "13:40" -> "01:40" (12-hour clock, zero padded, no am/pm) as the class information page prints it. */
export function padTime12(value: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) return value;
  return `${String(Number(m[1]) % 12 || 12).padStart(2, "0")}:${m[2]}`;
}

/** "10:35" -> "10:35a", "13:00" -> "1p": the short time label used on calendar chips. */
export function chipTime(value: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) return value;
  const h = Number(m[1]);
  return `${h % 12 || 12}${m[2] === "00" ? "" : `:${m[2]}`}${h >= 12 ? "p" : "a"}`;
}

export type ScheduleLine = { day: number; dayName: string; start: string; end: string };

/** Weekly meeting times (Monday first) from the class's scheduling set, or its simple days + time. */
export function scheduleLines(section: ScheduledSection, sets: SchedulingSet[]): ScheduleLine[] {
  const set = sets.find((x) => x.id === section.scheduleSetId);
  let rows: { day: number; start: string; end: string }[];
  if (set?.meetings) rows = blockMeetings(set, section.scheduleBlockId ?? "").map((m) => ({ day: m.day, start: m.start, end: m.end }));
  else if (set) rows = set.blocks.filter((b) => b.id === section.scheduleBlockId).flatMap((b) => b.days.map((day) => ({ day, start: b.start, end: b.end })));
  else rows = section.days.map((day) => ({ day, start: section.time, end: "" }));
  return rows
    .map((r) => ({ ...r, dayName: DAY_NAMES[r.day] ?? "" }))
    .sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7) || a.start.localeCompare(b.start));
}

export type TimelineEvent = { key: string; kind: "assigned" | "due"; date: Date; assignment: Assignment };
export type TimelineWeek = { key: string; label: string; events: TimelineEvent[] };

const weekStart = (d: Date) => startOfWeek(d, { weekStartsOn: 0 });
/** "Nov 15-21", or "Nov 29-Dec 05" when the week crosses a month. */
export function weekLabel(start: Date): string {
  const end = addDays(start, 6);
  return `${format(start, "MMM dd")}-${start.getMonth() === end.getMonth() ? format(end, "dd") : format(end, "MMM dd")}`;
}

/** Assigned/Due events grouped by week, newest first. "recent" keeps two weeks back through next week. */
export function buildTimeline(list: Assignment[], now: Date, filter: "recent" | "all"): TimelineWeek[] {
  const from = addDays(weekStart(now), -14), to = addDays(weekStart(now), 14);
  const events = list.flatMap((a) => [
    { key: `${a.id}-assigned`, kind: "assigned" as const, date: a.assigned, assignment: a },
    { key: `${a.id}-due`, kind: "due" as const, date: a.due, assignment: a },
  ]).filter((e) => filter === "all" || (+e.date >= +from && +e.date < +to))
    // Newest first; on the same day the due event sits above the assigned one, as on Veracross.
    .sort((a, b) => +b.date - +a.date || (a.kind === "due" ? -1 : 1) - (b.kind === "due" ? -1 : 1));
  const weeks = new Map<string, TimelineWeek>();
  for (const e of events) {
    const start = weekStart(e.date), key = format(start, "yyyy-MM-dd");
    const w = weeks.get(key) ?? { key, label: weekLabel(start), events: [] };
    w.events.push(e); weeks.set(key, w);
  }
  return [...weeks.values()];
}

export type CalendarCell = { date: Date; inMonth: boolean };
/** Six full Sunday-first weeks that cover the month, so the grid keeps a steady height. */
export function monthGrid(month: Date): CalendarCell[][] {
  const first = startOfMonth(month), last = endOfMonth(month);
  const start = weekStart(first);
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => {
    const date = addDays(start, w * 7 + d);
    return { date, inMonth: +date >= +first && +date <= +last };
  }));
}

export type DayChip = { key: string; text: string; time?: string; tone: "green" | "red" | "block" };
/** Class meetings and due assignments for one calendar day. */
export function dayChips(date: Date, section: ScheduledSection & { block: string }, sets: SchedulingSet[], list: Assignment[]): DayChip[] {
  const due = list.filter((a) => format(a.due, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")).map((a): DayChip => ({
    key: a.id, text: a.title.replace(/^(Homework|Quiz|Test):\s*/i, ""), tone: ["TEST", "QUIZ"].includes(a.category) ? "red" : "green",
  }));
  const meets = meetingsOn(section, sets, date).map((m, i): DayChip => ({ key: `m${i}`, time: chipTime(m.start), text: m.name || section.block, tone: "block" }));
  return [...due, ...meets];
}

/** "Quiz" for QUIZ, "Classwork/homework" for CLASSWORK/HOMEWORK: how the home list names an assignment. */
export const categoryLabel = (cat: string) => cat.charAt(0) + cat.slice(1).toLowerCase();
