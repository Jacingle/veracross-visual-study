import { describe, expect, it } from 'vitest';
import { enrollmentPeople, validateClassRecord } from './class-records';
import type { User } from './auth-rules';
const users: User[] = [
  { id: 't', personId: 'teacher-person', role: 'teacher', first: 'Ada', last: 'Teacher', active: true, email: 't@example.org', password: 'test' },
  { id: 't2', personId: 'aide-person', role: 'teacher', first: 'Al', last: 'Aide', active: true, email: 'a@example.org', password: 'test' },
  { id: 's', personId: 'student-person', role: 'student', first: 'Sam', last: 'Student', active: true, email: 's@example.org', password: 'test' },
];
const record = { name: 'Biology', section: 'A', terms: ['2026-S1'], teacherIds: ['teacher-person'], studentIds: ['student-person'] };
describe('class membership records', () => {
  it('includes created faculty and student person IDs', () => {
    expect(enrollmentPeople(users, 'teacher').map((u) => u.personId)).toEqual(['aide-person', 'teacher-person']);
    expect(enrollmentPeople(users, 'student').map((u) => u.personId)).toEqual(['student-person']);
    expect(validateClassRecord(record, users)).toBeNull();
  });
  it('rejects mixed school years', () => {
    expect(validateClassRecord({ ...record, terms: ['2026-S1', '2027-S2'] }, users)).toBe('Choose terms within one school year.');
  });
  it('rejects a faculty record enrolled as a student', () => {
    expect(validateClassRecord({ ...record, studentIds: ['teacher-person'] }, users)).toBe('Enrollment must contain active student records.');
  });
  it('allows one teacher and any number of aides', () => {
    expect(validateClassRecord({ ...record, aideIds: ['aide-person'] }, users)).toBeNull();
  });
  it('rejects a second teacher, and a teacher who is also an aide', () => {
    expect(validateClassRecord({ ...record, teacherIds: ['teacher-person', 'aide-person'] }, users)).toBe("A class has one teacher. Add anyone else as a teacher's aide.");
    expect(validateClassRecord({ ...record, aideIds: ['teacher-person'] }, users)).toBe("The teacher can't also be an aide.");
  });
  it('rejects a student as an aide', () => {
    expect(validateClassRecord({ ...record, aideIds: ['student-person'] }, users)).toBe("A teacher's aide must be an active faculty record.");
  });
  it('lets a draft class have no teacher but not a published one', () => {
    expect(validateClassRecord({ ...record, teacherIds: [] }, users)).toBeNull();
    expect(validateClassRecord({ ...record, teacherIds: [], published: true }, users)).toBe('Assign at least one active faculty record.');
  });
});
