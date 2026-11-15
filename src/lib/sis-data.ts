// Fictional Cedar Ridge Academy dataset. Single source of truth: every page reads from here.
import { addDays, format, isWeekend, startOfDay } from "date-fns";

export const SCHOOL = { name: "Cedar Ridge Academy", short: "CRA", domain: "cedarridge.edu" };

export type Teacher = { id: string; prefix: string; first: string; last: string; email: string; dept: string; title: string };
export type Course = {
  id: string; code: string; name: string; section: string; teacherId: string; block: string; room: string;
  letter: string; pct: number; type: "ACADEMIC" | "ARTS" | "ADVISORY"; days: number[]; time: string;
};
export type Student = {
  id: string; first: string; last: string; grade: number; address: string; homePhone: string;
  parents: { name: string; mobile: string; email: string }[];
};

export const TEACHERS: Teacher[] = [
  { id: "t1", prefix: "Dr.", first: "Sean", last: "Marlowe", dept: "English", title: "English Department Chair" },
  { id: "t2", prefix: "Mr.", first: "Brad", last: "Holloway", dept: "History", title: "History Teacher" },
  { id: "t3", prefix: "Mr.", first: "Jeffrey", last: "Whitcomb", dept: "Mathematics", title: "Mathematics Teacher, Advisor" },
  { id: "t4", prefix: "Mrs.", first: "Yun", last: "Liang", dept: "World Languages", title: "Chinese Teacher" },
  { id: "t5", prefix: "Mrs.", first: "Kirsten", last: "Hale", dept: "Science", title: "Biology Teacher" },
  { id: "t6", prefix: "Ms.", first: "Sarah", last: "Jarvis", dept: "Humanities", title: "Roundtable Coordinator" },
  { id: "t7", prefix: "Mr.", first: "Daniel", last: "Urbano", dept: "Fine Arts", title: "Director of Orchestra" },
  { id: "t8", prefix: "Ms.", first: "Paula", last: "Tobin", dept: "Library", title: "Upper School Librarian" },
].map((t) => ({ ...t, email: `${t.first.charAt(0).toLowerCase()}${t.last.toLowerCase()}@cedarridge.edu` }));

export const teacher = (id: string) => TEACHERS.find((t) => t.id === id)!;
export const teacherShort = (id: string) => { const t = teacher(id); return `${t.prefix} ${t.last}`; };
export const teacherFull = (id: string) => { const t = teacher(id); return `${t.prefix} ${t.first} ${t.last}`; };

// days: 1=Mon..5=Fri
export const COURSES: Course[] = [
  { id: "101-1", code: "101-1", name: "Honors English: Core 1", section: "1", teacherId: "t1", block: "US Block E", room: "U112", letter: "A-", pct: 91.77, type: "ACADEMIC", days: [2, 3, 5], time: "1:40 pm" },
  { id: "122-1", code: "122-1", name: "Honors World History 9", section: "1", teacherId: "t2", block: "US Block F", room: "U204", letter: "A", pct: 94.69, type: "ACADEMIC", days: [2, 4, 5], time: "9:10 am" },
  { id: "143-1", code: "143-1", name: "Honors Integrated Mathematics 1", section: "1", teacherId: "t3", block: "US Block C", room: "U206", letter: "B", pct: 84.95, type: "ACADEMIC", days: [1, 3, 4], time: "10:35 am" },
  { id: "191-1", code: "191-1", name: "Chinese 3", section: "1", teacherId: "t4", block: "US Block D", room: "U216", letter: "A", pct: 95.48, type: "ACADEMIC", days: [1, 3, 5], time: "1:40 pm" },
  { id: "210-1", code: "210-1", name: "Honors Biology", section: "1", teacherId: "t5", block: "US Block G", room: "S101", letter: "A-", pct: 90.12, type: "ACADEMIC", days: [2, 4], time: "8:00 am" },
  { id: "93-1", code: "93-1", name: "Roundtable - 9", section: "2", teacherId: "t6", block: "US Roundtable", room: "U118", letter: "P", pct: 100, type: "ACADEMIC", days: [1, 4], time: "11:45 am" },
  { id: "301-1", code: "301-1", name: "Upper School Orchestra", section: "1", teacherId: "t7", block: "US Block A", room: "A107", letter: "A", pct: 98.0, type: "ARTS", days: [1, 3, 5], time: "8:00 am" },
];
// Extra sections taught by the demo teacher (not on the demo student's schedule).
export const FACULTY_SECTIONS: Course[] = [
  { id: "143-2", code: "143-2", name: "Honors Integrated Mathematics 1", section: "2", teacherId: "t3", block: "US Block A", room: "U206", letter: "", pct: 0, type: "ACADEMIC", days: [1, 2, 4, 5], time: "8:00 am" },
  { id: "145-1", code: "145-1", name: "Integrated Mathematics 2", section: "1", teacherId: "t3", block: "US Block B", room: "U206", letter: "", pct: 0, type: "ACADEMIC", days: [1, 3, 5], time: "9:10 am" },
  { id: "148-1", code: "148-1", name: "AP Statistics", section: "1", teacherId: "t3", block: "US Block G", room: "U210", letter: "", pct: 0, type: "ACADEMIC", days: [2, 3, 4], time: "2:45 pm" },
  { id: "ADV-W", code: "ADV-W", name: "US Advisory - Whitcomb", section: "1", teacherId: "t3", block: "Community Time", room: "U206", letter: "", pct: 0, type: "ADVISORY", days: [1, 2, 3, 4, 5], time: "10:15 am" },
];
export const ALL_SECTIONS: Course[] = [...COURSES, ...FACULTY_SECTIONS];
export const section = (id: string) => ALL_SECTIONS.find((c) => c.id === id);
export const sectionsFor = (teacherId: string) => ALL_SECTIONS.filter((c) => c.teacherId === teacherId);
export const course = (id: string) => ALL_SECTIONS.find((c) => c.id === id)!;
export const courseTitle = (c: Course) => `${c.name} - ${c.section}`;

