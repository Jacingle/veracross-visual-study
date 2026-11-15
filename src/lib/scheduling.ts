import { termOn } from './terms';

export type ScheduleBlock = { id: string; name: string; days: number[]; start: string; end: string };
export type SchedulingSet = { id: string; name: string; terms: string[]; blocks: ScheduleBlock[] };
export type ScheduledSection = { terms: string[]; days: number[]; time: string; scheduleSetId?: string | undefined; scheduleBlockId?: string | undefined };

export const durationMinutes = (start: string, end: string) => {
  const minutes = (s: string) => { const [h, m] = s.split(':').map(Number); return (h ?? 0) * 60 + (m ?? 0); };
  return minutes(end) - minutes(start);
};
export function meetingsOn(section: ScheduledSection, sets: SchedulingSet[], date: Date) {
  if (!termOn(section.terms, date)) return [];
  if (!section.scheduleSetId) return section.days.includes(date.getDay()) ? [{ start: section.time, end: '', name: '' }] : [];
  const set = sets.find((x) => x.id === section.scheduleSetId);
  if (!set || !termOn(set.terms, date)) return [];
  return set.blocks.filter((b) => b.id === section.scheduleBlockId && b.days.includes(date.getDay()));
}
export function validateSchedulingSet(set: SchedulingSet): string | null {
  if (!set.name.trim()) return 'Enter a scheduling set name.';
  if (!set.terms.length) return 'Select at least one term.';
  if (!set.blocks.length) return 'Add at least one block.';
  if (set.blocks.some((b) => !b.name.trim() || !b.days.length || !/^\d{2}:\d{2}$/.test(b.start) || !/^\d{2}:\d{2}$/.test(b.end) || durationMinutes(b.start, b.end) <= 0)) return 'Each block needs a name, weekdays and an end time after its start.';
  return null;
}