// Demo app state shared by every portal (accounts, session, portal settings, teacher edits).
// Browser-local only: a stand-in until the school moves to Lovable Cloud accounts.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { canImpersonate, findLogin, type User } from "./auth-rules";
import { ALL_ASSIGNMENTS, ALL_SECTIONS, EXTRA, MESSAGES, SEED_USERS, studentById, teacherRoster, today, type Assignment, type Category, type Course, type Student } from "./sis-data";
import { classStatus, makeYear, yearStartFor, type ClassStatus } from "./terms";
import { scoreOf } from "./gradebook";
import { defaultWeights, weightedAverage } from "./grading";
import campus from "@/assets/campus-bg.jpg";
import blossoms from "@/assets/faculty-bg.jpg";
import graduation from "@/assets/portal-bg.jpg";
import painting from "@/assets/class-bg.jpg";
import { readSchool, saveSchool } from "./browser-save";
import { toast } from "sonner";

export const BACKGROUNDS: { key: string; label: string; src: string }[] = [
  { key: "graduation", label: "Graduation", src: graduation },
  { key: "campus", label: "Clock Tower", src: campus },
  { key: "blossoms", label: "Spring Campus", src: blossoms },
  { key: "painting", label: "Painting", src: painting },
];
/** Resolve a background setting: preset key, custom https URL, or "none". */
export const bgSrc = (v: string) => (v === "none" ? null : BACKGROUNDS.find((b) => b.key === v)?.src ?? (/^(https?:\/\/|data:image\/)/.test(v) ? v : null));

/** Class website look, set by the class's teacher: blank, a solid color, or an uploaded (cropped) photo. */
export type Website = { bg: "none" | "color" | "photo"; color: string; photo: string; sections: { title: string; body: string }[]; pages: string[]; pageContent?: Record<string, { body: string; published: boolean }>; barColor?: string; linkColor?: string };
export const BLANK_SITE: Website = { bg: "none", color: "#3a6ea5", photo: "", sections: [], pages: [] };
/** A course is the catalog entry; a section (class) is one scheduled offering of it in specific terms. */
export type CourseDef = { id: string; name: string; type: Course["type"]; dept: string; credits: number; description: string };
export type Section = Course & { courseNo: string; teacherIds: string[]; terms: string[]; published: boolean; studentIds: string[]; website: Website };

const Y = String(yearStartFor(new Date()));
const FY = [`${Y}-S1`, `${Y}-S2`];
const SEED_COURSES: CourseDef[] = [...new Map(ALL_SECTIONS.map((c) => [c.id.split("-")[0]!, { id: c.id.split("-")[0]!, name: c.name, type: c.type, dept: "", credits: c.type === "ADVISORY" ? 0 : 1, description: "" }])).values()];
const SEED_SECTIONS: Section[] = ALL_SECTIONS.map((c) => ({
  ...c, courseNo: c.id.split("-")[0]!, teacherIds: [c.teacherId], published: true,
  terms: c.id === "210-1" ? [`${Y}-S2`] : FY, // Honors Biology starts next semester (shows under Future)
  studentIds: teacherRoster(c.id).map((s) => s.id),
  website: c.id === "122-1" ? { ...BLANK_SITE, bg: "photo", photo: painting, sections: [{ title: "Course Description", body: "This course studies the global processes and interactions that have shaped our world, using primary and secondary sources." }], pages: ["Reading Resources"] } : { ...BLANK_SITE },
}));
export const yearLabel = (id: string) => makeYear(Number(id)).label;

export type PortalTheme = { bg: string; topbar: string; navbar: string; blur: boolean };
export type Settings = { student: PortalTheme; teacher: PortalTheme; login: { bg: string; message: string } };
export const DEFAULT_SETTINGS: Settings = {
  student: { bg: "none", topbar: "", navbar: "", blur: false },
  teacher: { bg: "none", topbar: "", navbar: "", blur: false },
  login: { bg: "none", message: "Please log in using your Cedar Ridge username and password." },
};

export type CustomAssignment = {
  id: string; courseId: string; title: string; category: Category; assigned: string; due: string; points: number;
  details: string; notes: string; published: boolean; inCalc: boolean; extraCredit: boolean; allSections: boolean; method: string;
};
export type SentMessage = { id: string; from: string; list: string; subject: string; body: string; date: string; audience: "students" | "faculty" | "everyone" };
export type Purchase = { id: string; item: string; vendor: string; amount: number; reason: string; status: "Pending" | "Approved" | "Denied"; date: string; by: string };
export type { Weight } from "./grading";
import type { Weight } from "./grading";

