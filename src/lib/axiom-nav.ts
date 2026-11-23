// Axiom Launchpad rules: what the search bar finds, which keys do what, and how history entries are tagged.
import { pageHits } from "./admin-homepages";

export type Dest = { to: string; params?: Record<string, string>; search?: Record<string, string> } | { action: "new-course" | "new-class" | "new-person" };
/** Each kind of search result has its own icon in Axiom's suggestion list. */
export type HitKind = "Homepage" | "Find" | "Add" | "Report" | "Configuration" | "Person" | "Class" | "Course";
export type NavHit = { kind: HitKind; label: string; hint: string; dest: Dest };

type Person = { first: string; last: string; email: string; role: string; grade?: number | undefined; preferred?: string | undefined; active: boolean };
const ROLE = { admin: "Administrator", teacher: "Faculty", student: "Student" } as Record<string, string>;
const LINK_KIND = { find: "Find", add: "Add", report: "Report", config: "Configuration" } as const;
const LINK_HINT = { Find: "Find query", Add: "Add record", Report: "Report", Configuration: "Configuration" } as const;

/** The suggestions under the Launchpad search bar: homepages and their links first, then people, classes and courses. */
export function searchAxiom(term: string, data: { users: Person[]; sections: { id: string; code: string; name: string; courseNo: string }[]; courses: { id: string; name: string; dept: string }[] }): NavHit[] {
  const t = term.trim().toLowerCase();
  if (t.length < 2) return [];
  const pages: NavHit[] = pageHits(t).map((p) => {
    if (p.kind === "Homepage") return { kind: "Homepage", label: p.label, hint: "Homepage", dest: "homepage" in p.hit ? { to: "/admin/home/$pageId", params: { pageId: p.hit.homepage } } : { to: "/admin" } };
    const kind = LINK_KIND[p.link ?? "config"];
    const h = p.hit;
    return { kind, label: p.label, hint: LINK_HINT[kind], dest: "action" in h ? { action: h.action } : "to" in h ? { to: h.to, ...(h.search ? { search: h.search } : {}) } : { to: "/admin" } };
  });
  const people: NavHit[] = data.users.filter((u) => `${u.first} ${u.last} ${u.preferred ?? ""} ${u.email}`.toLowerCase().includes(t)).slice(0, 5)
    .map((u) => ({ kind: "Person", label: `${u.last}, ${u.preferred || u.first}`, hint: `${ROLE[u.role] ?? u.role}${u.role === "student" ? ` (${u.grade ?? 9})` : ""}${u.active ? "" : " · Inactive"}`, dest: { to: "/admin/users", search: { q: u.email } } }));
  const classes: NavHit[] = data.sections.filter((c) => `${c.code} ${c.name} ${c.id}`.toLowerCase().includes(t)).slice(0, 5).map((c) => ({ kind: "Class", label: `${c.code}: ${c.name}`, hint: "Class", dest: { to: "/admin/courses/$courseId", params: { courseId: c.id } } }));
  const courses: NavHit[] = data.courses.filter((c) => `${c.id} ${c.name}`.toLowerCase().includes(t)).slice(0, 4).map((c) => ({ kind: "Course", label: `${c.name} (${c.id})`, hint: c.dept ? `Course · ${c.dept}` : "Course", dest: { to: "/admin/course/$courseNo", params: { courseNo: c.id } } }));
  return [...pages, ...people, ...classes, ...courses];
}

export type Shortcut = "rocket" | "favorites" | "search" | "save";
/** Veracross keys: ` opens the homepage list (Rocket Ship), ~ (Shift + `) opens Favorites, / opens search, Ctrl or Cmd + S saves a detail screen. */
export function shortcutFor(e: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }, typing: boolean): Shortcut | null {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "s") return "save";
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return null;
  return e.key === "`" ? "rocket" : e.key === "~" ? "favorites" : e.key === "/" ? "search" : null;
}
export const SHORTCUTS: { keys: string; does: string }[] = [
  { keys: "`", does: "Open the Homepage list (Rocket Ship)" }, { keys: "~  (Shift + `)", does: "Open Favorites" }, { keys: "/", does: "Search" },
  { keys: "Ctrl or ⌘ + S", does: "Save the record you are on (Update)" }, { keys: "Esc", does: "Close the open Launchpad panel" },
];

export type HistoryTag = "Homepage" | "Workspace" | "Query" | "Record" | "Page";
/** History lists the latest screens, each tagged by its function so it can be scanned quickly. */
export function historyTag(path: string): HistoryTag {
  const p = path.split("?")[0] ?? path;
  if (p === "/admin" || p === "/admin/" || p.startsWith("/admin/home/")) return "Homepage";
  if (p.startsWith("/admin/workspaces")) return "Workspace";
  if (p.startsWith("/admin/queries")) return "Query";
  if (/^\/admin\/(courses|course|enrollment|portals)\/./.test(p) || /[?&]q=/.test(path)) return "Record";
  return "Page";
}
export const isHomepagePath = (path: string) => historyTag(path) === "Homepage";
