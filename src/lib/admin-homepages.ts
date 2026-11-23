// Axiom (administrator) homepages. Each homepage is a page of tiles, like Veracross: Link Tiles (Find queries, Add records,
// Reports, Configuration), Counter Tiles (a number that opens its report) and a quick-access bar for Find and Add.
// Links point only at screens that exist in this app; add a link here when a new screen is built.
export type AdminPath =
  | "/admin" | "/admin/queries" | "/admin/users" | "/admin/courses" | "/admin/classes" | "/admin/settings" | "/admin/assignment-types"
  | "/admin/portals" | "/admin/report-layouts" | "/admin/terms" | "/admin/scheduling" | "/admin/student-schedules" | "/admin/workspaces" | "/admin/messages" | "/admin/purchases";

/** Veracross groups homepage links by type: Find queries, Add records, Reports and Configuration. */
export type LinkKind = "find" | "add" | "report" | "config";
export type HomeLink =
  | { label: string; to: AdminPath; search?: Record<string, string>; kind?: LinkKind }
  /** A button that opens a blank record in a new window. */
  | { label: string; action: "new-course" | "new-class" | "new-person"; kind?: LinkKind };
export type HomeGroup = { heading: string; links: HomeLink[] };
/** One tile. `more` is its "consolidated view": set-up links that are not needed all the time (the icon in the tile's corner). */
export type HomeSection = { title: string; groups: HomeGroup[]; more?: HomeLink[] };
export type MetricKey = "accounts" | "students" | "faculty" | "classes" | "courses" | "unpublished" | "unscheduled" | "inactive" | "pendingPurchases";
export type Counter = { label: string; metric: MetricKey; to: AdminPath; search?: Record<string, string> };
export type Homepage = { id: string; title: string; heading: string; group: string; sections: HomeSection[]; counters?: Counter[]; quick?: { find: HomeLink[]; add: HomeLink[] } };

export const SYSTEM_HOME = { title: "System Administrator Homepage", to: "/admin" as const };
/** The major areas of the system; the Rocket Ship lists homepages under these headings. */
export const HOMEPAGE_GROUPS = ["System", "Academics", "People", "Communications & Business", "Portals"] as const;

export const linkKind = (l: HomeLink): LinkKind => l.kind ?? ("action" in l ? "add" : l.to === "/admin/queries" ? "find" : "config");
const link = (label: string, to: AdminPath, search?: Record<string, string>, kind?: LinkKind): HomeLink => ({ label, to, ...(search ? { search } : {}), ...(kind ? { kind } : {}) });
const add = (label: string, action: "new-course" | "new-class" | "new-person"): HomeLink => ({ label, action });
const findClasses = link("Find Classes", "/admin/queries", { source: "classes" });
const findPeople = link("Find People", "/admin/queries", { source: "people" });

/** The Main homepage: where every administrator lands, with the whole system's links. */
export const SYSTEM_PAGE: Homepage = {
  id: "system", title: SYSTEM_HOME.title, heading: "System Administration", group: "System",
  quick: { find: [findPeople, findClasses], add: [add("Add Person", "new-person"), add("Add Course", "new-course"), add("Add Class", "new-class")] },
  counters: [
    { label: "Portal Accounts", metric: "accounts", to: "/admin/users" }, { label: "Students", metric: "students", to: "/admin/users", search: { role: "student" } },
    { label: "Faculty & Staff", metric: "faculty", to: "/admin/users", search: { role: "teacher" } }, { label: "Class Sections", metric: "classes", to: "/admin/classes" },
    { label: "Pending Purchase Requests", metric: "pendingPurchases", to: "/admin/purchases" }, { label: "Inactive Accounts", metric: "inactive", to: "/admin/queries", search: { source: "people", status: "inactive" } },
    { label: "Unpublished Classes", metric: "unpublished", to: "/admin/queries", search: { source: "classes", status: "draft" } },
  ],
  sections: [
    { title: "Users & Security", groups: [{ heading: "Find", links: [link("Users", "/admin/users"), findPeople] }] },
    { title: "Scheduling", groups: [{ heading: "Reports", links: [link("Student Schedules", "/admin/student-schedules", undefined, "report")] }, { heading: "Configuration", links: [link("School Years & Terms", "/admin/terms"), link("Scheduling Sets", "/admin/scheduling")] }, { heading: "Find", links: [findClasses] }] },
    { title: "Academics", groups: [{ heading: "Configuration", links: [link("Course Setup", "/admin/courses"), link("Classes", "/admin/classes"), link("Assignment Types", "/admin/assignment-types"), link("Report Card Layouts", "/admin/report-layouts")] }] },
    { title: "Portals", groups: [{ heading: "Configuration", links: [link("Portals", "/admin/portals"), link("Portal Settings", "/admin/settings"), link("Backgrounds", "/admin/settings")] }] },
    { title: "Communications & Business", groups: [{ heading: "Messages", links: [link("Send a Message", "/admin/messages")] }, { heading: "Approvals", links: [link("Purchase Approvals", "/admin/purchases")] }] },
    { title: "General", groups: [{ heading: "Your Workspaces", links: [link("Workspaces", "/admin/workspaces")] }], more: [link("Portal Settings", "/admin/settings"), link("School Years & Terms", "/admin/terms")] },
  ],
};

