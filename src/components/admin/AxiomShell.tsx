import { PersonPhoto } from "@/components/common/PersonPhoto";
import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Clock, Rocket, Home, LayoutGrid, LogOut, Mail, Palette, Receipt, Search, Star, Users } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SCHOOL, STUDENTS, TEACHERS, courseTitle } from "@/lib/sis-data";
import { useSchool } from "@/lib/school-store";
import { PortalChooser } from '@/components/portal/PortalChooser';
import { Button } from '@/components/ui/button';

type Crumb = { label: string; to?: "/admin/courses" | "/admin/users" | "/admin/settings" };

export const AXIOM_LINKS = [
  { to: "/admin", label: "System Administrator Homepage", icon: Home },
  { to: "/admin/users", label: "Users & Security", icon: Users },
  { to: "/admin/courses", label: "Courses & Enrollment", icon: BookOpen },
  { to: "/admin/settings", label: "Portal Settings", icon: Palette },
  { to: "/admin/assignment-types", label: "Class Assignment Types", icon: Palette },
  { to: "/admin/scheduling", label: "Scheduling Sets", icon: Clock },
  { to: "/admin/messages", label: "Communications", icon: Mail },
  { to: "/admin/purchases", label: "Purchase Approvals", icon: Receipt },
] as const;

/** Axiom (admin) frame: Launchpad, global search, breadcrumb bar, grey workspace. */
export function AxiomShell({ title, crumbs = [], actions, children }: { title: string; crumbs?: Crumb[]; actions?: ReactNode; children: ReactNode }) {
  return <RoleGate area="admin"><Frame title={title} crumbs={crumbs} actions={actions}>{children}</Frame></RoleGate>;
}