export const ME = { first: "Jack", last: "Ingle", email: "jingle@cedarridge.edu", grade: 9, advisorId: "t3" };

export type Category = "HOMEWORK" | "QUIZ" | "TEST" | "COLLABORATION" | "CLASSWORK/HOMEWORK" | "VOCABULARY" | "WRITING" | "READING";
export type Assignment = { id: string; courseId: string; category: Category; title: string; due: Date; assigned: Date; short: string; points: number; notes: string; score?: number | undefined; custom?: boolean };

const PLAN: Record<string, { cat: Category; title: string; short: string }[]> = {
  "101-1": [{ cat: "VOCABULARY", title: "Vocabulary Unit 6", short: "Vocab" }, { cat: "CLASSWORK/HOMEWORK", title: "Annotate \"Story of Your Life\"", short: "CwHw" }, { cat: "WRITING", title: "Personal Narrative Draft", short: "Wr" }],
  "122-1": [{ cat: "QUIZ", title: "Han Dynasty Quiz", short: "QZ" }, { cat: "READING", title: "Read Chapter 7: Han Dynasty China", short: "Rd" }, { cat: "QUIZ", title: "Silk Road Map Quiz", short: "QZ" }],
  "143-1": [{ cat: "HOMEWORK", title: "Unit 11 #5", short: "HW" }, { cat: "TEST", title: "Unit 11 Test", short: "Test" }],
  "191-1": [{ cat: "HOMEWORK", title: "作业", short: "HW" }],
  "210-1": [{ cat: "COLLABORATION", title: "Cell Membrane Lab Group Work", short: "Col" }],
  "93-1": [{ cat: "CLASSWORK/HOMEWORK", title: "Socratic Seminar Prep", short: "CL" }],
};

export const today = () => startOfDay(new Date());

// Deterministic assignments spanning ±4 weeks around today.
export function buildAssignments(): Assignment[] {
  const out: Assignment[] = [];
  const start = addDays(today(), -28);
  const MATH = PLAN["143-1"]!;
  for (let i = 0; i < 56; i++) {
    const d = addDays(start, i);
    if (isWeekend(d)) continue;
    const dow = d.getDay();
    ALL_SECTIONS.forEach((c, ci) => {
      const plan = PLAN[c.id] ?? (c.teacherId === "t3" && c.type !== "ADVISORY" ? MATH : undefined);
      if (!plan || !c.days.includes(dow)) return;
      if ((i + ci) % 2 !== 0) return;
      const p = plan[(i + ci) % plan.length]!;
      const id = `${c.id}-${format(d, "yyyyMMdd")}`;
      const past = d < today();
      out.push({ id, courseId: c.id, category: p.cat, title: p.title, short: p.short, due: d, assigned: addDays(d, -4), notes: NOTES[p.cat], points: p.cat === "TEST" ? 100 : p.cat === "QUIZ" ? 20 : 10,
        score: past ? Math.round((p.cat === "TEST" ? 100 : p.cat === "QUIZ" ? 20 : 10) * (0.78 + ((i * 7 + ci * 3) % 22) / 100)) : undefined });
    });
  }
  return out;
}
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
  const rot = COURSES.filter((c) => c.days.includes(dow) && c.type !== "ADVISORY");
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
export function events(): SchoolEvent[] {
  const t = today();
  const sat = addDays(t, (6 - t.getDay() + 7) % 7);
  const sun = addDays(sat, 1);
  return [
    { date: sun, title: "Open House and Showcase" },
    { date: sun, title: "3:30-5pm - Family Skate", time: "3:30p" },
    { date: addDays(sun, 4), title: "Fall Play: Our Town", time: "7:00p" },
    { date: addDays(sun, 10), title: "Thanksgiving Break - No Classes" },
    { date: addDays(sun, 11), title: "Thanksgiving Break - No Classes" },
    { date: addDays(sun, -6), title: "Varsity Hockey vs. Brookfield", time: "6:00p" },
    { date: addDays(sun, 2), title: "Upper School Assembly", time: "10:15a" },
  ];
}

