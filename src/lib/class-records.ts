import type { User } from './auth-rules';
import type { Section } from './school-store';

/** Select school person records directly, without relying on directory render order. */
export function enrollmentPeople(users: User[], role: 'teacher' | 'student') {
  return users.filter((u) => u.active && u.role === role && u.personId)
    .filter((u, i, all) => all.findIndex((x) => x.personId === u.personId) === i)
    .sort((a, b) => a.last.localeCompare(b.last) || a.first.localeCompare(b.first));
}

export function validateClassRecord(c: Pick<Section, 'name' | 'section' | 'terms' | 'teacherIds' | 'studentIds'> & { aideIds?: string[] | undefined; published?: boolean | undefined }, users: User[]): string | null {
  if (!c.name.trim() || !c.section.trim()) return 'Class name and section identifier are required.';
  if (!c.terms.length || c.terms.some((id) => !/^\d{4}-S[12]$/.test(id)) || new Set(c.terms.map((id) => id.split('-')[0])).size !== 1) return 'Choose terms within one school year.';
  const teachers = new Set(enrollmentPeople(users, 'teacher').map((u) => u.personId));
  const students = new Set(enrollmentPeople(users, 'student').map((u) => u.personId));
  if (c.teacherIds.length > 1) return "A class has one teacher. Add anyone else as a teacher's aide.";
  if (c.teacherIds.some((id) => !teachers.has(id))) return 'Assign at least one active faculty record.';
  if (c.published && !c.teacherIds.length) return 'Assign at least one active faculty record.';
  const aides = c.aideIds ?? [];
  if (aides.some((id) => !teachers.has(id))) return "A teacher's aide must be an active faculty record.";
  if (aides.some((id) => c.teacherIds.includes(id))) return "The teacher can't also be an aide.";
  if (c.studentIds.some((id) => !students.has(id))) return 'Enrollment must contain active student records.';
  return null;
}
