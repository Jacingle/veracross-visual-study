// Axiom (administrator) data: portals with navigation, per-class configuration and the report card document layout.
export const NAV_TYPES = ["One Column", "Two Columns", "Horizontal Icons", "Single Link"] as const;
export const ITEM_TYPES = ["Header", "Screen", "External URL", "Divider"] as const;
export type NavItem = { id: string; description: string; type: (typeof ITEM_TYPES)[number]; icon: string; column: number; sort: number; screen: string; url: string };
export type NavCategory = { id: string; description: string; icon: string; type: (typeof NAV_TYPES)[number]; sort: number; items: NavItem[] };
export type PortalScreen = { id: string; description: string; access: string; kind: "Component" | "Content"; to: string; edited: string; notes: string; published: boolean };
export type PortalRec = {
  id: string; num: number; description: string; access: string; status: "Draft" | "Published"; sort: number;
  role: "student" | "teacher"; membership: "Security Roles" | "Manually Added"; statusDefault: "Default - Enabled" | "Default - Disabled";
  homeScreen: string; nav: NavCategory[]; screens: PortalScreen[]; modified: string; modifiedBy: string;
};
const D = "2026-11-18T09:00:00";
const scr = (id: string, description: string, access: string, to: string, kind: PortalScreen["kind"] = "Component"): PortalScreen => ({ id, description, access, to, kind, edited: D, notes: "", published: true });
const item = (id: string, description: string, type: NavItem["type"], sort: number, screen = "", icon = "", column = 0, url = ""): NavItem => ({ id, description, type, icon, column, sort, screen, url });
export const defaultPortals = (): PortalRec[] => [
  { id: "student", num: 1, description: "Student Portal", access: "student", status: "Published", sort: 1, role: "student", membership: "Security Roles", statusDefault: "Default - Enabled", homeScreen: "Student Home", modified: D, modifiedBy: "system",
    screens: [scr("s-home", "Student Home", "student-home", "/student"), scr("s-assign", "Assignment Center", "assignments", "/assignments"), scr("s-cal", "My Calendar", "calendar", "/calendar"), scr("s-sched", "Schedule", "schedule", "/schedule"), scr("s-report", "Progress Report", "report-card", "/report-card"), scr("s-dir", "Directories", "directories", "/directories"), scr("s-msg", "Messages", "messages", "/messages", "Content")],
    nav: [{ id: "n-ac", description: "Academics", icon: "education_hat", type: "Two Columns", sort: 1, items: [item("i1", "Classes", "Header", 1), item("i2", "Assignment Center", "Screen", 2, "Assignment Center", "ui-1_calendar-grid-58"), item("i3", "My Calendar", "Screen", 3, "My Calendar", "ui-1_calendar-grid-58"), item("i4", "Progress Report", "Screen", 4, "Progress Report", "files_paper")] },
      { id: "n-dir", description: "Directories", icon: "users_circle-08", type: "One Column", sort: 2, items: [item("i5", "Directories", "Screen", 1, "Directories", "users_circle-08")] }] },
  { id: "faculty", num: 2, description: "Faculty Portal", access: "faculty", status: "Published", sort: 2, role: "teacher", membership: "Security Roles", statusDefault: "Default - Enabled", homeScreen: "Faculty Home", modified: D, modifiedBy: "system",
    screens: [scr("f-home", "Faculty Home", "faculty-home", "/teacher"), scr("f-class", "Class Management", "class-management", "/teacher"), scr("f-dir", "Directories", "directories", "/directories"), scr("f-sched", "Schedule Report", "schedule-report", "/schedule-report")],
    nav: [{ id: "n-fc", description: "Classes", icon: "education_hat", type: "One Column", sort: 1, items: [item("i6", "My Classes", "Screen", 1, "Class Management", "education_hat"), item("i7", "Schedule Report", "Screen", 2, "Schedule Report", "ui-1_calendar-grid-58")] }] },
];
export const screenCounts = (p: PortalRec) => ({ component: p.screens.filter((s) => s.kind === "Component").length, content: p.screens.filter((s) => s.kind === "Content").length });
export const sortedNav = (c: NavCategory[]) => [...c].sort((a, b) => a.sort - b.sort);
export const sortedItems = (c: NavCategory) => [...c.items].sort((a, b) => a.column - b.column || a.sort - b.sort);

/** Per-class settings from the class record "Other" screen. Absent keys fall back to these defaults. */
export type ClassConfig = {
  schoolLevel: string; primaryGrade: string; gradingPeriodGroup: string; gradingSystem: string; gradingMethod: string; conversionScale: string;
  noHonors: boolean; maxStudents: string; trackAttendance: boolean; registrationDeadline: string; fee: string; homeroom: string; classGroup: string;
  minGrade: string; maxGrade: string; catalogDescription: string; portalGradesLayout: string; reportCardForm: string;
  assignMethod: string; scorePublishing: "Automatic" | "Manual"; defaultMax: number; defaultWeight: number; defaultInCalc: boolean;
};
export const DEFAULT_CLASS_CONFIG: ClassConfig = {
  schoolLevel: "Upper School", primaryGrade: "None", gradingPeriodGroup: "Semesters", gradingSystem: "<None Specified>", gradingMethod: "Numeric", conversionScale: "Standard Scale",
  noHonors: false, maxStudents: "", trackAttendance: true, registrationDeadline: "", fee: "", homeroom: "<None>", classGroup: "N/A", minGrade: "None", maxGrade: "None",
  catalogDescription: "", portalGradesLayout: "Old (v1)", reportCardForm: "<None Specified>",
  assignMethod: "Default", scorePublishing: "Automatic", defaultMax: 100, defaultWeight: 100, defaultInCalc: true,
};
export const classConfigOf = (all: Record<string, Partial<ClassConfig>>, id: string): ClassConfig => ({ ...DEFAULT_CLASS_CONFIG, ...all[id] });

/** School-configurable Academic Document (report card) layout: the main "General" parameters. */
export type DocLayout = { name: string; accentText: string; accentBg: string; pageLayout: "Letter" | "Letter Landscape" | "A4" | "A4 Landscape"; showHeader: boolean; showFooter: boolean; labelSeparator: string; showGradeScale: boolean; showGpa: boolean; showComments: boolean; title: string };
export const DEFAULT_DOC_LAYOUT: DocLayout = { name: "Numeric w/ Comments", accentText: "#ffffff", accentBg: "#5b96d0", pageLayout: "Letter", showHeader: true, showFooter: true, labelSeparator: ":", showGradeScale: true, showGpa: true, showComments: true, title: "Quarter 2 Report Card" };
export const PAGE_SIZES: Record<DocLayout["pageLayout"], string> = { Letter: "Letter - 8.5 x 11 in", "Letter Landscape": "Letter Landscape - 11 x 8.5 in", A4: "A4 - 8.3 x 11.7 in", "A4 Landscape": "A4 Landscape - 11.7 x 8.3 in" };
export const isHex = (v: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
