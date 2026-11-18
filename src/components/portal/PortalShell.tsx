import { Link, useNavigate } from "@tanstack/react-router";
import { AlignLeft, BookUser, CalendarDays, ChevronDown, ClipboardList, Home, IdCard, Library, Mail, Megaphone, Newspaper, Receipt, Timer } from "lucide-react";
import { useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { ImageCropper } from "@/components/common/ImageCropper";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RoleGate } from "@/components/auth/RoleGate";
import { VcLogo } from "@/components/portal/VcLogo";
import { BookRibbon, ClockSolid, DeskPhone, ListSquares, SharpEnvelope, ResourcesIcon } from "@/components/portal/icons";
import { ROLE_LABEL, type Area } from "@/lib/auth-rules";
import { SCHOOL } from "@/lib/sis-data";
import { usePortal } from "@/lib/portal-store";
import { bgSrc, useInbox, useSchool } from "@/lib/school-store";
import { PortalChooser } from './PortalChooser';
import { Button } from '@/components/ui/button';

export type Portal = "student" | "teacher";

type NavIcon = ComponentType<{ className?: string }>;
/** kind: "custom" icons paint themselves, "solid" lucide icons are filled, "line" icons stay outlined. */
type NavItem = { to: string; label: string; icon: NavIcon; kind: "custom" | "solid" | "line" };
const NAV = {
  student: [
    { to: "/classes", label: "Classes & Reports", icon: ListSquares, kind: "custom" },
    { to: "/schedule", label: "Daily Schedule", icon: ClockSolid, kind: "custom" },
    { to: "/assignments", label: "Assignments", icon: BookRibbon, kind: "custom" },
    { to: "/calendar", label: "My Calendar", icon: CalendarDays, kind: "solid" },
    { to: "/resources", label: "Resources", icon: ResourcesIcon, kind: "custom" },
    { to: "/directories", label: "Directories", icon: DeskPhone, kind: "custom" },
  ],
  teacher: [
    { to: "/teacher", label: "Grade & Student Management", icon: IdCard, kind: "line" },
    { to: "/teacher/news", label: "School News & Events", icon: Newspaper, kind: "line" },
    { to: "/directories", label: "Directories", icon: BookUser, kind: "line" },
    { to: "/teacher/purchases", label: "Purchase Requests", icon: Receipt, kind: "line" },
  ],
} as const satisfies Record<Portal, readonly NavItem[]>;

/** Top-bar links: the hover block fills the bar height with a 20% white wash. */
const TOP_LINK = "flex h-full items-center gap-2 px-2.5 [--cut:var(--vc-topbar)] hover:bg-primary-foreground/20 hover:[--cut:color-mix(in_oklab,var(--vc-topbar)_80%,white)]";

/** Portal frame: two-row top bar + customizable background + white content card. */
export function PortalShell({ children, portal, area, wide = false, bare = false }: { children: ReactNode; portal?: Portal; area?: Area; wide?: boolean; bare?: boolean }) {
  return (
    <RoleGate area={area ?? portal ?? "shared"}>
      <Frame portal={portal} wide={wide} bare={bare}>{children}</Frame>
    </RoleGate>
  );
}

