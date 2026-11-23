import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen, CircleHelp, ClipboardList, FileText, History, LayoutGrid, Plus, Rocket, Search, Settings, Star, User } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ActionsMenu } from "@/components/admin/AdminTools";
import { AXIOM_LINKS } from "@/components/admin/axiom-links";
import { OrganizeMenu } from "@/components/admin/OrganizeMenu";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { PortalChooser } from "@/components/portal/PortalChooser";
import { Button } from "@/components/ui/button";
import { homepagesByGroup, SYSTEM_HOME, type Homepage } from "@/lib/admin-homepages";
import { useAdminWorkspace } from "@/lib/admin-workspace";
import { historyTag, isHomepagePath, searchAxiom, shortcutFor, SHORTCUTS, type Dest, type HitKind } from "@/lib/axiom-nav";
import { useRecordWindow } from "@/lib/record-window";
import { useSchool } from "@/lib/school-store";
import { SCHOOL } from "@/lib/sis-data";
import { useWorkspaces } from "@/lib/use-workspaces";
import { favoritesOf } from "@/lib/workspaces";

export type Crumb = { label: string; to?: "/admin/courses" | "/admin/classes" | "/admin/users" | "/admin/settings" };
type PanelId = "rocket" | "favorites" | "history" | "help";
const ICON: Record<HitKind, typeof Search> = { Homepage: LayoutGrid, Find: Search, Add: Plus, Report: FileText, Configuration: Settings, Person: User, Class: ClipboardList, Course: BookOpen };
const tool = "grid size-9 shrink-0 place-items-center rounded-none text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground";

