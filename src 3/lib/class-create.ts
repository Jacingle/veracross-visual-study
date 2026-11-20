import type { Course } from "./sis-data";
import type { CourseDef, Section } from "./school-store";

/** Next free class ID for a course: "<course>-<n>", skipping IDs that are already taken. */
export function nextClassId(sections: Pick<Section, "id" | "courseNo">[], courseNo: string): { id: string; section: string } {
  let n = sections.filter((s) => s.courseNo === courseNo).length + 1;
  while (sections.some((s) => s.id === `${courseNo}-${n}`)) n++;
  return { id: `${courseNo}-${n}`, section: String(n) };
}

export type NewClassOptions = { year: string; terms?: "FY" | "S1" | "S2"; teacherId?: string; website: Section["website"] };

/** A new class (section) of a course: a draft with no block or room yet, so nothing shows on portals until it is published. */
export function buildSection(course: CourseDef, sections: Pick<Section, "id" | "courseNo">[], opts: NewClassOptions): Section {
  const { id, section } = nextClassId(sections, course.id);
  const terms = opts.terms === "S1" ? [`${opts.year}-S1`] : opts.terms === "S2" ? [`${opts.year}-S2`] : [`${opts.year}-S1`, `${opts.year}-S2`];
  const teacherId = opts.teacherId ?? "";
  const base: Course = { id, code: id, name: course.name, section, teacherId, block: "", room: "", letter: "", pct: 0, type: course.type, days: [], time: "" };
  return { ...base, courseNo: course.id, teacherIds: teacherId ? [teacherId] : [], terms, published: false, studentIds: [], website: { ...opts.website } };
}
