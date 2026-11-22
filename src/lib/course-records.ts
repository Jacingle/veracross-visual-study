import type { CourseDef } from "./school-store";

/** Defaults for a new course's YES/NO switches (the same ones Veracross starts a new course with). */
export const defaultCourseFlags = (): Record<string, boolean> => ({
  report: true, transcript: false, gpa: false, archive: false,
  request: false, scheduler: false, conferences: true, reviews: true,
});

/** A short course ID from the name when the person leaves Course ID blank: "K Homeroom" becomes KHOME. */
export function makeCourseId(name: string, taken: string[]): string {
  const words = name.trim().split(/\s+/).map((w) => w.replace(/[^A-Za-z0-9]/g, "")).filter(Boolean);
  const base = words.map((w) => w.slice(0, words.length > 1 ? 4 : 8)).join("").toUpperCase().slice(0, 12) || "COURSE";
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** A class key from the Class ID the person typed ("K-HR: 1" becomes K-HR-1), unique among existing classes. */
export function makeSectionId(code: string, taken: string[]): string {
  const base = code.trim().replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "class";
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function validateCourse(c: Pick<CourseDef, "id" | "name" | "dept" | "credits">, taken: string[], editing = false): string | null {
  if (!c.name.trim()) return "Course name is required.";
  if (!c.dept.trim()) return "Subject is required.";
  if (!editing && c.id && !/^[A-Za-z0-9_-]{1,20}$/.test(c.id)) return "Course ID: up to 20 letters, digits, hyphens or underscores.";
  if (!editing && c.id && taken.includes(c.id)) return "That course ID already exists.";
  if (!Number.isFinite(c.credits) || c.credits < 0) return "Credits must be a nonnegative number.";
  return null;
}