function Frame({ children, portal, wide, bare }: { children: ReactNode; portal: Portal | undefined; wide: boolean; bare: boolean }) {
  const { user, settings, logout, photos, update, sections, impersonatorId, stopImpersonating } = useSchool();
  const [chooser, setChooser] = useState(false);
  const [crop, setCrop] = useState(false);
  const firstClass = sections.find((c) => c.published && (c.teacherIds.includes(user?.personId ?? "") || c.studentIds.includes(user?.personId ?? "")));
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
        <div className="relative flex h-[34px] items-center bg-vc-topbar px-3 text-[14px] text-primary-foreground">
          <span className="hidden truncate lg:inline">{SCHOOL.name}</span>
          <div className="flex h-[34px] min-w-0 items-stretch sm:absolute sm:left-1/2 sm:top-0 sm:-translate-x-1/2">
            <Link to={p === "student" ? "/student" : "/teacher"} className="portal-title flex items-center gap-2 whitespace-nowrap bg-vc-navbar px-7 text-[16px] font-semibold">
              <Home className="size-4 fill-current" /> {p === "student" ? "Student Portal" : "Faculty Portal"}
            </Link>
            <Button variant="ghost" aria-label="Switch portal" onClick={() => setChooser(true)} className="portal-switch my-1 ml-0.5 flex h-[26px] w-[59px] shrink-0 items-center justify-center gap-1 rounded-none bg-vc-navbar p-0 text-primary-foreground hover:bg-vc-navbar hover:text-primary-foreground">
                <VcLogo className="h-5 w-6" /><ChevronDown className="size-3" />
              </Button>
          </div>
          <div className="ml-auto flex h-full items-center">
            <Link to="/messages" className={TOP_LINK}>
              <SharpEnvelope className="size-[21px]" /><span className="hidden lg:inline">Messages</span>{unread > 0 && <span className="rounded-full bg-vc-link px-1.5 text-[11px] font-semibold">{unread}</span>}
            </Link>
            <Link to="/calendar" className={TOP_LINK}><CalendarDays className="size-[21px] fill-current stroke-(--cut)" /><span className="hidden lg:inline">My Calendar</span></Link>
            <DropdownMenu>
              <Button variant="ghost" onClick={() => setChooser(true)} aria-label="Account menu" className="ml-2.5 grid size-6 overflow-hidden place-items-center rounded-full bg-primary-foreground/25 p-0 text-[12px] outline-none"><PersonPhoto personId={user?.personId} className="size-6" /></Button>
              <DropdownMenuContent align="end" className="text-[13px]">
                <DropdownMenuLabel>{user?.first} {user?.last}<div className="text-xs font-normal text-muted-foreground">{user?.email} · {user ? ROLE_LABEL[user.role] : ""}</div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.personId && <DropdownMenuItem onClick={() => setCrop(true)}>Upload Profile Photo</DropdownMenuItem>}
                {p === "student" && <DropdownMenuItem asChild><Link to="/classes">My Profile & Reports</Link></DropdownMenuItem>}
                <DropdownMenuItem onClick={signOut}>Log Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <nav className="flex min-h-[45px] flex-wrap items-stretch justify-center bg-vc-navbar text-[14px] text-primary-foreground shadow-md">
          {NAV[p].map(({ to, label, icon: Icon, kind }) => (
            <Link key={to} to={to} className="flex items-center gap-2 px-[15px] py-2 [--cut:var(--vc-navbar)] hover:bg-primary-foreground hover:text-vc-navbar hover:[--cut:var(--primary-foreground)]">
              <Icon className={kind === "solid" ? "size-4 fill-current stroke-(--cut)" : "size-4"} />{label}
            </Link>
          ))}
        </nav>
      </header>
      {impersonatorId && <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-vc-line bg-vc-note px-4 py-1 text-[12px]"><span>Impersonating: <strong>{user?.first} {user?.last}</strong> · {user ? ROLE_LABEL[user.role] : ""}</span><Button variant="ghost" size="sm" className="h-6 text-vc-link-strong" onClick={() => { stopImpersonating(); nav({ to: '/admin/users' }); }}>Return to Administration</Button></div>}
      <main className="relative min-h-[calc(100vh-79px)] pb-12 pt-[30px]">
        {src && <img src={src} alt="" width={1920} height={1088} className={`pointer-events-none fixed inset-0 h-full w-full object-cover ${theme.blur ? "blur-[3px]" : ""}`} />}
        {bare ? <div className="relative mx-auto w-[calc(100%-2rem)] max-w-[1400px]">{children}</div>
          : <div className={`relative mx-auto overflow-hidden bg-background shadow-xl ${wide ? "mx-4" : "w-[calc(100%-2rem)] max-w-[1000px]"}`}>{children}</div>}
      </main>
      <ImageCropper open={crop} onClose={() => setCrop(false)} aspect={1} outWidth={300} title="Profile Photo" onSave={(photo, fullPhoto) => { if (!user?.personId) return; update((s) => ({ ...s, photos: { ...s.photos, [user.personId]: photo }, fullPhotos: { ...s.fullPhotos, [user.personId]: fullPhoto } })); }} />
      <PortalChooser open={chooser} onClose={() => setChooser(false)} />
    </div>
  );
}

const TABS = [
  { to: "/classes", label: "Student Overview", icon: ListSquares, solid: false },
  { to: "/schedule", label: "Daily Schedule", icon: Timer, solid: true },
  { to: "/updates", label: "Recent Updates", icon: Megaphone, solid: true },
  { to: "/assignments", label: "Assignments", icon: AlignLeft, solid: false },
] as const;

export function StudentTabs() {
  return (
    <div className="grid grid-cols-4 border-b border-vc-line bg-vc-panel sm:flex sm:justify-end">
      {TABS.map(({ to, label, icon: Icon, solid }) => (
        <Link key={to} to={to} className="flex min-w-0 flex-col items-center gap-2 border-l border-vc-line px-2 pb-[11px] pt-[19px] sm:min-w-[125px] sm:px-5 text-[12.5px] leading-[18.75px] text-foreground/75 [--cut:var(--vc-panel)] hover:bg-background hover:[--cut:var(--background)]"
          activeProps={{ className: "!bg-background !text-vc-link -mb-px [--cut:var(--background)]" }}>
          <Icon className={solid ? "size-[18px] fill-current stroke-(--cut)" : "size-[18px]"} strokeWidth={solid ? 2 : 1.5} />{label}
        </Link>
      ))}
    </div>
  );
}

/** Page title bar used across portal pages. */
export function PageTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return <div className="flex items-center justify-between border-b border-vc-line px-4 py-3.5 text-[18px]"><span>{children}</span>{right}</div>;
}
