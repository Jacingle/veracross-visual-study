import { BookOpen, CalendarDays, ClipboardList, Clock, FileText, Home, LayoutGrid, Mail, Palette, Receipt, School, Search, Users } from "lucide-react";

/** Every Axiom screen, listed under "Common Links" on the Launchpad's Rocket Ship. */
export const AXIOM_LINKS = [
  { to: "/admin", label: "System Administrator Homepage", icon: Home },
  { to: "/admin/queries", label: "Queries & Records", icon: Search },
  { to: "/admin/users", label: "Users & Security", icon: Users },
  { to: "/admin/courses", label: "Courses & Enrollment", icon: BookOpen },
  { to: "/admin/classes", label: "Classes", icon: ClipboardList },
  { to: "/admin/school", label: "School Information", icon: School },
  { to: "/admin/settings", label: "Portal Settings", icon: Palette },
  { to: "/admin/assignment-types", label: "Class Assignment Types", icon: Palette },
  { to: "/admin/portals", label: "Portals", icon: LayoutGrid },
  { to: "/admin/report-layouts", label: "Report Card Layouts", icon: FileText },
  { to: "/admin/terms", label: "School Years & Terms", icon: Clock },
  { to: "/admin/scheduling", label: "Scheduling Sets", icon: Clock },
  { to: "/admin/student-schedules", label: "Student Schedules", icon: CalendarDays },
  { to: "/admin/workspaces", label: "Workspaces", icon: LayoutGrid },
  { to: "/admin/messages", label: "Communications", icon: Mail },
  { to: "/admin/purchases", label: "Purchase Approvals", icon: Receipt },
] as const;