/** The Axiom Launchpad: Rocket Ship (homepages), Favorites, the blue search bar with Actions and Organize, History, Workspaces and Help. */
export function Launchpad({ title, crumbs, actions, recordMenu }: { title: string; crumbs: Crumb[]; actions: ReactNode; recordMenu: ReactNode }) {
  const { user, logout, users, sections, courses } = useSchool();
  const nav = useNavigate();
  const openRecord = useRecordWindow();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const workspace = useAdminWorkspace(user?.id);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [searching, setSearching] = useState(false);
  const [chooser, setChooser] = useState(false);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const hits = useMemo(() => searchAxiom(q, { users, sections, courses }), [q, users, sections, courses]);
  useEffect(() => setAt(0), [q]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
      const key = shortcutFor(e, typing);
      if (key === "save") { const b = document.querySelector<HTMLElement>("[data-ax-update]"); if (b) { e.preventDefault(); b.click(); } return; }
      if (e.key === "Escape") { setPanel(null); return; }
      if (!key || document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      if (key === "search") setSearching(true); else setPanel(key);
    };
    document.addEventListener("keydown", on);
    return () => document.removeEventListener("keydown", on);
  }, []);
  const go = (d: Dest) => {
    setQ(""); setSearching(false); setPanel(null);
    if ("action" in d) { if (d.action === "new-course") openRecord("/admin/course/new"); else if (d.action === "new-class") openRecord("/admin/class/new"); else nav({ to: "/admin/users", search: { add: "user" } }); return; }
    nav({ to: d.to, ...(d.params ? { params: d.params } : {}), ...(d.search ? { search: d.search } : {}) } as never);
  };
  // The bar's first button is the homepage you came from: "home" while you drill into its links.
  const homeEntry = workspace.history.find((e) => isHomepagePath(e.path) && e.path.split("?")[0] !== pathname);
  const home = homeEntry ?? (isHomepagePath(pathname) ? undefined : { title: crumbs[0]?.label ?? "System", path: crumbs[0]?.to ?? SYSTEM_HOME.to });
  const toggle = (p: PanelId) => setPanel((cur) => (cur === p ? null : p));
  const on = (p: PanelId) => (panel === p ? "bg-primary-foreground/20" : "");
  return (
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
        <Button variant="ghost" size="icon" onClick={() => toggle("rocket")} aria-label="Homepages (Rocket Ship)" title="Homepages ( ` )" className={`${tool} ${on("rocket")}`}><Rocket className="size-6 fill-current" /></Button>
        <Button variant="ghost" size="icon" onClick={() => toggle("favorites")} aria-label="Favorites" title="Favorites ( ~ )" className={`${tool} ${on("favorites")}`}><Star className="size-6 fill-current" /></Button>
        <div role="search" onClick={() => setSearching(true)} className={`relative flex h-[36px] min-w-0 flex-1 cursor-text items-stretch border ${searching ? "border-background bg-background text-foreground" : "border-primary-foreground/60 bg-ax-search/40"}`}>
          <button type="button" onClick={(e) => { e.stopPropagation(); setSearching((v) => !v); }} aria-label="Search Axiom" className={`grid w-[46px] shrink-0 place-items-center border-r ${searching ? "border-vc-line hover:bg-vc-panel" : "border-primary-foreground/60 hover:bg-primary-foreground/10"}`}><Search className="size-5" /></button>
          {searching ? (
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => setTimeout(() => { setSearching(false); setQ(""); }, 150)} role="combobox" aria-expanded={hits.length > 0} aria-controls="axiom-suggestions"
              onKeyDown={(e) => { if (e.key === "Escape") { setQ(""); setSearching(false); } else if (e.key === "ArrowDown") { e.preventDefault(); setAt((i) => Math.min(i + 1, hits.length - 1)); } else if (e.key === "ArrowUp") { e.preventDefault(); setAt((i) => Math.max(i - 1, 0)); } else if (e.key === "Enter" && hits[at]) go(hits[at].dest); }}
              placeholder="Search homepages, links, people, classes and courses" aria-label="Search homepages, links, people, classes and courses" className="min-w-0 flex-1 bg-transparent px-3 text-[14px] text-foreground outline-none" />
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3 text-[14px] leading-none">
              {home && <a href={home.path} title={`Back to ${home.title}`} className="shrink-0 border-r border-primary-foreground/50 pr-2 font-semibold hover:underline">{home.title}</a>}
              <span className="truncate font-light" aria-current="page">{title}</span>
            </div>)}
          {searching && q.trim().length >= 2 && (
            <ul id="axiom-suggestions" role="listbox" className="absolute left-0 right-0 top-[38px] z-40 max-h-96 overflow-y-auto border border-vc-line bg-background text-[13px] text-foreground shadow-lg">
              {hits.map((h, i) => { const Icon = ICON[h.kind]; return <li key={`${h.kind}${h.label}${i}`} role="option" aria-selected={i === at}><button onMouseDown={(e) => e.preventDefault()} onClick={() => go(h.dest)} className={`flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-vc-panel ${i === at ? "bg-vc-tile" : ""}`}><Icon className="size-4 shrink-0 text-ax-top" /><span className="min-w-0 flex-1 truncate">{h.label}</span><span className="shrink-0 text-[11px] text-muted-foreground">{h.hint}</span></button></li>; })}
              {!hits.length && <li className="px-3 py-2 text-muted-foreground">Nothing matches. Try a name, a homepage or a link.</li>}
            </ul>)}
          <div className="flex shrink-0 items-stretch border-l border-primary-foreground/40">{recordMenu ?? <ActionsMenu />}<OrganizeMenu title={title} /></div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 text-[12px]">{actions}</div>
        <Button variant="ghost" size="icon" onClick={() => toggle("history")} aria-label="Recent history" title="History" className={`${tool} ${on("history")}`}><History className="size-5" /></Button>
        <Button asChild variant="ghost" size="icon" className={tool}><Link to="/admin/workspaces" aria-label="Workspaces" title="Workspaces"><LayoutGrid className="size-5" /></Link></Button>
        <Button variant="ghost" size="icon" onClick={() => toggle("help")} aria-label="Help" title="Help" className={`${tool} ${on("help")}`}><CircleHelp className="size-5" /></Button>
        <Button variant="ghost" onClick={() => setChooser(true)} aria-label="Account menu" className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-foreground/25 p-0 text-[12px] outline-none"><PersonPhoto personId={user?.personId} className="size-8" /></Button>
      </div>
      {panel && <div className="fixed inset-0 top-[76px] z-40" onClick={() => setPanel(null)}>
        <div role="dialog" aria-label={{ rocket: "Homepages", favorites: "Favorites", history: "History", help: "Help" }[panel]} onClick={(e) => e.stopPropagation()} className="absolute left-2 top-0 max-h-[78vh] w-[min(96vw,760px)] overflow-y-auto border border-vc-line bg-background text-[13px] text-foreground shadow-xl">
          {panel === "rocket" && <RocketPanel close={() => setPanel(null)} />}
          {panel === "favorites" && <FavoritesPanel legacy={workspace.favorites} />}
          {panel === "history" && <HistoryPanel entries={workspace.history} />}
          {panel === "help" && <HelpPanel />}
        </div>
      </div>}
      <PortalChooser open={chooser} onClose={() => setChooser(false)} />
    </header>
  );
}

