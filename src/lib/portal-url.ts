// Public addresses and browser-tab titles for the portals (pure, so they can be tested).
//
// Address:  /<school>/<role>/<role>/<page>   e.g. /ulls/student/student/daily-schedule
// Home:     /<school>/<role>                 e.g. /ulls/student
// The app's own routes stay short (/schedule, /student, /admin/courses/...); the router translates both ways.
import { ROLE_LABEL, type Role } from "./auth-rules";

export type PortalIdentity = { abbr: string; role: Role };

const ROLES: string[] = ["admin", "teacher", "student"];
const isRole = (s: string | undefined): s is Role => !!s && ROLES.includes(s);

/** Pages every signed-in person shares are named for people, not files: "/schedule" is "daily-schedule" in the address. */
const SHARED_PUBLIC: Record<string, string> = { schedule: "daily-schedule", class: "class-website" };
const SHARED_INTERNAL: Record<string, string> = Object.fromEntries(Object.entries(SHARED_PUBLIC).map(([internal, pub]) => [pub, internal]));
/** Pages that only exist under /teacher. */
const TEACHER_ONLY = new Set(["class", "news", "purchases"]);
/** First segments the app already uses, so a school abbreviation can never be mistaken for one of them. */
const RESERVED = new Set(["admin", "teacher", "student", "assignments", "attendance", "calendar", "class", "classes", "directories", "grades", "messages", "report-card", "resources", "schedule-report", "schedule", "submit", "updates"]);

/** School abbreviation for addresses: the first part of the account's email domain (student@ulls.org gives "ulls"). */
export function portalAbbr(email: string, fallback: string): string {
  const label = email.split("@")[1]?.split(".")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return label || fallback.toLowerCase();
}

/** App path to public address, or null when the path should stay as it is (login page, signed out, admin on a shared page). */
export function toPublicPath(pathname: string, id: PortalIdentity | null): string | null {
  if (!id) return null;
  const segs = pathname.split("/").filter(Boolean);
  const first = segs[0];
  if (!first) return null;
  let role: Role;
  let page: string[];
  if (isRole(first)) { role = first; page = segs.slice(1); }
  else {
    if (id.role === "admin") return null;
    role = id.role;
    page = [SHARED_PUBLIC[first] ?? first, ...segs.slice(1)];
  }
  return `/${id.abbr}/${role}${page.length ? `/${role}/${page.join("/")}` : ""}`;
}

/** Public address to app path, or null when the address is not in the public form. */
export function toInternalPath(pathname: string): { path: string; identity: PortalIdentity } | null {
  const segs = pathname.split("/").filter(Boolean);
  const [abbr, role, again, ...page] = segs;
  if (!abbr || RESERVED.has(abbr) || !isRole(role)) return null;
  if (segs.length > 2 && again !== role) return null;
  const first = page[0];
  const path = !first ? `/${role}`
    : role === "admin" ? `/admin/${page.join("/")}`
    : role === "teacher" && TEACHER_ONLY.has(first) ? `/teacher/${page.join("/")}`
    : `/${[SHARED_INTERNAL[first] ?? first, ...page.slice(1)].join("/")}`;
  return { path, identity: { abbr, role } };
}

// Who the address is for. The router asks for it every time it builds a link.
let current: PortalIdentity | null = null;
let lastOpened: { path: string; identity: PortalIdentity } | null = null;
/** The signed-in person (set once the school data has loaded). */
export const setPortalIdentity = (v: PortalIdentity | null) => { current = v; };
/** An address in public form was just opened: its school and role are known straight away, before anything loads. */
export function noteAddress(path: string, identity: PortalIdentity) {
  lastOpened = { path, identity };
  if (typeof window !== "undefined") current = identity;
}
/** Who to build the public address for. On the server only the address being served counts; nothing is shared between requests. */
export function identityFor(path: string): PortalIdentity | null {
  if (lastOpened?.path === path) return lastOpened.identity;
  return typeof window === "undefined" ? null : current;
}

/** Id of the class a page is about (class website, gradebook, teacher class page, admin class record), if any. */
export function classIdFromPath(pathname: string): string | null {
  const m = /^\/(?:class|grades|teacher\/class|admin\/courses)\/([^/]+)\/?$/.exec(pathname);
  if (!m) return null;
  try { return decodeURIComponent(m[1]!); } catch { return m[1]!; }
}

const HOMES = new Set(["/admin", "/teacher", "/student"]);
/** "Daily Schedule | Cedar Ridge Academy" and "Axiom · Class 252-3 | Cedar R..." both become the bare page name. */
const pageName = (routeTitle: string) => routeTitle.replace(/^Axiom\s*[·-]\s*/i, "").replace(/\s*\|[^|]*$/, "").trim();

/** Tab title: "<School> - <Role> Portal" on the home page, "<Class or report name> - <Role> Portal" everywhere else. */
export function portalTitle(i: { pathname: string; routeTitle: string; school: string; role: Role; className?: string | undefined }): string {
  const portal = `${ROLE_LABEL[i.role]} Portal`;
  const home = `${i.school} - ${portal}`;
  if (HOMES.has(i.pathname.replace(/\/+$/, ""))) return home;
  const name = i.className || pageName(i.routeTitle);
  return !name || name.toLowerCase().startsWith(i.school.toLowerCase()) ? home : `${name} - ${portal}`;
}
