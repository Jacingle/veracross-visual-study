// Axiom (administrator) homepages. Each homepage is a full page of grouped links, like Veracross "Academic Configuration".
// Links point only at screens that exist in this app; add a link here when a new screen is built.
export type AdminPath =
  | "/admin" | "/admin/queries" | "/admin/users" | "/admin/courses" | "/admin/classes" | "/admin/settings" | "/admin/assignment-types"
  | "/admin/portals" | "/admin/report-layouts" | "/admin/terms" | "/admin/scheduling" | "/admin/messages" | "/admin/purchases";

export type HomeLink =
  | { label: string; to: AdminPath; search?: Record<string, string> }
  /** A button that opens a blank record in a new window. */
  | { label: string; action: "new-course" | "new-class" | "new-person" };
export type HomeGroup = { heading: string; links: HomeLink[] };
export type HomeSection = { title: string; groups: HomeGroup[] };
export type Homepage = { id: string; title: string; heading: string; sections: HomeSection[] };

export const SYSTEM_HOME = { title: "System Administrator Homepage", to: "/admin" as const };

const link = (label: string, to: AdminPath, search?: Record<string, string>): HomeLink => (search ? { label, to, search } : { label, to });

export const HOMEPAGES: Homepage[] = [
  {
    id: "academic-configuration", title: "Academic Configuration", heading: "Academic Foundation",
    sections: [
      { title: "1. Academic Hierarchy", groups: [
        { heading: "General", links: [link("School Years & Terms", "/admin/terms")] },
        { heading: "Course Structure", links: [{ label: "Add Course", action: "new-course" }, link("Courses", "/admin/courses"), link("Classes", "/admin/classes")] },
      ] },
      { title: "2. Grading Configuration", groups: [
        { heading: "Assignments", links: [link("Assignment Types", "/admin/assignment-types")] },
        { heading: "Grades & Comments", links: [link("Report Card Layouts", "/admin/report-layouts")] },
      ] },
      { title: "3. Scheduling", groups: [
        { heading: "General", links: [link("School Years & Terms", "/admin/terms")] },
        { heading: "Blocks Configuration", links: [link("Scheduling Sets", "/admin/scheduling")] },
      ] },
      { title: "4. Classes Setup", groups: [
        { heading: "General", links: [{ label: "Add Class", action: "new-class" }, link("Classes", "/admin/classes"), link("Unpublished Classes", "/admin/queries", { source: "classes", status: "draft" })] },
        { heading: "Course & Class Configuration", links: [link("Courses", "/admin/courses")] },
      ] },
      { title: "5. Academic Documents", groups: [
        { heading: "Report Cards", links: [link("Report Card Layouts", "/admin/report-layouts")] },
      ] },
    ],
  },
  {
    id: "people-records", title: "People & Records", heading: "People and Records",
    sections: [
      { title: "1. People", groups: [
        { heading: "Accounts", links: [link("Users & Security", "/admin/users"), { label: "Add Person", action: "new-person" }] },
        { heading: "Find", links: [link("Queries & Records", "/admin/queries"), link("Inactive Accounts", "/admin/queries", { source: "people", status: "inactive" })] },
      ] },
    ],
  },
  {
    id: "communications", title: "Communications & Business", heading: "Communications and Business",
    sections: [
      { title: "1. Communications", groups: [{ heading: "Messages", links: [link("Send a Message", "/admin/messages")] }] },
      { title: "2. Business", groups: [{ heading: "Approvals", links: [link("Purchase Approvals", "/admin/purchases")] }] },
    ],
  },
  {
    id: "portals", title: "Portals", heading: "Portals",
    sections: [
      { title: "1. Portal Setup", groups: [{ heading: "Portals", links: [link("Portals", "/admin/portals"), link("Portal Settings", "/admin/settings")] }] },
    ],
  },
];

export const homepageById = (id: string) => HOMEPAGES.find((h) => h.id === id);

export type PageHit = { kind: "Homepage" | "Page"; label: string; hit: { homepage: string } | { to: AdminPath; search?: Record<string, string> } | { action: "new-course" | "new-class" | "new-person" } };

/** Everything the Axiom search bar can jump to besides records: homepages, and the pages (tabs) listed on them. */
export function pageHits(term: string): PageHit[] {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  const out: PageHit[] = [];
  const seen = new Set<string>();
  if (SYSTEM_HOME.title.toLowerCase().includes(t)) out.push({ kind: "Homepage", label: SYSTEM_HOME.title, hit: { to: "/admin" } });
  for (const h of HOMEPAGES) {
    if (h.title.toLowerCase().includes(t)) out.push({ kind: "Homepage", label: h.title, hit: { homepage: h.id } });
    for (const s of h.sections) for (const g of s.groups) for (const l of g.links) {
      if (!l.label.toLowerCase().includes(t)) continue;
      const key = "action" in l ? `a:${l.action}` : `${l.to}:${JSON.stringify(l.search ?? {})}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ kind: "Page", label: "action" in l ? l.label : `${l.label}`, hit: "action" in l ? { action: l.action } : l.search ? { to: l.to, search: l.search } : { to: l.to } });
    }
  }
  return out;
}
