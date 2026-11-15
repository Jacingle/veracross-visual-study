import { Link, useNavigate } from "@tanstack/react-router";
import { AlignLeft, BookUser, Bookmark, CalendarDays, ChevronDown, ClipboardList, Clock, Home, IdCard, Landmark, List, Mail, Megaphone, Newspaper, Receipt, Timer } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RoleGate } from "@/components/auth/RoleGate";
import { VcLogo } from "@/components/portal/VcLogo";
import { ROLE_LABEL, type Area } from "@/lib/auth-rules";
import { SCHOOL } from "@/lib/sis-data";
import { usePortal } from "@/lib/portal-store";
import { bgSrc, useInbox, useSchool } from "@/lib/school-store";

export type Portal = "student" | "teacher";

const NAV = {
  student: [
    { to: "/classes", label: "Classes & Reports", icon: List },
    { to: "/schedule", label: "Daily Schedule", icon: Clock },
    { to: "/assignments", label: "Assignments", icon: Bookmark },
    { to: "/calendar", label: "My Calendar", icon: CalendarDays },
    { to: "/resources", label: "Resources", icon: Landmark },
    { to: "/directories", label: "Directories", icon: BookUser },
  ],
  teacher: [
    { to: "/teacher", label: "Grade & Student Management", icon: IdCard },
    { to: "/teacher/news", label: "School News & Events", icon: Newspaper },
    { to: "/directories", label: "Directories", icon: BookUser },
    { to: "/teacher/purchases", label: "Purchase Requests", icon: Receipt },
  ],
} as const;

/** Portal frame: two-row top bar + customizable background + white content card. */
export function PortalShell({ children, portal, area, wide = false, bare = false }: { children: ReactNode; portal?: Portal; area?: Area; wide?: boolean; bare?: boolean }) {
  return (
    <RoleGate area={area ?? portal ?? "shared"}>
      <Frame portal={portal} wide={wide} bare={bare}>{children}</Frame>
    </RoleGate>
  );
}

function Frame({ children, portal, wide, bare }: { children: ReactNode; portal: Portal | undefined; wide: boolean; bare: boolean }) {
  const { user, settings, logout } = useSchool();
  const { read } = usePortal();
  const inbox = useInbox();
  const nav = useNavigate();
  const p: Portal = portal ?? (user?.role === "student" ? "student" : "teacher");
  const theme = settings[p];
  const style = { ...(theme.topbar ? { "--vc-topbar": theme.topbar } : {}), ...(theme.navbar ? { "--vc-navbar": theme.navbar } : {}) } as CSSProperties;
  const src = bgSrc(theme.bg);
  const unread = inbox.filter((m) => !read.includes(m.id)).length;
  const initials = user ? `${user.first[0] ?? ""}${user.last[0] ?? ""}` : "";
  const signOut = () => { logout(); nav({ to: "/", replace: true }); };
  return (
    <div className={`min-h-screen bg-vc-panel ${p === "teacher" ? "portal-faculty" : ""}`} style={style}>
      <header className="sticky top-0 z-30">
        <div className="relative flex h-9 items-center bg-vc-topbar px-3 text-[14px] text-primary-foreground">
          <span className="truncate">{SCHOOL.name}</span>
          <div className="absolute left-1/2 top-0 flex h-9 -translate-x-1/2 items-stretch">
            <Link to={p === "student" ? "/student" : "/teacher"} className="flex items-center gap-2 whitespace-nowrap bg-vc-navbar px-6 text-[16px] font-semibold [clip-path:polygon(5%_0,100%_0,100%_100%,0_100%)]">
              <Home className="size-4 fill-current" /> {p === "student" ? "Student Portal" : "Faculty Portal"}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Switch portal" className="my-1 ml-1 flex items-center gap-1 border border-primary-foreground/30 bg-vc-navbar/50 px-3 outline-none [clip-path:polygon(10%_0,100%_0,90%_100%,0_100%)]">
                <VcLogo className="h-4 w-5" /><ChevronDown className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="text-[13px]">
                <DropdownMenuLabel>Switch Portal</DropdownMenuLabel>
                {user?.role === "admin" && <DropdownMenuItem asChild><Link to="/admin">Axiom (Administration)</Link></DropdownMenuItem>}
                {user?.role !== "student" && <DropdownMenuItem asChild><Link to="/teacher">Faculty Portal</Link></DropdownMenuItem>}
                {user?.role !== "teacher" && <DropdownMenuItem asChild><Link to="/student">Student Portal</Link></DropdownMenuItem>}
                <DropdownMenuItem asChild><Link to="/class/$classId" params={{ classId: "143-1" }}>Class Websites</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="ml-auto flex items-center gap-5">
            <Link to="/messages" className="flex items-center gap-1.5 hover:underline">
              <Mail className="size-5" /> Messages{unread > 0 && <span className="rounded-full bg-vc-link px-1.5 text-[11px] font-semibold">{unread}</span>}
            </Link>
            <Link to="/calendar" className="flex items-center gap-1.5 hover:underline"><CalendarDays className="size-5" /> My Calendar</Link>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Account menu" className="grid size-7 place-items-center rounded-full bg-primary-foreground/25 text-[12px] outline-none">{initials}</DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-[13px]">
                <DropdownMenuLabel>{user?.first} {user?.last}<div className="text-xs font-normal text-muted-foreground">{user?.email} · {user ? ROLE_LABEL[user.role] : ""}</div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                {p === "student" && <DropdownMenuItem asChild><Link to="/classes">My Profile & Reports</Link></DropdownMenuItem>}
                <DropdownMenuItem onClick={signOut}>Log Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <nav className="flex h-11 items-center justify-center gap-8 bg-vc-navbar text-[14px] text-primary-foreground shadow-md">
          {NAV[p].map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/teacher" }} className="flex items-center gap-2 border-b-2 border-transparent py-0.5 hover:border-primary-foreground/60" activeProps={{ className: "border-primary-foreground/80" }}>
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="relative min-h-[calc(100vh-80px)] pb-12 pt-7">
        {src && <img src={src} alt="" width={1920} height={1088} className={`pointer-events-none fixed inset-0 h-full w-full object-cover ${theme.blur ? "blur-[3px]" : ""}`} />}
        {bare ? <div className="relative mx-auto w-[calc(100%-2rem)] max-w-[1400px]">{children}</div>
          : <div className={`relative mx-auto bg-background shadow-xl ${wide ? "mx-4" : "w-[calc(100%-2rem)] max-w-[1000px]"}`}>{children}</div>}
      </main>
    </div>
  );
}

const TABS = [
  { to: "/classes", label: "Student Overview", icon: ClipboardList },
  { to: "/schedule", label: "Daily Schedule", icon: Timer },
  { to: "/updates", label: "Recent Updates", icon: Megaphone },
  { to: "/assignments", label: "Assignments", icon: AlignLeft },
] as const;

export function StudentTabs() {
  return (
    <div className="flex justify-end border-b border-vc-line bg-vc-panel">
      {TABS.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} className="flex w-[130px] flex-col items-center gap-1.5 border-l border-vc-line py-3.5 text-[13px] text-muted-foreground hover:bg-background"
          activeProps={{ className: "!bg-background !text-vc-link -mb-px" }}>
          <Icon className="size-5" />{label}
        </Link>
      ))}
    </div>
  );
}

/** Page title bar used across portal pages. */
export function PageTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return <div className="flex items-center justify-between border-b border-vc-line px-4 py-3.5 text-[18px]"><span>{children}</span>{right}</div>;
}