// Fictional student roster
const FIRST = ["Reigan","Logan","Maya","Elijah","Priya","Owen","Sofia","Marcus","Hannah","Theo","Amara","Caleb","Lena","Isaac","Nora","Julian","Zoe","Andre","Clara","Felix","Ivy","Mateo","Ruby","Samir"];
const LAST = ["Abbott","Ancona","Bishop","Castellano","Delgado","Ellison","Farrow","Greer","Hartley","Iverson","Kaminski","Lowell","Mercer","Nakamura","Okafor","Pruitt","Quintero","Rasmussen","Sterling","Thorne","Vance","Whitaker","Yoshida","Zielinski"];
const STREETS = ["Trailwood Lane","Hillcrest Avenue","Maple Ridge Drive","Lakeshore Road","Cedar Bend Court","Kensington Way"];
const TOWNS = ["Warren, MI 48092","Grosse Pointe Farms, MI 48236","Birmingham, MI 48009","Royal Oak, MI 48067","Troy, MI 48084"];
const PARENT_F = ["David","Christopher","Michael","Anthony","Robert","James"];
const PARENT_M = ["Tamika","Jeannette","Laura","Angela","Monica","Rachel"];
const ph = (n: number) => `${["313","586","248"][n % 3]}-${String(200 + (n * 37) % 799).padStart(3, "0")}-${String(1000 + (n * 431) % 8999)}`;

export const STUDENTS: Student[] = Array.from({ length: 96 }, (_, i) => {
  const first = FIRST[i % FIRST.length]!; const last = LAST[(i * 7 + Math.floor(i / 24) * 5) % LAST.length]!;
  const pf = PARENT_F[i % 6]!, pm = PARENT_M[(i + 2) % 6]!;
  return {
    id: `s${i + 1}`, first, last, grade: 9 + (i % 4),
    address: `${100 + ((i * 97) % 9800)} ${STREETS[i % STREETS.length]}, ${TOWNS[i % TOWNS.length]}`,
    homePhone: ph(i),
    parents: [
      { name: `${pf} ${last}`, mobile: ph(i + 11), email: `${pf.toLowerCase()}.${last.toLowerCase()}@example.com` },
      { name: `${pm} ${last}`, mobile: ph(i + 23), email: `${pm.toLowerCase()}${last.charAt(0).toLowerCase()}@example.com` },
    ],
  };
}).sort((a, b) => a.last.localeCompare(b.last));
export const studentEmail = (s: Student) => `${s.first.toLowerCase()}${s.last.toLowerCase()}@cedarridge.edu`;

// class rosters: deterministic subset of grade-9 students
export const rosterFor = (courseId: string) => {
  const seed = courseId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return STUDENTS.filter((s, i) => s.grade === 9 && (i + seed) % 2 === 0).slice(0, 14);
};

