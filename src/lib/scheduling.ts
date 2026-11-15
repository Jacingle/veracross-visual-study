import { termOn } from './terms';

export type ScheduleBlock = { id: string; name: string; days: number[]; start: string; end: string };
export type BlockMeeting = { id: string; day: number; start: string; end: string; blockId: string };
/** Blocks are defined first; `weekdays` is the set's length; `meetings` are the day's time slots with a block assigned. */
export type SchedulingSet = { id: string; name: string; terms: string[]; blocks: ScheduleBlock[]; weekdays?: number[]; meetings?: BlockMeeting[] };
export const blockMeetings = (set: SchedulingSet, blockId: string) => (set.meetings ?? []).filter((m) => m.blockId === blockId && (set.weekdays ?? []).includes(m.day));
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
  if (set.meetings) return blockMeetings(set, section.scheduleBlockId ?? '').filter((m) => m.day === date.getDay()).map((m) => ({ ...m, name: set.blocks.find((b) => b.id === m.blockId)?.name ?? '' }));
  return set.blocks.filter((b) => b.id === section.scheduleBlockId && b.days.includes(date.getDay()));
}
export function validateSchedulingSet(set: SchedulingSet): string | null {
  if (!set.name.trim()) return 'Enter a scheduling set name.';
  if (!set.terms.length) return 'Select at least one term.';
  if (!set.blocks.length || set.blocks.some((b) => !b.name.trim())) return 'Add at least one named block.';
  if (!set.weekdays?.length) return 'Choose the days this scheduling set runs.';
  const ms = (set.meetings ?? []).filter((m) => set.weekdays?.includes(m.day));
  if (!ms.length) return 'Add meeting times to at least one day.';
  if (ms.some((m) => !/^\d{2}:\d{2}$/.test(m.start) || !/^\d{2}:\d{2}$/.test(m.end) || durationMinutes(m.start, m.end) <= 0)) return 'Each meeting time needs an end after its start.';
  if (ms.some((m) => !set.blocks.some((b) => b.id === m.blockId))) return 'Assign a block to every meeting time.';
  return null;
}