export const HOMEPAGES: Homepage[] = [
  {
    id: "academic-configuration", title: "Academic Configuration", heading: "Academic Foundation", group: "Academics",
    quick: { find: [findClasses], add: [add("Add Course", "new-course"), add("Add Class", "new-class")] },
    counters: [{ label: "Class Sections", metric: "classes", to: "/admin/classes" }, { label: "Courses", metric: "courses", to: "/admin/courses" }, { label: "Unpublished Classes", metric: "unpublished", to: "/admin/queries", search: { source: "classes", status: "draft" } }],
    sections: [
      { title: "1. Academic Hierarchy", groups: [
        { heading: "General", links: [link("School Years & Terms", "/admin/terms")] },
        { heading: "Course Structure", links: [add("Add Course", "new-course"), link("Courses", "/admin/courses"), link("Classes", "/admin/classes")] },
      ] },
      { title: "2. Grading Configuration", groups: [
        { heading: "Assignments", links: [link("Assignment Types", "/admin/assignment-types")] },
        { heading: "Grades & Comments", links: [link("Report Card Layouts", "/admin/report-layouts")] },
      ] },
      { title: "3. Scheduling", groups: [
        { heading: "General", links: [link("School Years & Terms", "/admin/terms")] },
        { heading: "Blocks Configuration", links: [link("Scheduling Sets", "/admin/scheduling")] },
        { heading: "Student Schedules", links: [link("Student Schedules", "/admin/student-schedules", undefined, "report")] },
      ] },
      { title: "4. Classes Setup", groups: [
        { heading: "General", links: [add("Add Class", "new-class"), link("Classes", "/admin/classes"), link("Unpublished Classes", "/admin/queries", { source: "classes", status: "draft" })] },
        { heading: "Course & Class Configuration", links: [link("Courses", "/admin/courses")] },
      ] },
      { title: "5. Academic Documents", groups: [{ heading: "Report Cards", links: [link("Report Card Layouts", "/admin/report-layouts")] }] },
    ],
  },
  {
    id: "scheduling", title: "Scheduling", heading: "Scheduling", group: "Academics",
    quick: { find: [findClasses], add: [add("Add Class", "new-class")] },
    counters: [{ label: "Classes Without a Block", metric: "unscheduled", to: "/admin/queries", search: { source: "classes" } }, { label: "Class Sections", metric: "classes", to: "/admin/classes" }, { label: "Students", metric: "students", to: "/admin/users", search: { role: "student" } }],
    sections: [
      { title: "1. Student Schedules", groups: [{ heading: "Reports", links: [link("Student Schedules", "/admin/student-schedules", undefined, "report")] }, { heading: "Find", links: [findClasses] }] },
      { title: "2. Timetable", groups: [{ heading: "Configuration", links: [link("Scheduling Sets", "/admin/scheduling"), link("School Years & Terms", "/admin/terms")] }] },
      { title: "3. Classes", groups: [{ heading: "Add", links: [add("Add Class", "new-class")] }, { heading: "Configuration", links: [link("Classes", "/admin/classes")] }] },
    ],
  },
  {
    id: "people-records", title: "People & Records", heading: "People and Records", group: "People",
    quick: { find: [findPeople], add: [add("Add Person", "new-person")] },
    counters: [{ label: "Students", metric: "students", to: "/admin/users", search: { role: "student" } }, { label: "Faculty & Staff", metric: "faculty", to: "/admin/users", search: { role: "teacher" } }, { label: "Inactive Accounts", metric: "inactive", to: "/admin/queries", search: { source: "people", status: "inactive" } }],
    sections: [
      { title: "1. People", groups: [
        { heading: "Accounts", links: [link("Users & Security", "/admin/users"), add("Add Person", "new-person")] },
        { heading: "Find", links: [link("Queries & Records", "/admin/queries"), link("Inactive Accounts", "/admin/queries", { source: "people", status: "inactive" })] },
      ] },
    ],
  },
  {
    id: "communications", title: "Communications & Business", heading: "Communications and Business", group: "Communications & Business",
    counters: [{ label: "Pending Purchase Requests", metric: "pendingPurchases", to: "/admin/purchases" }],
    sections: [
      { title: "1. Communications", groups: [{ heading: "Messages", links: [link("Send a Message", "/admin/messages")] }] },
      { title: "2. Business", groups: [{ heading: "Approvals", links: [link("Purchase Approvals", "/admin/purchases")] }] },
    ],
  },
  {
    id: "portals", title: "Portals", heading: "Portals", group: "Portals",
    sections: [{ title: "1. Portal Setup", groups: [{ heading: "Portals", links: [link("Portals", "/admin/portals"), link("Portal Settings", "/admin/settings")] }] }],
  },
];

