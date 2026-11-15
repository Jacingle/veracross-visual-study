import { Link } from "@tanstack/react-router";
import { BookUser, Bookmark, CalendarDays, ChevronDown, Clock, Home, Landmark, List, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import bg from "@/assets/portal-bg.jpg";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ME, MESSAGES, SCHOOL } from "@/lib/sis-data";
import { usePortal } from "@/lib/portal-store";

const NAV = [
  { to: "/classes", label: "Classes & Reports", icon: List },
  { to: "/schedule", label: "Daily Schedule", icon: Clock },
  { to: "/assignments", label: "Assignments", icon: Bookmark },
  { to: "/calendar", label: "My Calendar", icon: CalendarDays },
  { to: "/resources", label: "Resources", icon: Landmark },
  { to: "/directories", label: "Directories", icon: BookUser },
] as const;

export function PortalShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { read } = usePortal();
  const unread = MESSAGES.filter((m) => !read.includes(m.id)).length;
  return (
    <div className="min-h-screen bg-vc-topbar">
      <header className="sticky top-0 z-30">
        <div className="relative flex h-11 items-center bg-vc-topbar px-3 text-[17px] text-primary-foreground">
          <span className="font-normal">{SCHOOL.name}</span>
          <div className="absolute left-1/2 top-0 flex h-11 -translate-x-1/2 items-stretch">
            <Link to="/" className="flex items-center gap-2 bg-vc-navbar px-7 text-[19px] font-semibold [clip-path:polygon(4%_0,100%_0,100%_100%,0_100%)]">
              <Home className="size-5 fill-current" /> Student Portal
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-1 flex items-center gap-1 border border-primary-foreground/25 bg-vc-navbar/60 px-3 my-1.5 outline-none [clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)]">
                <Landmark className="size-5" /><ChevronDown className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuLabel>Switch Portal</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => toast("You're already in the Student Portal")}>Student Portal</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Parent Portal requires a parent account")}>Parent Portal</DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/class/$classId" params={{ classId: "101-1" }}>Class Websites</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="ml-auto flex items-center gap-6">
            <Link to="/messages" className="flex items-center gap-2 hover:underline">
              <Mail className="size-6" /> Messages{unread > 0 && <span className="rounded-full bg-vc-link px-1.5 text-xs font-semibold">{unread}</span>}
            </Link>
            <Link to="/calendar" className="flex items-center gap-2 hover:underline"><CalendarDays className="size-6" /> My Calendar</Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="grid size-8 place-items-center rounded-full bg-primary-foreground/25 text-sm outline-none">
                {ME.first[0]}{ME.last[0]}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{ME.first} {ME.last}<div className="text-xs font-normal text-muted-foreground">{ME.email}</div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/classes">My Profile & Reports</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.success("Signed out (demo)")}>Log Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <nav className="flex h-[58px] items-center justify-center gap-10 bg-vc-navbar text-[17px] text-primary-foreground shadow-md">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex items-center gap-2.5 border-b-2 border-transparent py-1 hover:border-primary-foreground/60" activeProps={{ className: "border-primary-foreground/80" }}>
              <Icon className="size-5" /> {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="relative min-h-[calc(100vh-102px)] pb-16 pt-10">
        <img src={bg} alt="" width={1920} height={1088} className="pointer-events-none fixed inset-0 -z-0 h-full w-full object-cover" />
        <div className={`relative mx-auto bg-background shadow-xl ${wide ? "max-w-none" : "max-w-[1306px]"}`}>{children}</div>
      </main>
    </div>
  );
}

const TABS = [
  { to: "/classes", label: "Student Overview" },
  { to: "/schedule", label: "Daily Schedule" },
  { to: "/updates", label: "Recent Updates" },
  { to: "/assignments", label: "Assignments" },
] as const;

import { ClipboardList, Megaphone, AlignLeft, Timer } from "lucide-react";
const TAB_ICONS = [ClipboardList, Timer, Megaphone, AlignLeft];

export function StudentTabs() {
  return (
    <div className="flex justify-end border-b border-vc-line bg-vc-panel">
      {TABS.map((t, i) => {
        const Icon = TAB_ICONS[i];
        return (
          <Link key={t.to} to={t.to} className="flex w-[163px] flex-col items-center gap-2 border-l border-vc-line py-5 text-[15px] text-muted-foreground hover:bg-background"
            activeProps={{ className: "!bg-background !text-vc-link -mb-px" }}>
            <Icon className="size-6" />{t.label}
          </Link>
        );
      })}
    </div>
  );
}
