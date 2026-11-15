import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, ChevronRight, Clock, Home, LayoutGrid, LogOut, Mail, Palette, Receipt, Search, Star, Users } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import crest from "@/assets/crest.png";
import { RoleGate } from "@/components/auth/RoleGate";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ALL_SECTIONS, SCHOOL, STUDENTS, TEACHERS, courseTitle } from "@/lib/sis-data";
import { useSchool } from "@/lib/school-store";

type Crumb = { label: string; to?: "/admin/courses" | "/admin/users" | "/admin/settings" };

export const AXIOM_LINKS = [
  { to: "/admin", label: "System Administrator Homepage", icon: Home },
  { to: "/admin/users", label: "Users & Security", icon: Users },
  { to: "/admin/courses", label: "Courses & Enrollment", icon: BookOpen },
  { to: "/admin/settings", label: "Portal Settings", icon: Palette },
  { to: "/admin/messages", label: "Communications", icon: Mail },
  { to: "/admin/purchases", label: "Purchase Approvals", icon: Receipt },
] as const;

/** Axiom (admin) frame: Launchpad, global search, breadcrumb bar, grey workspace. */
export function AxiomShell({ title, crumbs = [], actions, children }: { title: string; crumbs?: Crumb[]; actions?: ReactNode; children: ReactNode }) {
  return <RoleGate area="admin"><Frame title={title} crumbs={crumbs} actions={actions}>{children}</Frame></RoleGate>;
}

function Frame({ title, crumbs, actions, children }: { title: string; crumbs: Crumb[]; actions: ReactNode; children: ReactNode }) {
  const { user, logout, users } = useSchool();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return [
      ...ALL_SECTIONS.filter((c) => courseTitle(c).toLowerCase().includes(t) || c.id.includes(t)).slice(0, 5).map((c) => ({ kind: "Class", label: courseTitle(c), go: () => nav({ to: "/admin/courses/$courseId", params: { courseId: c.id } }) })),
      ...users.filter((u) => `${u.first} ${u.last} ${u.email}`.toLowerCase().includes(t)).slice(0, 4).map((u) => ({ kind: "User", label: `${u.first} ${u.last} (${u.email})`, go: () => nav({ to: "/admin/users", search: { q: u.email } }) })),
      ...TEACHERS.filter((x) => `${x.first} ${x.last}`.toLowerCase().includes(t)).slice(0, 4).map((x) => ({ kind: "Faculty", label: `${x.prefix} ${x.first} ${x.last}`, go: () => nav({ to: "/directories", search: { type: "faculty", last: x.last } }) })),
      ...STUDENTS.filter((x) => `${x.first} ${x.last}`.toLowerCase().includes(t)).slice(0, 5).map((x) => ({ kind: "Student", label: `${x.first} ${x.last} · Grade ${x.grade}`, go: () => nav({ to: "/directories", search: { type: "students", first: x.first, last: x.last } }) })),
    ];
  }, [q, users, nav]);
  return (
    <div className="min-h-screen bg-ax-side text-[13px]">
      <header className="sticky top-0 z-30">
        <div className="flex h-10 items-center gap-3 bg-ax-top px-2 text-primary-foreground">
          <button onClick={() => setOpen(true)} aria-label="Open Launchpad" className="flex h-8 items-center gap-1.5 px-2 hover:bg-primary-foreground/10"><LayoutGrid className="size-5" /><span className="text-[15px] font-semibold">Axiom</span></button>
          <img src={crest} alt="" width={816} height={816} className="size-6 rounded-full bg-background object-contain" />
          <span className="hidden text-[14px] lg:inline">{SCHOOL.name}</span>
          <div className="relative mx-auto w-full max-w-[520px]">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 opacity-80" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people, classes and users" aria-label="Search Axiom"
              className="h-7 w-full rounded-sm bg-ax-search/40 pl-8 pr-2 text-primary-foreground placeholder:text-primary-foreground/70 outline-none focus:bg-background focus:text-foreground" />
            {results.length > 0 && (
              <ul className="absolute left-0 right-0 top-8 max-h-80 overflow-y-auto border border-vc-line bg-background text-foreground shadow-lg">
                {results.map((r, i) => <li key={i}><button onClick={() => { setQ(""); r.go(); }} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-vc-panel"><span className="w-14 text-[10px] font-semibold uppercase text-muted-foreground">{r.kind}</span>{r.label}</button></li>)}
              </ul>)}
          </div>
          <Link to="/teacher" className="hidden whitespace-nowrap hover:underline md:inline">Faculty Portal</Link>
          <Link to="/student" className="hidden whitespace-nowrap hover:underline md:inline">Student Portal</Link>
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Account menu" className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-foreground/25 text-[12px] outline-none">{user?.first[0]}{user?.last[0]}</DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-[13px]">
              <DropdownMenuLabel>{user?.first} {user?.last}<div className="text-xs font-normal text-muted-foreground">{user?.email} · Administrator</div></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); nav({ to: "/", replace: true }); }}><LogOut className="size-4" /> Log Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex h-9 items-center gap-2 border-b border-vc-line bg-background px-4">
          <Link to="/admin" className="text-vc-link-strong hover:underline">Home</Link>
          {crumbs.map((c) => <span key={c.label} className="flex items-center gap-2"><ChevronRight className="size-3.5 text-muted-foreground" />{c.to ? <Link to={c.to} className="text-vc-link-strong hover:underline">{c.label}</Link> : c.label}</span>)}
          <ChevronRight className="size-3.5 text-muted-foreground" /><b className="font-semibold">{title}</b>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </div>
      </header>
      <main className="p-4">{children}</main>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[300px] p-0 text-[13px]">
          <SheetHeader className="bg-ax-top px-4 py-3"><SheetTitle className="text-primary-foreground">Launchpad</SheetTitle></SheetHeader>
          <div className="px-2 py-2">
            <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Homepages</div>
            {AXIOM_LINKS.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-vc-panel"><Icon className="size-4 text-ax-top" />{label}</Link>)}
            <div className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Favorites</div>
            {[{ to: "/admin/users", l: "Add a User" }, { to: "/admin/settings", l: "Backgrounds & Colors" }] as const.map((f) => <Link key={f.l} to={f.to} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-vc-panel"><Star className="size-4 text-vc-tile-warm-fg" />{f.l}</Link>)}
            <div className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Portals</div>
            {[{ to: "/teacher", l: "Faculty Portal" }, { to: "/student", l: "Student Portal" }] as const.map((f) => <Link key={f.l} to={f.to} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-vc-panel"><Clock className="size-4 text-muted-foreground" />{f.l}</Link>)}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Axiom-style white panel with a grey header strip. */
export function Panel({ title, right, children, className = "" }: { title: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`border border-vc-line bg-background ${className}`}>
      <div className="flex items-center justify-between border-b border-vc-line bg-ax-head px-3 py-1.5 text-[13px] font-semibold">{title}{right}</div>
      <div className="p-3">{children}</div>
    </section>
  );
}