const head = "bg-ax-head px-3 py-1.5 text-[11px] font-semibold uppercase";
export function HomepageAnchor({ h, className, onClick, children }: { h: Homepage; className?: string; onClick?: () => void; children: ReactNode }) {
  return h.id === "system" ? <Link to="/admin" className={className} onClick={onClick}>{children}</Link> : <Link to="/admin/home/$pageId" params={{ pageId: h.id }} className={className} onClick={onClick}>{children}</Link>;
}
function RocketPanel({ close }: { close: () => void }) {
  const row = "flex items-center gap-2.5 border-b border-vc-line px-3 py-2 hover:bg-vc-panel";
  return (
    <div>
      <h2 className="bg-ax-top px-3 py-2 text-[15px] font-semibold text-primary-foreground">Homepages</h2>
      <div className="grid sm:grid-cols-2">{homepagesByGroup().map((g) => <div key={g.group}><h3 className={head}>{g.group}</h3>{g.pages.map((h) => <HomepageAnchor key={h.id} h={h} className={row} onClick={close}><LayoutGrid className="size-4 text-ax-top" />{h.title}</HomepageAnchor>)}</div>)}</div>
      <h3 className={head}>Common Links</h3>
      <div className="grid sm:grid-cols-2">{AXIOM_LINKS.filter((l) => l.to !== "/admin").map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={close} className={row}><Icon className="size-4 text-ax-top" />{label}</Link>)}</div>
    </div>
  );
}
function FavoritesPanel({ legacy }: { legacy: { title: string; path: string }[] }) {
  const ws = useWorkspaces();
  const fav = favoritesOf(ws.all, ws.uid);
  const cats = [
    ...(legacy.length ? [{ id: "pages", group: "Personal", name: "Starred Pages", items: legacy.map((e) => ({ id: e.path, title: e.title, path: e.path })) }] : []),
    ...fav.personal.map((g) => ({ id: g.workspace.id, group: "Personal", name: g.workspace.name, items: g.items })),
    ...fav.shared.map((g) => ({ id: g.workspace.id, group: "Shared", name: g.workspace.name, items: g.items })),
  ];
  const [sel, setSel] = useState("");
  const cur = cats.find((c) => c.id === sel) ?? cats[0];
  if (!cats.length) return <div><h2 className="bg-ax-top px-3 py-2 text-[15px] font-semibold text-primary-foreground">Favorites</h2><p className="px-4 py-6 text-muted-foreground">No favorites yet. Use the + (Organize) button on any screen to save a bookmark, and set Display in Favorites to Yes.</p></div>;
  return (
    <div>
      <h2 className="bg-ax-top px-3 py-2 text-[15px] font-semibold text-primary-foreground">Favorites</h2>
      <div className="grid min-h-[180px] grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Favorite categories" className="border-r border-vc-line bg-ax-side">{["Personal", "Shared"].map((g) => cats.some((c) => c.group === g) && <div key={g}><h3 className={head}>{g}</h3>{cats.filter((c) => c.group === g).map((c) => <button key={c.id} type="button" onMouseEnter={() => setSel(c.id)} onClick={() => setSel(c.id)} className={`block w-full border-l-[4px] px-3 py-2 text-left ${cur?.id === c.id ? "border-vc-link bg-vc-tile font-semibold" : "border-transparent text-vc-link-strong hover:bg-vc-panel"}`}>{c.name}</button>)}</div>)}</nav>
        <ul aria-label="Favorite items">{cur?.items.map((i) => <li key={i.id}><a href={i.path} className="flex items-center gap-2 border-b border-vc-line px-3 py-2 text-vc-link-strong hover:bg-vc-panel"><Star className="size-4 fill-current text-vc-tile-warm-fg" />{i.title}</a></li>)}</ul>
      </div>
    </div>
  );
}
function HistoryPanel({ entries }: { entries: { title: string; path: string }[] }) {
  return (
    <div>
      <h2 className="bg-ax-top px-3 py-2 text-[15px] font-semibold text-primary-foreground">History <span className="font-normal opacity-80">· latest {Math.min(entries.length, 25)} screens</span></h2>
      {entries.map((e) => <a key={e.path} href={e.path} className="flex items-center gap-3 border-b border-vc-line px-3 py-2 text-vc-link-strong hover:bg-vc-panel"><span className="w-[84px] shrink-0 rounded-sm bg-vc-panel px-1.5 py-0.5 text-center text-[11px] font-semibold uppercase text-vc-gray-dark">{historyTag(e.path)}</span>{e.title}</a>)}
      {!entries.length && <p className="px-4 py-6 text-muted-foreground">No recent screens.</p>}
    </div>
  );
}
function HelpPanel() {
  return (
    <div>
      <h2 className="bg-ax-top px-3 py-2 text-[15px] font-semibold text-primary-foreground">Help</h2>
      <h3 className={head}>Keyboard shortcuts</h3>
      <table className="w-full"><tbody>{SHORTCUTS.map((s) => <tr key={s.keys} className="border-b border-vc-line"><th scope="row" className="w-[170px] px-3 py-2 text-left font-mono font-semibold">{s.keys}</th><td className="px-3 py-2">{s.does}</td></tr>)}</tbody></table>
      <p className="px-3 py-3 text-vc-gray">Veracross documentation: <a href="https://community.veracross.com" target="_blank" rel="noopener noreferrer" className="text-vc-link-strong underline">community.veracross.com</a></p>
    </div>
  );
}
