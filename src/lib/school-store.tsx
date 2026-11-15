// Demo app state shared by every portal (accounts, session, portal settings, teacher edits).
// Browser-local only: a stand-in until the school moves to Lovable Cloud accounts.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { findLogin, type User } from "./auth-rules";
import { ALL_ASSIGNMENTS, ASSIGNMENTS, COURSES, MESSAGES, SEED_USERS, type Assignment, type Category } from "./sis-data";
import campus from "@/assets/campus-bg.jpg";
import blossoms from "@/assets/faculty-bg.jpg";
import graduation from "@/assets/portal-bg.jpg";
import painting from "@/assets/class-bg.jpg";

export const BACKGROUNDS: { key: string; label: string; src: string }[] = [
  { key: "graduation", label: "Graduation", src: graduation },
  { key: "campus", label: "Clock Tower", src: campus },
  { key: "blossoms", label: "Spring Campus", src: blossoms },
  { key: "painting", label: "Painting", src: painting },
];
/** Resolve a background setting: preset key, custom https URL, or "none". */
export const bgSrc = (v: string) => (v === "none" ? null : BACKGROUNDS.find((b) => b.key === v)?.src ?? (/^https?:\/\//.test(v) ? v : null));

export type PortalTheme = { bg: string; topbar: string; navbar: string; blur: boolean };
export type Settings = { student: PortalTheme; teacher: PortalTheme; classSite: { bg: string }; login: { bg: string; message: string } };
export const DEFAULT_SETTINGS: Settings = {
  student: { bg: "graduation", topbar: "", navbar: "", blur: true },
  teacher: { bg: "blossoms", topbar: "", navbar: "", blur: false },
  classSite: { bg: "painting" },
  login: { bg: "campus", message: "Please log in using your Cedar Ridge username and password." },
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
};
const INITIAL: State = {
  users: SEED_USERS.map((u) => ({ ...u })), sessionId: null, settings: DEFAULT_SETTINGS, custom: [],
  scores: {}, aStatus: {}, pub: {}, attendance: {}, attNotes: {}, attDone: [], comments: {}, termGrades: {},
  weights: {}, sent: [], purchases: [], courseFlags: {},
};
const KEY = "cra-school-v1";

type Ctx = State & {
  ready: boolean; user: User | null;
  update: (fn: (s: State) => State) => void;
  login: (username: string, password: string) => User | null;
  logout: () => void;
};
const C = createContext<Ctx | null>(null);

export function SchoolStoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(INITIAL);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<State>;
      const users = v.users?.length ? v.users : INITIAL.users;
      const st = { ...DEFAULT_SETTINGS, ...v.settings };
      setS({ ...INITIAL, ...v, users, settings: { student: { ...DEFAULT_SETTINGS.student, ...st.student }, teacher: { ...DEFAULT_SETTINGS.teacher, ...st.teacher }, classSite: { ...DEFAULT_SETTINGS.classSite, ...st.classSite }, login: { ...DEFAULT_SETTINGS.login, ...st.login } } });
    } catch { /* corrupt storage: start fresh */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(s)); }, [s, ready]);
  const update = useCallback((fn: (s: State) => State) => setS(fn), []);
  const value = useMemo<Ctx>(() => ({
    ...s, ready, update,
    user: s.users.find((u) => u.id === s.sessionId && u.active) ?? null,
    login: (username, password) => { const u = findLogin(s.users, username, password); if (u) setS((x) => ({ ...x, sessionId: u.id })); return u; },
    logout: () => setS((x) => ({ ...x, sessionId: null })),
  }), [s, ready, update]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useSchool() { const c = useContext(C); if (!c) throw new Error("SchoolStoreProvider missing"); return c; }

const short: Record<string, string> = { HOMEWORK: "HW", QUIZ: "QZ", TEST: "Test", COLLABORATION: "Col", "CLASSWORK/HOMEWORK": "CwHw", VOCABULARY: "Vocab", WRITING: "Wr", READING: "Rd" };
export function toAssignment(c: CustomAssignment, base?: Assignment): Assignment {
  return { score: base?.score, id: c.id, courseId: c.courseId, category: c.category, title: c.title, short: short[c.category] ?? "HW", due: parseISO(c.due), assigned: parseISO(c.assigned), points: c.points, notes: c.notes || c.details, custom: true };
}
/** Student view: built-in assignments plus teacher-created ones marked "Display on portals". */
export function useStudentAssignments(): Assignment[] {
  const { custom, scores, pub } = useSchool();
  return useMemo(() => {
    const byId = new Map(custom.map((c) => [c.id, c]));
    const base = ASSIGNMENTS.filter((a) => !byId.has(a.id));
    const mine = custom.filter((c) => c.published && COURSES.some((x) => x.id === c.courseId)).map((c) => toAssignment(c, ASSIGNMENTS.find((a) => a.id === c.id)));
    // Teacher-entered scores for the demo student show up only while "publish to portal" is on.
    return [...base, ...mine].map((a) => {
      const k = `${a.id}|me`;
      if (pub[k] === false) return { ...a, score: undefined };
      if (k in scores) { const v = scores[k]; return { ...a, score: v === "" || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v) }; }
      return a;
    });
  }, [custom, scores, pub]);
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
