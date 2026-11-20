import { describe, expect, it } from 'vitest';
import { enrollmentPeople, validateClassRecord } from './class-records';
import type { User } from './auth-rules';
const users: User[] = [
  { id: 't', personId: 'teacher-person', role: 'teacher', first: 'Ada', last: 'Teacher', active: true, email: 't@example.org', password: 'test' },
  { id: 's', personId: 'student-person', role: 'student', first: 'Sam', last: 'Student', active: true, email: 's@example.org', password: 'test' },
];
const record = { name: 'Biology', section: 'A', terms: ['2026-S1'], teacherIds: ['teacher-person'], studentIds: ['student-person'] };
describe('class membership records', () => {
  it('includes created faculty and student person IDs', () => {
    expect(enrollmentPeople(users, 'teacher').map((u) => u.personId)).toEqual(['teacher-person']);
    expect(enrollmentPeople(users, 'student').map((u) => u.personId)).toEqual(['student-person']);
    expect(validateClassRecord(record, users)).toBeNull();
  });
  it('rejects mixed school years', () => {
    expect(validateClassRecord({ ...record, terms: ['2026-S1', '2027-S2'] }, users)).toBe('Choose terms within one school year.');
  });
  it('rejects a faculty record enrolled as a student', () => {
    expect(validateClassRecord({ ...record, studentIds: ['teacher-person'] }, users)).toBe('Enrollment must contain active student records.');
  });
  it('lets a new draft class be saved before a teacher is assigned', () => {
    expect(validateClassRecord({ ...record, teacherIds: [], studentIds: [], published: false }, users)).toBeNull();
  });
  it('requires a teacher once the class is published', () => {
    expect(validateClassRecord({ ...record, teacherIds: [], published: true }, users)).toBe('Assign at least one active faculty record.');
  });
  it('rejects a teacher who is not an active faculty record', () => {
    expect(validateClassRecord({ ...record, teacherIds: ['student-person'], published: false }, users)).toBe('Assign at least one active faculty record.');
  });
});
