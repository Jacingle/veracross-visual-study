import { PersonPhoto } from "@/components/common/PersonPhoto";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, ChevronRight, ClipboardList, FileText, History, Plus, ChevronDown, Clock, Rocket, Home, LayoutGrid, LogOut, Mail, Palette, Receipt, Search, Star, Users } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ActionsMenu, AddMenu } from "@/components/admin/AdminTools";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SCHOOL, STUDENTS, TEACHERS, courseTitle } from "@/lib/sis-data";
import { HOMEPAGES, SYSTEM_HOME, pageHits } from "@/lib/admin-homepages";
import { useRecordWindow } from "@/lib/record-window";
import { useSchool } from "@/lib/school-store";
import { PortalChooser } from '@/components/portal/PortalChooser';
import { useAdminWorkspace } from "@/lib/admin-workspace";
import { Button } from '@/components/ui/button';

type Crumb = { label: string; to?: "/admin/courses" | "/admin/classes" | "/admin/users" | "/admin/settings" };

export const AXIOM_LINKS = [
  { to: "/admin", label: "System Administrator Homepage", icon: Home },
  { to: "/admin/queries", label: "Queries & Records", icon: Search },
  { to: "/admin/users", label: "Users & Security", icon: Users },
  { to: "/admin/courses", label: "Courses & Enrollment", icon: BookOpen },
  { to: "/admin/classes", label: "Classes", icon: ClipboardList },
  { to: "/admin/settings", label: "Portal Settings", icon: Palette },
  { to: "/admin/assignment-types", label: "Class Assignment Types", icon: Palette },
  { to: "/admin/portals", label: "Portals", icon: LayoutGrid },
  { to: "/admin/report-layouts", label: "Report Card Layouts", icon: FileText },
  { to: "/admin/terms", label: "School Years & Terms", icon: Clock },
  { to: "/admin/scheduling", label: "Scheduling Sets", icon: Clock },
  { to: "/admin/messages", label: "Communications", icon: Mail },
  { to: "/admin/purchases", label: "Purchase Approvals", icon: Receipt },
] as const;

/** Axiom (admin) frame: Launchpad, global search, breadcrumb bar, grey workspace. */
export function AxiomShell({ title, crumbs = [], actions, compactRail = false, side, onUpdate, recordMenu, children }: { title: string; crumbs?: Crumb[]; actions?: ReactNode; /** Replaces the lightning-bolt menu on a record screen (Save to Workspace, Copy Record, Delete). */ recordMenu?: ReactNode; compactRail?: boolean; /** Left section menu for detail screens. */ side?: ReactNode; /** Shows the green UPDATE button in the toolbar. */ onUpdate?: (() => void) | undefined; children: ReactNode }) {
  const bar = <>{actions}{onUpdate && <button type="button" onClick={onUpdate} className="h-[30px] rounded-[3px] bg-ax-save px-5 text-[13px] font-bold tracking-wide text-primary-foreground active:brightness-90">UPDATE</button>}</>;
  return <RoleGate area="admin"><Frame title={title} crumbs={crumbs} actions={bar} compactRail={compactRail} recordMenu={recordMenu}>{side ? <div className="flex bg-background">{side}<main className="min-w-0 flex-1">{children}</main></div> : children}</Frame></RoleGate>;
}