type State = {
  users: User[]; sessionId: string | null; settings: Settings;
  custom: CustomAssignment[];
  scores: Record<string, string>; aStatus: Record<string, string>; pub: Record<string, boolean>;
  attendance: Record<string, string>; attNotes: Record<string, string>; attDone: string[];
  comments: Record<string, string>; termGrades: Record<string, string>;
  weights: Record<string, Weight[]>; sent: SentMessage[]; purchases: Purchase[];
  courseFlags: Record<string, Record<string, boolean>>;
  courses: CourseDef[]; sections: Section[]; photos: Record<string, string>;
  sampleCleared?: boolean;
  impersonatorId?: string | null;
};
const INITIAL: State = {
  users: SEED_USERS.map((u) => ({ ...u })), sessionId: null, settings: DEFAULT_SETTINGS, custom: [],
  scores: {}, aStatus: {}, pub: {}, attendance: {}, attNotes: {}, attDone: [], comments: {}, termGrades: {},
  weights: {}, sent: [], purchases: [], courseFlags: {}, courses: SEED_COURSES, sections: SEED_SECTIONS, photos: {},
};
const KEY = "cra-school-v2";

type Ctx = State & {
  ready: boolean; user: User | null;
  update: (fn: (s: State) => State) => void;
  login: (username: string, password: string) => User | null;
  logout: () => void;
  impersonate: (id: string) => boolean;
  stopImpersonating: () => void;
};
const C = createContext<Ctx | null>(null);

