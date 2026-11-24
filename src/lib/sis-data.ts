// Fictional Cedar Ridge Academy dataset. Single source of truth: every page reads from here.
import { addDays, format, isWeekend, startOfDay } from "date-fns";
import { isOtherClass, type CourseType } from "./course-types";

/** Who the school is. Administrators change this under School Information; the store copies what they saved into SCHOOL. */
export type SchoolInfo = { name: string; short: string; domain: string; /** Picture as a data URL; empty shows the name only. */ logo: string; head: string; address: string; address2: string; city: string; state: string; postal: string; phone: string; website: string };
export const SCHOOL_DEFAULT: SchoolInfo = { name: "Cedar Ridge Academy", short: "CRA", domain: "cedarridge.edu", logo: "", head: "", address: "", address2: "", city: "", state: "", postal: "", phone: "", website: "" };
export const SCHOOL: SchoolInfo = { ...SCHOOL_DEFAULT };
/** Make SCHOOL show the saved values (anything not saved falls back to the default). */
export function applySchool(saved?: Partial<SchoolInfo>) { Object.assign(SCHOOL, SCHOOL_DEFAULT, saved ?? {}); }

export type Teacher = { id: string; prefix: string; first: string; last: string; email: string; dept: string; title: string };
export type Course = {
  id: string; code: string; name: string; section: string; teacherId: string; block: string; room: string;
  letter: string; pct: number; type: CourseType; days: number[]; time: string;
};
export type Student = {
  email?: string;
  id: string; first: string; last: string; grade: number; address: string; homePhone: string;
  parents: { name: string; mobile: string; email: string }[];
};

export const TEACHERS: Teacher[] = [];

/** People created by the admin at runtime (filled in by the school store) so lookups cover them too. */
export const EXTRA = { teachers: [] as Teacher[], students: [] as Student[] };
export const teacher = (id: string): Teacher => TEACHERS.find((t) => t.id === id) ?? EXTRA.teachers.find((t) => t.id === id) ?? { id, prefix: "", first: "Unassigned", last: "Teacher", email: "", dept: "", title: "" };
export const teacherShort = (id: string) => { const t = teacher(id); return `${t.prefix} ${t.last}`; };
export const teacherFull = (id: string) => { const t = teacher(id); return `${t.prefix} ${t.first} ${t.last}`; };

// days: 1=Mon..5=Fri
export const COURSES: Course[] = [];
// Extra sections taught by the demo teacher (not on the demo student's schedule).
export const FACULTY_SECTIONS: Course[] = [];
export const ALL_SECTIONS: Course[] = [...COURSES, ...FACULTY_SECTIONS];
export const section = (id: string) => ALL_SECTIONS.find((c) => c.id === id);
export const sectionsFor = (teacherId: string) => ALL_SECTIONS.filter((c) => c.teacherId === teacherId);
export const course = (id: string) => ALL_SECTIONS.find((c) => c.id === id)!;
export const courseTitle = (c: Course) => `${c.name} - ${c.section}`;

export const ME = { first: "Jack", last: "Ingle", email: "jingle@cedarridge.edu", grade: 9, advisorId: "t3" };

export type Category = "HOMEWORK" | "QUIZ" | "TEST" | "COLLABORATION" | "CLASSWORK/HOMEWORK" | "VOCABULARY" | "WRITING" | "READING";
export type Assignment = { id: string; courseId: string; category: Category; title: string; due: Date; assigned: Date; short: string; points: number; notes: string; score?: number | undefined; custom?: boolean };

const PLAN: Record<string, { cat: Category; title: string; short: string }[]> = {
  "101-1": [{ cat: "VOCABULARY", title: "Vocabulary Unit #", short: "Vocab" }, { cat: "CLASSWORK/HOMEWORK", title: "Reading Annotations #", short: "CwHw" }, { cat: "WRITING", title: "Personal Narrative Draft #", short: "Wr" }],
  "122-1": [{ cat: "QUIZ", title: "Quiz", short: "QZ" }, { cat: "READING", title: "Reading: Chapter #", short: "Rd" }, { cat: "WRITING", title: "Paper", short: "Wr" }],
  "143-1": [{ cat: "HOMEWORK", title: "Unit 11 Homework #", short: "HW" }, { cat: "HOMEWORK", title: "Unit 11 Practice Set #", short: "HW" }, { cat: "QUIZ", title: "Unit 11 Quiz #", short: "QZ" }],
  "191-1": [{ cat: "HOMEWORK", title: "作业 #", short: "HW" }, { cat: "VOCABULARY", title: "Lesson # Characters", short: "Vocab" }],
  "210-1": [{ cat: "COLLABORATION", title: "Lab # Group Work", short: "Col" }, { cat: "QUIZ", title: "Cells Quiz #", short: "QZ" }],
  "93-1": [{ cat: "CLASSWORK/HOMEWORK", title: "Seminar Prep #", short: "CL" }],
};