function Frame({ title, crumbs, actions, children }: { title: string; crumbs: Crumb[]; actions: ReactNode; children: ReactNode }) {
  const { user, logout, users, sections } = useSchool();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [chooser, setChooser] = useState(false);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return [
      ...sections.filter((c) => courseTitle(c).toLowerCase().includes(t) || c.id.includes(t)).slice(0, 5).map((c) => ({ kind: "Class", label: courseTitle(c), go: () => nav({ to: "/admin/courses/$courseId", params: { courseId: c.id } }) })),
      ...users.filter((u) => `${u.first} ${u.last} ${u.email}`.toLowerCase().includes(t)).slice(0, 4).map((u) => ({ kind: "User", label: `${u.first} ${u.last} (${u.email})`, go: () => nav({ to: "/admin/users", search: { q: u.email } }) })),
      ...TEACHERS.filter((x) => `${x.first} ${x.last}`.toLowerCase().includes(t)).slice(0, 4).map((x) => ({ kind: "Faculty", label: `${x.prefix} ${x.first} ${x.last}`, go: () => nav({ to: "/directories", search: { type: "faculty", last: x.last } }) })),
      ...STUDENTS.filter((x) => `${x.first} ${x.last}`.toLowerCase().includes(t)).slice(0, 5).map((x) => ({ kind: "Student", label: `${x.first} ${x.last} · Grade ${x.grade}`, go: () => nav({ to: "/directories", search: { type: "students", first: x.first, last: x.last } }) })),
    ];
  }, [q, users, nav]);
  return (
    <div className="min-h-screen bg-ax-side text-[13px]">
      <header className="sticky top-0 z-30">
        <div className="flex h-[30px] items-center justify-between bg-ax-top px-4 text-primary-foreground">
          <span className="text-[15px] font-semibold uppercase tracking-tight">{SCHOOL.name}</span>
          <span className="flex items-center gap-4 text-[12px]">
            <Link to="/teacher" className="hidden hover:underline md:inline">Faculty Portal</Link>
            <Link to="/student" className="hidden hover:underline md:inline">Student Portal</Link>
            <span className="hidden opacity-80 sm:inline">{user?.first} {user?.last}</span>
            <button onClick={() => { logout(); nav({ to: "/", replace: true }); }} className="hover:underline">[log out]</button>
          </span>
        </div>
        <div className="flex h-[56px] items-center gap-3 bg-ax-bar px-4 text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,.25)]">
          <button onClick={() => setOpen(true)} aria-label="Open Launchpad" title="Launchpad" className="grid size-9 place-items-center hover:bg-primary-foreground/10"><Rocket className="size-6 fill-current" /></button>
          <button onClick={() => setOpen(true)} aria-label="Favorites" title="Favorites" className="grid size-9 place-items-center hover:bg-primary-foreground/10"><Star className="size-6 fill-current" /></button>
          <div className="relative flex h-[40px] min-w-0 max-w-[640px] flex-1 items-stretch border border-primary-foreground/60">
            <button onClick={() => setSearching((v) => !v)} aria-label="Search Axiom" className="grid w-[46px] shrink-0 place-items-center border-r border-primary-foreground/60 hover:bg-primary-foreground/10"><Search className="size-5" /></button>
            {searching ? (
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => { if (!q) setSearching(false); }} placeholder="Search people, classes and users" aria-label="Search people, classes and users" className="min-w-0 flex-1 bg-background px-3 text-[14px] text-foreground outline-none" />
            ) : (
              <div className="flex min-w-0 items-center gap-4 px-4 text-[20px] leading-none">
                {crumbs.length ? crumbs.map((c) => (c.to ? <Link key={c.label} to={c.to} className="shrink-0 font-semibold hover:underline">{c.label}</Link> : <span key={c.label} className="shrink-0 font-semibold">{c.label}</span>)) : <Link to="/admin" className="shrink-0 font-semibold hover:underline">System</Link>}
                <span className="truncate font-light">{title}</span>
              </div>)}
            {searching && results.length > 0 && (
              <ul className="absolute left-0 right-0 top-[42px] max-h-80 overflow-y-auto border border-vc-line bg-background text-[13px] text-foreground shadow-lg">
                {results.map((r, i) => <li key={i}><button onClick={() => { setQ(""); setSearching(false); r.go(); }} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-vc-panel"><span className="w-14 text-[10px] font-semibold uppercase text-muted-foreground">{r.kind}</span>{r.label}</button></li>)}
              </ul>)}
          </div>
          <div className="ml-auto flex items-center gap-2 text-[13px]">{actions}</div>
          <DropdownMenu>
            <Button variant="ghost" onClick={() => setChooser(true)} aria-label="Account menu" className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-foreground/25 p-0 text-[12px] outline-none"><PersonPhoto personId={user?.personId} className="size-8" /></Button>
            <DropdownMenuContent align="end" className="text-[13px]">
              <DropdownMenuLabel>{user?.first} {user?.last}<div className="text-xs font-normal text-muted-foreground">{user?.email} · Administrator</div></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); nav({ to: "/", replace: true }); }}><LogOut className="size-4" /> Log Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={() => setOpen(true)} aria-label="All homepages" title="Homepages" className="grid size-9 place-items-center hover:bg-primary-foreground/10"><LayoutGrid className="size-6" /></button>
        </div>
      </header>
      <main className="p-4">{children}</main>
      <PortalChooser open={chooser} onClose={() => setChooser(false)} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[300px] p-0 text-[13px]">
          <SheetHeader className="bg-ax-top px-4 py-3"><SheetTitle className="text-primary-foreground">Launchpad</SheetTitle></SheetHeader>
          <div className="px-2 py-2">
            <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Homepages</div>
            {AXIOM_LINKS.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-vc-panel"><Icon className="size-4 text-ax-top" />{label}</Link>)}
            <div className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Favorites</div>
            {([{ to: "/admin/users", l: "Add a User" }, { to: "/admin/settings", l: "Backgrounds & Colors" }] as const).map((f) => <Link key={f.l} to={f.to} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-vc-panel"><Star className="size-4 text-vc-tile-warm-fg" />{f.l}</Link>)}
            <div className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Portals</div>
            {([{ to: "/teacher", l: "Faculty Portal" }, { to: "/student", l: "Student Portal" }] as const).map((f) => <Link key={f.l} to={f.to} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-vc-panel"><Clock className="size-4 text-muted-foreground" />{f.l}</Link>)}
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
