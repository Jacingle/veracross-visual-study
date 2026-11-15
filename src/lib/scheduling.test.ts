import { describe, expect, it } from 'vitest';
import { durationMinutes, meetingsOn, validateSchedulingSet, type SchedulingSet } from './scheduling';
const sets: SchedulingSet[] = [{ id: 'set', name: 'Weekly', terms: ['2026-S1'], blocks: [{ id: 'a', name: 'A', days: [1, 3], start: '09:00', end: '09:50' }] }];
const section = { terms: ['2026-S1'], days: [], time: '', scheduleSetId: 'set', scheduleBlockId: 'a' };
describe('scheduled class meetings', () => {
  it('uses the weekly block on its selected weekdays', () => { expect(meetingsOn(section, sets, new Date(2026, 10, 16))[0]?.start).toBe('09:00'); expect(meetingsOn(section, sets, new Date(2026, 10, 17))).toEqual([]); });
  it('does not meet outside the scheduling set terms', () => { expect(meetingsOn({ ...section, terms: ['2026-S2'] }, sets, new Date(2027, 1, 1))).toEqual([]); });
  it('uses day meeting times assigned to the block', () => {
    const rot: SchedulingSet = { id: 'r', name: 'Rotation', terms: ['2026-S1'], blocks: [{ id: 'a', name: 'A', days: [], start: '', end: '' }], weekdays: [1, 2], meetings: [{ id: 'm1', day: 1, start: '08:00', end: '09:05', blockId: 'a' }, { id: 'm2', day: 2, start: '12:30', end: '13:35', blockId: 'a' }] };
    const s2 = { ...section, scheduleSetId: 'r' };
    expect(meetingsOn(s2, [rot], new Date(2026, 10, 16))[0]?.start).toBe('08:00');
    expect(meetingsOn(s2, [rot], new Date(2026, 10, 17))[0]?.start).toBe('12:30');
    expect(meetingsOn(s2, [rot], new Date(2026, 10, 18))).toEqual([]);
    expect(validateSchedulingSet(rot)).toBeNull();
    expect(validateSchedulingSet({ ...rot, meetings: [{ id: 'x', day: 1, start: '09:00', end: '10:00', blockId: '' }] })).toMatch(/Assign a block/);
  });
  it('calculates the full block duration', () => { expect(durationMinutes('09:00', '09:50')).toBe(50); });
});