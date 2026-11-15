import { describe, expect, it } from 'vitest';
import { durationMinutes, meetingsOn, type SchedulingSet } from './scheduling';
const sets: SchedulingSet[] = [{ id: 'set', name: 'Weekly', terms: ['2026-S1'], blocks: [{ id: 'a', name: 'A', days: [1, 3], start: '09:00', end: '09:50' }] }];
const section = { terms: ['2026-S1'], days: [], time: '', scheduleSetId: 'set', scheduleBlockId: 'a' };
describe('scheduled class meetings', () => {
  it('uses the weekly block on its selected weekdays', () => { expect(meetingsOn(section, sets, new Date(2026, 10, 16))[0]?.start).toBe('09:00'); expect(meetingsOn(section, sets, new Date(2026, 10, 17))).toEqual([]); });
  it('does not meet outside the scheduling set terms', () => { expect(meetingsOn({ ...section, terms: ['2026-S2'] }, sets, new Date(2027, 1, 1))).toEqual([]); });
  it('calculates the full block duration', () => { expect(durationMinutes('09:00', '09:50')).toBe(50); });
});