import { expect, it } from 'vitest';
import { scoreOf } from './gradebook';
import { canImpersonate, type User } from './auth-rules';
import type { Assignment } from './sis-data';
const a: Assignment = { id: 'assignment', courseId: 'class', title: 'Quiz', short: 'QZ', category: 'QUIZ', points: 10, assigned: new Date(), due: new Date(), notes: '' };
it('a student sees only their entered score, including zero', () => {
  expect(scoreOf({ 'assignment|student': '9', 'assignment|other': '0' }, a, 'student')).toBe(9);
  expect(scoreOf({ 'assignment|other': '0' }, a, 'other')).toBe(0);
  expect(scoreOf({}, a, 'student')).toBeUndefined();
});
it('administrators may impersonate active students, never administrators', () => {
  const actor: User = { id: 'admin', first: 'Admin', last: 'Account', email: 'admin@example.org', password: 'test', personId: '', role: 'admin', active: true };
  expect(canImpersonate(actor, { ...actor, id: 'student', role: 'student' })).toBe(true);
  expect(canImpersonate(actor, actor)).toBe(false);
  expect(canImpersonate({ ...actor, role: 'teacher' }, { ...actor, role: 'student' })).toBe(false);
});