function Frame({ title, crumbs, actions, compactRail, recordMenu, children }: { title: string; crumbs: Crumb[]; actions: ReactNode; compactRail: boolean; recordMenu: ReactNode; children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, logout, users, sections, courses } = useSchool();
  const nav = useNavigate();
  const openRecord = useRecordWindow();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"homepages" | "favorites" | "history">("homepages");
  const workspace = useAdminWorkspace(user?.id);
  const path = useRouterState({ select: (r) => r.location.href });
  useEffect(() => { if (workspace.ready && path) workspace.visit({ title, path }); }, [title, path, workspace.ready]);
  const [chooser, setChooser] = useState(false);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return [
      ...pageHits(t).map((p) => ({ kind: p.kind, label: p.label, go: () => {
        const h = p.hit;
        if ("homepage" in h) nav({ to: "/admin/home/$pageId", params: { pageId: h.homepage } });
        else if ("action" in h) { if (h.action === "new-course") openRecord("/admin/course/new"); else if (h.action === "new-class") openRecord("/admin/class/new"); else nav({ to: "/admin/users", search: { add: "user" } }); }
        else nav({ to: h.to, search: (h.search ?? {}) as never });
      } })),
      ...AXIOM_LINKS.filter((l) => l.label.toLowerCase().includes(t) && !pageHits(t).some((p) => p.label === l.label)).map((l) => ({ kind: "Page", label: l.label, go: () => nav({ to: l.to }) })),
      ...courses.filter((c) => `${c.id} ${c.name}`.toLowerCase().includes(t)).slice(0, 4).map((c) => ({ kind: "Course", label: `${c.name} (${c.id})`, go: () => nav({ to: "/admin/course/$courseNo", params: { courseNo: c.id } }) })),
      ...sections.filter((c) => courseTitle(c).toLowerCase().includes(t) || c.id.includes(t)).slice(0, 5).map((c) => ({ kind: "Class", label: courseTitle(c), go: () => nav({ to: "/admin/courses/$courseId", params: { courseId: c.id } }) })),
      ...users.filter((u) => `${u.first} ${u.last} ${u.email}`.toLowerCase().includes(t)).slice(0, 4).map((u) => ({ kind: "User", label: `${u.first} ${u.last} (${u.email})`, go: () => nav({ to: "/admin/users", search: { q: u.email } }) })),
      ...TEACHERS.filter((x) => `${x.first} ${x.last}`.toLowerCase().includes(t)).slice(0, 4).map((x) => ({ kind: "Faculty", label: `${x.prefix} ${x.first} ${x.last}`, go: () => nav({ to: "/directories", search: { type: "faculty", last: x.last } }) })),
      ...STUDENTS.filter((x) => `${x.first} ${x.last}`.toLowerCase().includes(t)).slice(0, 5).map((x) => ({ kind: "Student", label: `${x.first} ${x.last} · Grade ${x.grade}`, go: () => nav({ to: "/directories", search: { type: "students", first: x.first, last: x.last } }) })),
    ];
  }, [q, users, sections, courses, nav, openRecord]);
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
        <div className="flex min-h-[46px] flex-wrap items-center gap-1 bg-ax-bar px-2 py-1 text-primary-foreground shadow-sm sm:flex-nowrap">
          <Button variant="ghost" size="icon" onClick={() => { setMode("homepages"); setOpen(true); }} aria-label="Open Launchpad" title="Launchpad" className="size-9 shrink-0 rounded-none text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Rocket className="size-6 fill-current" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { setMode("favorites"); setOpen(true); }} aria-label="Favorites" title="Favorites" className="size-9 shrink-0 rounded-none text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Star className="size-6 fill-current" /></Button>
          <div role="search" onClick={() => setSearching(true)} className={`relative flex h-[34px] min-w-0 flex-1 cursor-text items-stretch border ${searching ? "border-background bg-background text-foreground" : "border-primary-foreground/60"}`}>
            <button type="button" onClick={(e) => { e.stopPropagation(); setSearching((v) => !v); }} aria-label="Search Axiom" className={`grid w-[46px] shrink-0 place-items-center border-r ${searching ? "border-vc-line hover:bg-vc-panel" : "border-primary-foreground/60 hover:bg-primary-foreground/10"}`}><Search className="size-5" /></button>
            {searching ? (
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => setTimeout(() => { setSearching(false); setQ(""); }, 150)}
                onKeyDown={(e) => { if (e.key === "Escape") { setQ(""); setSearching(false); } else if (e.key === "Enter" && results[0]) { const r = results[0]; setQ(""); setSearching(false); r.go(); } }}
                placeholder="Search pages, courses, classes and people" aria-label="Search pages, courses, classes and people" className="min-w-0 flex-1 bg-transparent px-3 text-[14px] text-foreground outline-none" />
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-2 px-3 text-[14px] leading-none">
                {crumbs.length ? crumbs.map((c) => <span key={c.label} className="truncate font-semibold">{c.label}</span>) : <span className="truncate font-semibold">System</span>}
                <span className="truncate font-light">{title}</span>
              </div>)}
            {searching && q.trim().length >= 2 && (
              <ul className="absolute left-0 right-0 top-[36px] z-40 max-h-80 overflow-y-auto border border-vc-line bg-background text-[13px] text-foreground shadow-lg">
                {results.map((r, i) => <li key={i}><button onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(""); setSearching(false); r.go(); }} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-vc-panel"><span className="w-[72px] shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">{r.kind}</span>{r.label}</button></li>)}
                {!results.length && <li className="px-3 py-2 text-muted-foreground">No pages, records or people match.</li>}
              </ul>)}
          </div>
          <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2 text-[12px]">{actions}</div>
          <div className="flex shrink-0 items-stretch border border-primary-foreground/40">{recordMenu ?? <ActionsMenu />}<AddMenu /></div>
          <DropdownMenu>
            <Button variant="ghost" onClick={() => setChooser(true)} aria-label="Account menu" className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-foreground/25 p-0 text-[12px] outline-none"><PersonPhoto personId={user?.personId} className="size-8" /></Button>
            <DropdownMenuContent align="end" className="text-[13px]">
              <DropdownMenuLabel>{user?.first} {user?.last}<div className="text-xs font-normal text-muted-foreground">{user?.email} · Administrator</div></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); nav({ to: "/", replace: true }); }}><LogOut className="size-4" /> Log Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={() => { setMode("history"); setOpen(true); }} aria-label="Recent history" title="Recent history" className="size-8 shrink-0 rounded-none text-primary-foreground"><History className="size-5" /></Button>
        </div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-vc-line bg-background px-4 py-2"><h1 className="text-[18px] font-normal text-ax-top">{title}</h1><div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Favorite this page" title="Favorite this page" className="size-7" onClick={() => workspace.toggleFavorite({ title, path })}><Star className={`size-4 ${workspace.favorites.some((f) => f.path === path) ? 'fill-current text-vc-tile-warm-fg' : 'text-vc-gray'}`} /></Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-7 text-[12px]">Related Pages<ChevronDown className="size-3" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{AXIOM_LINKS.map((l) => <DropdownMenuItem key={l.to} asChild><Link to={l.to}>{l.label}</Link></DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></div></div>
      <div className="flex items-center gap-1.5 border-b border-vc-line bg-background px-4 py-1.5 text-[13px]">
        <button onClick={() => window.history.back()} aria-label="Back" title="Back" className="mr-1 grid size-7 place-items-center text-vc-link-strong hover:bg-vc-panel"><ArrowLeft className="size-4" /></button>
        <Link to="/admin" className="text-vc-link-strong hover:underline">System</Link>
        {crumbs.map((c) => <span key={c.label} className="flex items-center gap-1.5"><ChevronRight className="size-3.5 text-muted-foreground" />{c.to ? <Link to={c.to} className="text-vc-link-strong hover:underline">{c.label}</Link> : c.label}</span>)}
        {title !== "System Administrator Homepage" && <span className="flex items-center gap-1.5"><ChevronRight className="size-3.5 text-muted-foreground" /><b className="font-semibold">{title}</b></span>}
      </div>
      <div className="flex">
        <nav aria-label="Administration" className={`sticky top-[86px] hidden h-[calc(100vh-86px)] shrink-0 self-start overflow-y-auto border-r border-vc-line bg-background py-2 xl:block ${compactRail ? "w-[52px]" : "w-[190px]"}`}>
          {AXIOM_LINKS.map(({ to, label, icon: Icon }) => { const on = to === "/admin" ? pathname === "/admin" || pathname === "/admin/" : pathname.startsWith(to); return (
            <Link key={to} to={to} title={label} aria-current={on ? "page" : undefined} className={`flex items-center gap-2.5 border-l-[4px] px-3 py-2.5 text-[14px] ${on ? "border-vc-link bg-vc-tile font-semibold text-foreground" : "border-transparent text-vc-link-strong hover:bg-vc-panel"}`}><Icon className="size-[18px] shrink-0" />{!compactRail && <span className="truncate">{label}</span>}</Link>); })}
        </nav>
        <main className="min-w-0 flex-1 p-3 sm:p-4">{children}</main>
      </div>
      <PortalChooser open={chooser} onClose={() => setChooser(false)} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[300px] p-0 text-[13px]">
          <SheetHeader className="bg-ax-top px-4 py-3"><SheetTitle className="text-primary-foreground">{mode === "homepages" ? "Homepages" : mode === "favorites" ? "Favorites" : "Recent History"}</SheetTitle></SheetHeader>
          <div className="px-2 py-2">{mode === 'homepages' && <div><h3 className="bg-ax-head px-2 py-1.5 text-[11px] font-semibold uppercase">Homepages</h3>
            <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5 border-b border-vc-line px-2 py-2 hover:bg-vc-panel"><Home className="size-4 text-ax-top" />{SYSTEM_HOME.title}</Link>
            {HOMEPAGES.map((h) => <Link key={h.id} to="/admin/home/$pageId" params={{ pageId: h.id }} onClick={() => setOpen(false)} className="flex items-center gap-2.5 border-b border-vc-line px-2 py-2 hover:bg-vc-panel"><LayoutGrid className="size-4 text-ax-top" />{h.title}</Link>)}</div>}
          {mode === 'homepages' ? ['System', 'Academics', 'People & Communications'].map((group) => <div key={group}><h3 className="bg-ax-head px-2 py-1.5 text-[11px] font-semibold uppercase">{group === 'System' ? 'System pages' : group === 'Academics' ? 'Academics pages' : 'People & Communications pages'}</h3>{AXIOM_LINKS.filter((l) => (['/admin/courses', '/admin/classes', '/admin/terms', '/admin/scheduling', '/admin/assignment-types', '/admin/report-layouts'] as readonly string[]).includes(l.to) ? group === 'Academics' : (['/admin/users', '/admin/messages', '/admin/purchases'] as readonly string[]).includes(l.to) ? group === 'People & Communications' : group === 'System').map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-2.5 border-b border-vc-line px-2 py-2 hover:bg-vc-panel"><Icon className="size-4 text-ax-top" />{label}</Link>)}</div>) : <>{(mode === 'favorites' ? workspace.favorites : workspace.history).map((entry) => <a key={entry.path} href={entry.path} className="block border-b border-vc-line px-2 py-3 text-vc-link-strong hover:bg-vc-panel">{entry.title}</a>)}{!(mode === 'favorites' ? workspace.favorites : workspace.history).length && <p className="p-3 text-muted-foreground">No {mode === 'favorites' ? 'favorites' : 'recent pages'}.</p>}</>}</div>
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
