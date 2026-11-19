import { expect, it } from 'vitest';
import { csvText, publishingError } from './admin-tools';
import type { Section } from './school-store';
it('exports quoted values and never evaluates spreadsheet formulas', () => {
  expect(csvText([['Name', 'Notes'], ['Zhang, Amy', '=SUM(A1)', 'a"b']])).toBe('"Name","Notes"\r\n"Zhang, Amy","\'=SUM(A1)","a""b"');
});
it('does not publish a class with missing room or invalid teachers', () => {
  const c = { name: 'Algebra', section: '1', terms: ['2026-S1'], teacherIds: ['t'], studentIds: [], block: 'A', room: '' };
  const users = [{ id: 'u', personId: 't', role: 'teacher' as const, active: true, first: 'Amy', last: 'Zhang', email: 'a@example.org', password: 'test' }];
  expect(publishingError(c, users)).toBe('Set a block and room before publishing.');
  expect(publishingError({ ...c, room: '101' }, users)).toBeNull();
  expect(publishingError({ ...c, room: '101', teacherIds: ['missing'] }, users)).toBe('Assign at least one active faculty record.');
});