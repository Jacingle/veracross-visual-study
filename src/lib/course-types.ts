/** Course types. Advisory, Group and Homeroom are "Other Classes"; Academic and Athletic are regular classes. */
export const COURSE_TYPES = ["ACADEMIC", "ATHLETIC", "ADVISORY", "GROUP", "HOMEROOM"] as const;
export type CourseType = (typeof COURSE_TYPES)[number];

export const DEFAULT_COURSE_TYPE: CourseType = "ACADEMIC";
export const MAIN_TYPES: readonly CourseType[] = ["ACADEMIC", "ATHLETIC"];
export const OTHER_TYPES: readonly CourseType[] = ["ADVISORY", "GROUP", "HOMEROOM"];
export const TYPE_LABEL: Record<CourseType, string> = { ACADEMIC: "Academic", ATHLETIC: "Athletic", ADVISORY: "Advisory", GROUP: "Group", HOMEROOM: "Homeroom" };

export const isOtherClass = (type: string) => (OTHER_TYPES as readonly string[]).includes(type);

/** Saved records from before these types existed (for example ARTS) become Academic. */
export const normalizeCourseType = (type: unknown): CourseType => ((COURSE_TYPES as readonly unknown[]).includes(type) ? (type as CourseType) : DEFAULT_COURSE_TYPE);

/** Splits a class list into regular classes and "Other Classes", keeping the given order. Other classes are sorted by faculty. */
export function splitClasses<T extends { type: string; teacherIds?: string[] }>(list: T[], teacherLast: (id: string) => string = () => ""): { academic: T[]; other: T[] } {
  const key = (c: T) => teacherLast(c.teacherIds?.[0] ?? "").toLowerCase();
  return { academic: list.filter((c) => !isOtherClass(c.type)), other: list.filter((c) => isOtherClass(c.type)).sort((a, b) => key(a).localeCompare(key(b))) };
}