export function SchoolStoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(INITIAL);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
    try {
      const v = JSON.parse(await readSchool() || "{}") as Partial<State>;
      if (cancelled) return;
      if (!v.sampleCleared) {
        const sampleIds = new Set(["101-1", "122-1", "143-1", "191-1", "210-1", "93-1", "301-1", "143-2", "145-1", "148-1", "ADV-W"]);
        v.sections = (v.sections ?? []).filter((c) => !sampleIds.has(c.id));
        v.courses = (v.courses ?? []).filter((c) => !["101", "122", "143", "191", "210", "93", "301", "145", "148", "ADV"].includes(c.id));
        v.users = (v.users ?? INITIAL.users).map((u) => u.id === "u-teacher" && u.personId === "t3" ? { ...u, personId: "p-teacher", first: "Faculty", last: "Account" } : u.id === "u-student" && u.personId === "me" ? { ...u, personId: "p-student", first: "Student", last: "Account" } : u);
        v.sampleCleared = true;
      }
      const users = v.users?.length ? v.users : INITIAL.users;
      const st = { ...DEFAULT_SETTINGS, ...v.settings };
      setS({ ...INITIAL, ...v, users, settings: { student: { ...DEFAULT_SETTINGS.student, ...st.student }, teacher: { ...DEFAULT_SETTINGS.teacher, ...st.teacher }, login: { ...DEFAULT_SETTINGS.login, ...st.login } } });
    } catch { /* corrupt storage: start fresh */ }
    if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { if (ready) void saveSchool(JSON.stringify(s)).catch(() => toast.error("Changes could not be saved. Please allow browser storage and try again.")); }, [s, ready]);
  const update = useCallback((fn: (s: State) => State) => setS(fn), []);
  // Admin-created people become lookup-able by every page (directories, rosters, teacher cards).
  useMemo(() => {
    EXTRA.teachers = s.users.filter((u) => u.role === "teacher" && u.personId).map((u) => ({ id: u.personId, prefix: u.prefix ?? "", first: u.preferred || u.first, last: u.last, email: u.email, dept: "", title: "Faculty" }));
    EXTRA.students = s.users.filter((u) => u.role === "student" && u.personId).map((u) => ({ id: u.personId, first: u.preferred || u.first, last: u.last, grade: u.grade ?? 9, address: [u.address, u.city, u.state, u.postal].filter(Boolean).join(", "), homePhone: u.phone ?? "", parents: [] }));
  }, [s.users]);
  const value = useMemo<Ctx>(() => ({
    ...s, ready, update,
    user: s.users.find((u) => u.id === s.sessionId && u.active) ?? null,
    login: (username, password) => { const u = findLogin(s.users, username, password); if (u) setS((x) => ({ ...x, sessionId: u.id })); return u; },
    logout: () => setS((x) => ({ ...x, sessionId: null, impersonatorId: null })),
    impersonate: (id) => {
      const actor = s.users.find((u) => u.id === s.sessionId) ?? null;
      const target = s.users.find((u) => u.id === id);
      if (!target || !canImpersonate(actor, target)) return false;
      setS((x) => ({ ...x, impersonatorId: actor?.id, sessionId: id })); return true;
    },
    stopImpersonating: () => setS((x) => ({ ...x, sessionId: x.impersonatorId ?? x.sessionId, impersonatorId: null })),
  }), [s, ready, update]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useSchool() { const c = useContext(C); if (!c) throw new Error("SchoolStoreProvider missing"); return c; }

const short: Record<string, string> = { HOMEWORK: "HW", QUIZ: "QZ", TEST: "Test", COLLABORATION: "Col", "CLASSWORK/HOMEWORK": "CwHw", VOCABULARY: "Vocab", WRITING: "Wr", READING: "Rd" };
export function toAssignment(c: CustomAssignment, base?: Assignment): Assignment {
  return { score: base?.score, id: c.id, courseId: c.courseId, category: c.category, title: c.title, short: short[c.category] ?? "HW", due: parseISO(c.due), assigned: parseISO(c.assigned), points: c.points, notes: c.notes || c.details, custom: true };
}
/** Classes the signed-in person sees: published ones they teach or are enrolled in (admins see all). */
export function useMySections(): (Section & { status: ClassStatus })[] {
  const { sections, user } = useSchool();
  return useMemo(() => {
    const pid = user?.personId ?? "";
    return sections
      .filter((c) => user?.role === "admin" || (c.published && (user?.role === "teacher" ? c.teacherIds.includes(pid) : c.studentIds.includes(pid))))
      .map((c) => ({ ...c, status: classStatus(c.terms, today()) }));
  }, [sections, user]);
}
export function useSection(id: string): Section | undefined { const { sections } = useSchool(); return sections.find((c) => c.id === id); }
export const rosterOf = (c: Section | undefined): Student[] => (c ? c.studentIds.map(studentById).filter((x): x is Student => !!x).sort((a, b) => a.last.localeCompare(b.last)) : []);

/** Student view: assignments in the student's published classes; teacher-made ones only when "Display on portals" is on. */
export function useStudentAssignments(): Assignment[] {
  const { custom, scores, pub, user } = useSchool();
  const mine = useMySections();
  return useMemo(() => {
    const sid = user?.personId || "me";
    const ids = new Set(mine.map((c) => c.id));
    const byId = new Map(custom.map((c) => [c.id, c]));
    const base = ALL_ASSIGNMENTS.filter((a) => ids.has(a.courseId) && !byId.has(a.id));
    const own = custom.filter((c) => c.published && ids.has(c.courseId)).map((c) => toAssignment(c, ALL_ASSIGNMENTS.find((a) => a.id === c.id)));
    // A score shows up only while the teacher keeps "publish to portal" on.
    return [...base, ...own].map((a) => (pub[`${a.id}|${sid}`] === false ? { ...a, score: undefined } : { ...a, score: scoreOf(scores, a, sid) }));
  }, [custom, scores, pub, user, mine]);
}
/** The signed-in student's running average in one class (weighted by the teacher's category weights). */
export function useClassAverage(courseId: string): number | null {
  const all = useStudentAssignments();
  const { weights } = useSchool();
  return useMemo(() => {
    const list = all.filter((a) => a.courseId === courseId);
    return weightedAverage(list, weights[courseId] ?? defaultWeights(list.map((a) => a.category)));
  }, [all, weights, courseId]);
}
/** Teacher view: every assignment for one section, newest last. */
export function useSectionAssignments(courseId: string): Assignment[] {
  const { custom } = useSchool();
  return useMemo(() => {
    const byId = new Map(custom.map((c) => [c.id, c]));
    const base = ALL_ASSIGNMENTS.filter((a) => a.courseId === courseId);
    const own = custom.filter((c) => c.courseId === courseId).map((c) => toAssignment(c, base.find((a) => a.id === c.id)));
    return [...base.filter((a) => !byId.has(a.id)), ...own].sort((a, b) => +a.due - +b.due);
  }, [custom, courseId]);
}
export const isoDay = (d: Date) => format(d, "yyyy-MM-dd");

/** Inbox for the signed-in person: school messages plus admin announcements sent to their audience. */
export function useInbox() {
  const { sent, user } = useSchool();
  return useMemo(() => {
    const aud = user?.role === "student" ? "students" : "faculty";
    const extra = sent.filter((m) => m.audience === "everyone" || m.audience === aud).map((m) => ({ id: m.id, from: m.from, list: m.list, subject: m.subject, body: m.body, date: parseISO(m.date) }));
    return [...extra, ...MESSAGES].sort((a, b) => +b.date - +a.date);
  }, [sent, user]);
}