export const today = () => startOfDay(new Date());

// Deterministic assignments spanning ±4 weeks around today.
export function buildAssignments(): Assignment[] { return []; }
const NOTES: Record<Category, string> = {
  HOMEWORK: "Complete all odd-numbered problems and show your work.", QUIZ: "Short quiz at the start of class. Review your notes.",
  TEST: "Unit test covering all sections. Calculators allowed.", COLLABORATION: "Work with your lab group; one write-up per group.",
  "CLASSWORK/HOMEWORK": "Please read and annotate the assigned pages. There will likely be a quiz on the material.", VOCABULARY: "Study the unit word list and example sentences.",
  WRITING: "Submit your draft to the dropbox before class.", READING: "Read the chapter and answer the guiding questions.",
};
export const ALL_ASSIGNMENTS = buildAssignments();
/** The demo student's assignments (their own classes only). */
export const ASSIGNMENTS = ALL_ASSIGNMENTS.filter((a) => COURSES.some((c) => c.id === a.courseId));

/** Deterministic roster score for a past assignment (teacher gradebook demo data). */
export function rosterScore(studentId: string, a: Assignment): number | undefined {
  if (a.due >= today()) return undefined;
  const h = (studentId + a.id).split("").reduce((x, ch) => (x * 31 + ch.charCodeAt(0)) % 9973, 7);
  return Math.round(a.points * (0.62 + (h % 39) / 100));
}

export const CATEGORY_CHIP: Record<string, string> = {
  HOMEWORK: "bg-cat-homework", QUIZ: "bg-cat-quiz", TEST: "bg-cat-test", COLLABORATION: "bg-cat-blue",
  "CLASSWORK/HOMEWORK": "bg-cat-blue", VOCABULARY: "bg-cat-paper", WRITING: "bg-cat-paper", READING: "bg-cat-reading",
};

export const CATEGORY_TOKEN: Record<Category, string> = {
  HOMEWORK: "border-l-cat-homework", QUIZ: "border-l-cat-quiz", TEST: "border-l-cat-test", COLLABORATION: "border-l-cat-collab",
  "CLASSWORK/HOMEWORK": "border-l-cat-classwork", VOCABULARY: "border-l-cat-classwork", WRITING: "border-l-cat-classwork", READING: "border-l-cat-reading",
};

export type Period = { time: string; title: string; detail: string; kind: "class" | "break"; courseId?: string };
export function scheduleFor(date: Date): Period[] {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return [];
  const slots = ["8:00 am", "9:10 am", "10:15 am", "10:35 am", "11:45 am", "12:50 pm", "1:40 pm", "2:45 pm"];
  const rot = COURSES.filter((c) => c.days.includes(dow) && !isOtherClass(c.type));
  const pick = (i: number) => rot[(i + dow) % rot.length]!;
  const cls = (i: number): Period => { const c = pick(i); return { time: "", title: courseTitle(c), detail: `${teacher(c.teacherId).last} • ${c.block} • ${c.room}`, kind: "class", courseId: c.id }; };
  const list: Period[] = [
    cls(0), { ...cls(1) },
    { time: "", title: `US Advisory -${teacher(ME.advisorId).last}`, detail: `${teacher(ME.advisorId).last} • Community Time • U206`, kind: "class" },
    cls(2), cls(3),
    { time: "", title: "Lunch", detail: "Lunch", kind: "break" },
    cls(4),
    { time: "", title: "Office Hours", detail: "Office Hours", kind: "break" },
  ];
  // de-duplicate repeated classes into Study Hall
  const seen = new Set<string>();
  return list.map((p, i) => {
    if (p.courseId) { if (seen.has(p.courseId)) return { time: slots[i]!, title: "Study Hall - 2", detail: "Tobin • US Block B • USLib", kind: "class" as const }; seen.add(p.courseId); }
    return { ...p, time: slots[i]! };
  });
}