export const ALL_HOMEPAGES: Homepage[] = [SYSTEM_PAGE, ...HOMEPAGES];
export const homepageById = (id: string) => ALL_HOMEPAGES.find((h) => h.id === id);
/** Homepages under their group headings, in the order the Rocket Ship shows them. */
export const homepagesByGroup = () => HOMEPAGE_GROUPS.map((group) => ({ group, pages: ALL_HOMEPAGES.filter((h) => h.group === group) })).filter((g) => g.pages.length);
export const homepageDest = (h: Homepage) => (h.id === "system" ? ({ to: "/admin" } as const) : ({ to: "/admin/home/$pageId", params: { pageId: h.id } } as const));

type Store = { users: { role: string; active: boolean }[]; sections: { published: boolean; scheduleBlockId?: string | undefined }[]; courses: unknown[]; purchases: { status: string }[] };
/** The numbers shown on Counter Tiles. */
export const metrics = (s: Store): Record<MetricKey, number> => ({
  accounts: s.users.length, students: s.users.filter((u) => u.role === "student").length, faculty: s.users.filter((u) => u.role === "teacher").length,
  classes: s.sections.length, courses: s.courses.length, unpublished: s.sections.filter((c) => !c.published).length, unscheduled: s.sections.filter((c) => !c.scheduleBlockId).length,
  inactive: s.users.filter((u) => !u.active).length, pendingPurchases: s.purchases.filter((p) => p.status === "Pending").length,
});

export type PageHit = { kind: "Homepage" | "Page"; label: string; link?: LinkKind; hit: { homepage: string } | { to: AdminPath; search?: Record<string, string> } | { action: "new-course" | "new-class" | "new-person" } };

/** Everything the Axiom search bar can jump to besides records: homepages, and the pages (tabs) listed on them. */
export function pageHits(term: string): PageHit[] {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  const out: PageHit[] = [];
  const seen = new Set<string>();
  if (SYSTEM_HOME.title.toLowerCase().includes(t)) out.push({ kind: "Homepage", label: SYSTEM_HOME.title, hit: { to: "/admin" } });
  for (const h of HOMEPAGES) if (h.title.toLowerCase().includes(t)) out.push({ kind: "Homepage", label: h.title, hit: { homepage: h.id } });
  for (const h of ALL_HOMEPAGES) for (const s of [...h.sections, ...(h.quick ? [{ title: "", groups: [{ heading: "", links: [...h.quick.find, ...h.quick.add] }] }] : [])]) for (const g of s.groups) for (const l of [...g.links, ...(s.more ?? [])]) {
    if (!l.label.toLowerCase().includes(t)) continue;
    const key = "action" in l ? `a:${l.action}` : `${l.to}:${JSON.stringify(l.search ?? {})}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: "Page", label: l.label, link: linkKind(l), hit: "action" in l ? { action: l.action } : l.search ? { to: l.to, search: l.search } : { to: l.to } });
  }
  return out;
}