export type Message = { id: string; from: string; list: string; subject: string; body: string; date: Date; email?: string };
export const MESSAGES: Message[] = [
  { id: "m1", from: "Paula Tobin", list: "Group Distribution List", subject: "Re: Lost & Found and other items in the hallway", body: "Hi all,\n\nA reminder that unclaimed items in the Upper School hallway will be donated on Friday. Please check the tables outside the library.\n\nThank you,", date: addDays(today(), -1), email: "ptobin@cedarridge.edu" },
  { id: "m2", from: "Paula Tobin", list: "Group Distribution List", subject: "Lost & Found and other items in the hallway", body: "Hi all,\n\nThe Lost & Found bins are overflowing! Water bottles, sweatshirts and calculators are waiting for you outside the library.\n\nThank you,", date: addDays(today(), -2), email: "ptobin@cedarridge.edu" },
  { id: "m3", from: SCHOOL.name, list: "Group Distribution List", subject: "Last Chance! Fall Raffle Drawing Today at 2 p.m.", body: "The Fall Raffle drawing is today at 2 p.m. in the Commons. Tickets are available at the front office until 1:30 p.m.", date: addDays(today(), -2) },
  { id: "m4", from: SCHOOL.name, list: "Group Distribution List", subject: "Tomorrow Is the Last Day! Get Your Fall Raffle Tickets", body: "Tomorrow is the last day to purchase Fall Raffle tickets. All proceeds support the Cedar Ridge scholarship fund.", date: addDays(today(), -3) },
  { id: "m5", from: SCHOOL.name, list: "Cedar Ridge Life", subject: "Ridge Life: Stories from Across the CRA Community", body: "This week: the robotics team heads to states, the Fall Play opens, and a look inside the new science wing.", date: addDays(today(), -4) },
  { id: "m6", from: "Yun Liang", list: "Group Distribution List", subject: "Trip Deposit and Registration Reminder", body: "Hi all,\n\nPlease remember the spring trip deposit and registration form are due next Friday.\n\nBest,", date: addDays(today(), -4), email: "yliang@cedarridge.edu" },
  { id: "m7", from: "Jeffrey Whitcomb", list: "Group Distribution List", subject: "Homework", body: "Hi all,\n\nThanks for your hard work so far this year. As a reward, no homework tonight - take the time to catch up on other stuff. We will begin regular homework for Unit 12 tomorrow.\nBest,", date: addDays(today(), -11), email: "jwhitcomb@cedarridge.edu" },
];

export const RESOURCE_TILES = [
  "2026-27 Major Calendar Dates", "Lunch Menu", "School Calendar Subscriptions", "2026-27 Curriculum Guide",
  "Family Handbook", "Library Login", "Logo Store", "Logo Store Fan Apparel",
  "Athletics Schedules", "Counseling Office", "Technology Help Desk", "Health & Wellness Forms",
];

export type DayEvent = { time: string; ampm: string; kind: string; title: string };
export const TODAY_EVENTS: DayEvent[] = [
  { time: "8:00", ampm: "AM", kind: "ASSEMBLY", title: "Upper School Assembly" },
  { time: "8:30", ampm: "AM", kind: "ADMISSIONS VISIT", title: "Friday Student Tour and Interview" },
  { time: "12:15", ampm: "PM", kind: "MEETING", title: "Mathematics Department Meeting" },
  { time: "3:30", ampm: "PM", kind: "ATHLETICS", title: "Varsity Soccer vs. Brookfield" },
];
export const NEWS = [
  { title: "Fall Play: Our Town opens Thursday", body: "Join us in the Black Box Theater at 7:00 pm. Faculty receive two complimentary tickets.", date: addDays(today(), -1) },
  { title: "Grades due for Mid-Semester 1", body: "Please enter grades and comments for all sections by Friday at 5:00 pm.", date: addDays(today(), -3) },
  { title: "Professional Development Day", body: "No classes for students. Faculty sessions begin at 8:30 am in the Commons.", date: addDays(today(), -6) },
];
export const TEACHER_TIP = "Use the Notifications tab to let families know when a student misses an assignment — it takes seconds and keeps everyone in the loop.";

export const SEED_USERS = [
  { id: "u-admin", email: "administrator@ulls.org", password: "administrator@ulls.org", role: "admin" as const, first: "Avery", last: "Grant", personId: "", active: true },
  { id: "u-teacher", email: "teacher@ulls.org", password: "teacher@ulls.org", role: "teacher" as const, first: "Jeffrey", last: "Whitcomb", personId: "t3", active: true },
  { id: "u-student", email: "student@ulls.org", password: "student@ulls.org", role: "student" as const, first: "Jack", last: "Ingle", personId: "me", active: true },
];

export const RESOURCES = [
  { group: "Academics", items: ["Upper School Course Catalog", "Academic Honesty Policy", "Writing Center Sign-up", "Math Lab Hours"] },
  { group: "Student Life", items: ["Student Handbook", "Club & Activities List", "Dress Code", "Lunch Menu"] },
  { group: "Technology", items: ["Password Reset", "Device Policy", "Printing Help", "Library Databases"] },
];

export const fmtDay = (d: Date) => format(d, "EEE - MMM d").toUpperCase();