export type SchoolEvent = { date: Date; title: string; time?: string };
export function events(): SchoolEvent[] { return []; }

// Fictional student roster
const FIRST = ["Reigan","Logan","Maya","Elijah","Priya","Owen","Sofia","Marcus","Hannah","Theo","Amara","Caleb","Lena","Isaac","Nora","Julian","Zoe","Andre","Clara","Felix","Ivy","Mateo","Ruby","Samir"];
const LAST = ["Abbott","Ancona","Bishop","Castellano","Delgado","Ellison","Farrow","Greer","Hartley","Iverson","Kaminski","Lowell","Mercer","Nakamura","Okafor","Pruitt","Quintero","Rasmussen","Sterling","Thorne","Vance","Whitaker","Yoshida","Zielinski"];
const STREETS = ["Trailwood Lane","Hillcrest Avenue","Maple Ridge Drive","Lakeshore Road","Cedar Bend Court","Kensington Way"];
const TOWNS = ["Warren, MI 48092","Grosse Pointe Farms, MI 48236","Birmingham, MI 48009","Royal Oak, MI 48067","Troy, MI 48084"];
const PARENT_F = ["David","Christopher","Michael","Anthony","Robert","James"];
const PARENT_M = ["Tamika","Jeannette","Laura","Angela","Monica","Rachel"];
const ph = (n: number) => `${["313","586","248"][n % 3]}-${String(200 + (n * 37) % 799).padStart(3, "0")}-${String(1000 + (n * 431) % 8999)}`;

export const STUDENTS: Student[] = [];
export const studentById = (id: string): Student | undefined => (id === "me" ? ME_STUDENT : STUDENTS.find((s) => s.id === id) ?? EXTRA.students.find((s) => s.id === id));
export const studentEmail = (s: Student) => s.email || `${s.first.toLowerCase()}${s.last.toLowerCase()}@cedarridge.edu`;

// class rosters: deterministic subset of grade-9 students
export const rosterFor = (courseId: string) => {
  const seed = courseId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return STUDENTS.filter((s, i) => s.grade === 9 && (i + seed) % 2 === 0).slice(0, 8);
};

export const ME_STUDENT: Student = {
  id: "me", first: ME.first, last: ME.last, grade: ME.grade, address: "1842 Trailwood Lane, Birmingham, MI 48009", homePhone: "248-555-0142",
  parents: [{ name: "David Ingle", mobile: "248-555-0188", email: "david.ingle@example.com" }, { name: "Laura Ingle", mobile: "248-555-0179", email: "laurai@example.com" }],
};
/** Teacher-facing roster: the demo student is enrolled in all of their own classes. */
export const teacherRoster = (courseId: string) => (COURSES.some((c) => c.id === courseId) ? [ME_STUDENT, ...rosterFor(courseId)] : rosterFor(courseId));

export type Message = { id: string; from: string; list: string; subject: string; body: string; date: Date; email?: string };
export const MESSAGES: Message[] = [];

export const RESOURCE_TILES: string[] = [];

export type DayEvent = { time: string; ampm: string; kind: string; title: string };
export const TODAY_EVENTS: DayEvent[] = [];
export const NEWS: { title: string; body: string; date: Date }[] = [];
export const TEACHER_TIP = "Use the Notifications tab to let families know when a student misses an assignment — it takes seconds and keeps everyone in the loop.";

export const SEED_USERS = [
  { id: "u-admin", email: "administrator@ulls.org", password: "administrator@ulls.org", role: "admin" as const, first: "School", last: "Administrator", personId: "", active: true },
  { id: "u-teacher", email: "teacher@ulls.org", password: "teacher@ulls.org", role: "teacher" as const, first: "Faculty", last: "Account", personId: "p-teacher", active: true },
  { id: "u-student", email: "student@ulls.org", password: "student@ulls.org", role: "student" as const, first: "Student", last: "Account", personId: "p-student", active: true },
];

export const RESOURCES: { group: string; items: string[] }[] = [];

export const fmtDay = (d: Date) => format(d, "EEE - MMM d").toUpperCase();
