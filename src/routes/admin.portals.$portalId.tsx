import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AxField, AxGroup, AxScreenTitle, AxSideMenu, AxToggle, axInput, axSelect, axTd, axTh, type AxMenuGroup } from "@/components/admin/ax";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { ITEM_TYPES, NAV_TYPES, screenCounts, sortedItems, sortedNav, type NavCategory, type NavItem, type PortalRec } from "@/lib/axiom";
import { pageHead } from "@/lib/head";
import { useSchool } from "@/lib/school-store";

const TABS = ["general", "navigation", "category", "configuration", "directories", "components", "content", "enabled", "manual", "mismatch", "disabled", "admins"] as const;
type Tab = (typeof TABS)[number];
export const Route = createFileRoute("/admin/portals/$portalId")({
  validateSearch: z.object({ tab: z.enum(TABS).optional(), cat: z.string().optional() }),
  head: ({ params }) => pageHead(`Axiom · Portal ${params.portalId}`, "Portal detail: general settings, navigation menus, screens, members and admins."),
  component: PortalPage,
});

const MENU: AxMenuGroup[] = [
  { title: "All", items: [{ id: "general", label: "General" }, { id: "navigation", label: "Navigation" }, { id: "configuration", label: "Configuration" }, { id: "directories", label: "Directories" }] },
  { title: "Screens", items: [{ id: "components", label: "Component Screens" }, { id: "content", label: "Content Screens" }] },
  { title: "Members", items: [{ id: "enabled", label: "Enabled" }, { id: "manual", label: "Manually Added" }, { id: "mismatch", label: "Strategy Mismatch" }, { id: "disabled", label: "Disabled" }] },
  { title: "Permissions", items: [{ id: "admins", label: "Admins" }] },
];
const FALLBACK = { student: ["#0f2b4f", "#1b4373"], teacher: ["#215a2c", "#2f7a3c"] } as const;
const uid = () => crypto.randomUUID().slice(0, 8);
const isHttps = (v: string) => /^https:\/\/\S+\.\S+/.test(v);
const ColorBox = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="flex"><input aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={axInput} /><input type="color" aria-label={`${label} picker`} value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#3693d8"} onChange={(e) => onChange(e.target.value)} className="h-7 w-10 shrink-0 cursor-pointer border border-l-0 border-vc-line p-0.5" /></div>
);

function PortalPage() {
  const { portalId } = Route.useParams();
  const { portals } = useSchool();
  const p = portals.find((x) => x.id === portalId);
  if (!p) return <AxiomShell title="Portal not found" crumbs={[]}><p className="p-4">No portal with ID {portalId}. <Link to="/admin" className="text-vc-link-strong">Back to Portal Admin</Link></p></AxiomShell>;
  return <Detail key={p.id} p={p} />;
}

function Detail({ p }: { p: PortalRec }) {
  const { tab = "general", cat } = Route.useSearch();
  const nav = useNavigate({ from: Route.fullPath });
  const { update, settings, users, user } = useSchool();
  const theme = settings[p.role];
  const fb = FALLBACK[p.role];
  const [d, setD] = useState<PortalRec>(p);
  const [banner, setBanner] = useState(/^https?:/.test(theme.bg) ? theme.bg : "");
  const [navColor, setNavColor] = useState(theme.navbar || fb[1]);
  const [topColor, setTopColor] = useState(theme.topbar || fb[0]);
  const [fullscreen, setFullscreen] = useState(theme.fullscreen !== false);
  const go = (t: Tab, c?: string) => void nav({ search: c ? { tab: t, cat: c } : { tab: t } });
  const save = () => {
    if (banner && !isHttps(banner)) { toast.error("Banner Image URL must be a full https:// address"); return; }
    if (!/^#[0-9a-f]{6}$/i.test(navColor) || !/^#[0-9a-f]{6}$/i.test(topColor)) { toast.error("Colors must be hex codes like #3693D8"); return; }
    const bg = banner ? banner : /^https?:/.test(theme.bg) ? "none" : theme.bg;
    update((s) => ({ ...s, portals: s.portals.map((x) => (x.id === d.id ? { ...d, modified: new Date().toISOString(), modifiedBy: user?.email.split("@")[0] ?? "admin" } : x)), settings: { ...s.settings, [d.role]: { ...s.settings[d.role], bg, navbar: navColor, topbar: topColor, fullscreen } } }));
    toast.success(`Portal "${d.description}" updated`);
  };
  const modified = `Last Modified: ${format(parseISO(p.modified), "EEE, MMM d, yyyy 'at' h:mmaaa")} by @${p.modifiedBy}`;
  const category = d.nav.find((c) => c.id === cat);
  const side = <AxSideMenu groups={MENU} active={tab === "category" ? "navigation" : tab} onSelect={(id) => go(id as Tab)} />;
  const setNav = (nv: NavCategory[]) => setD({ ...d, nav: nv });
  const memberRows = users.filter((u) => u.role === p.role);
  return (
    <AxiomShell title={`Portal: ${d.description}`} crumbs={[]} side={side} onUpdate={save}>
      <AxScreenTitle title={tab === "category" ? "General" : MENU.flatMap((g) => g.items).find((i) => i.id === tab)?.label ?? "General"} modified={modified} />
      {tab === "general" && (
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr_330px]">
          <div className="space-y-5">
            <AxGroup title="General">
              <AxField label="Description"><input aria-label="Description" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} className={axInput} maxLength={80} /></AxField>
              <AxField label="Access Name"><input aria-label="Access Name" value={d.access} disabled className={axInput} /></AxField>
              <AxField label="Status"><select aria-label="Status" value={d.status} onChange={(e) => setD({ ...d, status: e.target.value as PortalRec["status"] })} className={axSelect}><option>Draft</option><option>Published</option></select></AxField>
              <AxField label="Sort Key"><input aria-label="Sort Key" inputMode="numeric" value={d.sort} onChange={(e) => setD({ ...d, sort: Number(e.target.value.replace(/\D/g, "")) || 0 })} className={`${axInput} text-right`} /></AxField>
            </AxGroup>
            <AxGroup title="Home Screen">
              <AxField label="Home Screen"><select aria-label="Home Screen" value={d.homeScreen} onChange={(e) => setD({ ...d, homeScreen: e.target.value })} className={axSelect}>{d.screens.map((s) => <option key={s.id}>{s.description}</option>)}</select></AxField>
              <AxField label="View Home Screen">{(() => { const h = d.screens.find((s) => s.description === d.homeScreen); return h ? <Link to={h.to as "/student"} className="text-vc-link-strong">View...</Link> : <span className="text-muted-foreground">-</span>; })()}</AxField>
            </AxGroup>
          </div>
          <div className="space-y-5">
            <AxGroup title="Design">
              <AxField label="Banner Image URL"><input aria-label="Banner Image URL" value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="https://…" className={axInput} /></AxField>
              <AxField label="Fullscreen Background"><AxToggle label="Fullscreen Background" checked={fullscreen} onChange={setFullscreen} /></AxField>
              <AxField label="Navigation Bar Color"><ColorBox label="Navigation Bar Color" value={navColor} onChange={setNavColor} /></AxField>
              <AxField label="Top Bar Color"><ColorBox label="Top Bar Color" value={topColor} onChange={setTopColor} /></AxField>
            </AxGroup>
            <AxGroup title="Membership">
              <AxField label="Membership Strategy"><select aria-label="Membership Strategy" value={d.membership} disabled className={axSelect}><option>Security Roles</option><option>Manually Added</option></select></AxField>
              <AxField label="Status Default"><select aria-label="Status Default" value={d.statusDefault} onChange={(e) => setD({ ...d, statusDefault: e.target.value as PortalRec["statusDefault"] })} className={axSelect}><option>Default - Enabled</option><option>Default - Disabled</option></select></AxField>
              <AxField label="Portal Type"><select aria-label="Portal Type" value={d.role} disabled className={axSelect}><option value="student">Student</option><option value="teacher">Teacher</option></select></AxField>
            </AxGroup>
          </div>
          <AxGroup title="Stats">
            {([["Content Screens", screenCounts(d).content], ["Component Screens", screenCounts(d).component], ["Total Screens", d.screens.length]] as const).map(([l, n]) => <AxField key={l} label={l}><div className="h-7 bg-ax-side px-2 text-right leading-7">{n || ""}</div></AxField>)}
          </AxGroup>
        </div>)}
      {tab === "navigation" && (
        <div>
          <div className="flex items-center justify-between border-b border-vc-line bg-ax-side px-5 py-3"><button onClick={() => { const c: NavCategory = { id: `n-${uid()}`, description: "New Menu", icon: "", type: "One Column", sort: d.nav.length + 1, items: [] }; setNav([...d.nav, c]); }} className="h-8 rounded-[3px] bg-ax-save px-4 text-[14px] text-primary-foreground">Add Record</button></div>
          <table className="w-full border-collapse text-[14px]"><thead><tr><th className={`${axTh} w-8`} /><th className={axTh}>Description</th><th className={axTh}>Type</th><th className={`${axTh} text-right`}>Sort Key</th><th className={`${axTh} w-12`} /><th className={`${axTh} w-12`} /></tr></thead>
            <tbody>{sortedNav(d.nav).map((c) => (
              <tr key={c.id}><td className={`${axTd} bg-ax-head`} />
                <td className={axTd}><button onClick={() => go("category", c.id)} className="border-b-2 border-vc-link/40 text-vc-link-strong">{c.description}</button></td>
                <td className={axTd}><select aria-label={`Type for ${c.description}`} value={c.type} onChange={(e) => setNav(d.nav.map((x) => (x.id === c.id ? { ...x, type: e.target.value as NavCategory["type"] } : x)))} className="h-7 w-full bg-transparent">{NAV_TYPES.map((t) => <option key={t}>{t}</option>)}</select></td>
                <td className={axTd}><input aria-label={`Sort key for ${c.description}`} inputMode="numeric" value={c.sort} onChange={(e) => setNav(d.nav.map((x) => (x.id === c.id ? { ...x, sort: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))} className="h-7 w-full bg-transparent text-right" /></td>
                <td className={`${axTd} text-center`}><button aria-label={`Open ${c.description}`} onClick={() => go("category", c.id)} className="text-vc-link-strong"><ExternalLink className="size-4" /></button></td>
                <td className={`${axTd} text-center`}><button aria-label={`Delete ${c.description}`} onClick={() => setNav(d.nav.filter((x) => x.id !== c.id))} className="text-destructive"><X className="size-4" strokeWidth={3} /></button></td></tr>))}
              {!d.nav.length && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No menus yet. Click Add Record.</td></tr>}</tbody></table>
          <p className="px-5 py-3 text-[12px] text-muted-foreground">Changes here are saved with UPDATE in the toolbar.</p>
        </div>)}
      {tab === "category" && (category
        ? <CategoryEditor key={category.id} portal={d} c={category} onChange={(c) => setNav(d.nav.map((x) => (x.id === c.id ? c : x)))} back={() => go("navigation")} />
        : <p className="p-5">Menu not found. <button onClick={() => go("navigation")} className="text-vc-link-strong">Back to Navigation</button></p>)}
      {tab === "configuration" && (
        <div className="max-w-[640px] space-y-5 p-5">
          <AxGroup title="Summary"><AxField label="Access Path"><span>{d.screens.find((s) => s.description === d.homeScreen)?.to ?? "-"}</span></AxField><AxField label="Menus"><span>{d.nav.length} navigation menus, {d.nav.reduce((n, c) => n + c.items.length, 0)} items</span></AxField><AxField label="Appearance"><span>Edited on the General tab; the portal picks it up right after UPDATE.</span></AxField></AxGroup>
        </div>)}
      {tab === "directories" && (
        <div className="space-y-2 p-5 text-[14px]">
          <div><Link to="/directories" className="text-vc-link-strong hover:underline">Student Directory Type</Link></div>
          <div><Link to="/directories" className="text-vc-link-strong hover:underline">Faculty & Staff Directory Type</Link></div></div>)}
      {(tab === "components" || tab === "content") && (
        <table className="w-full border-collapse text-[14px]"><thead><tr><th className={axTh}>Description</th><th className={axTh}>Access Name</th><th className={axTh}>Edit</th><th className={axTh}>View Screen</th><th className={axTh}>Notes</th><th className={`${axTh} w-28`}>Published</th><th className={`${axTh} text-right`}>Update Date</th></tr></thead>
          <tbody>{d.screens.filter((s) => s.kind === (tab === "components" ? "Component" : "Content")).map((s) => (
            <tr key={s.id} className={s.published ? "" : "bg-ax-unpub"}><td className={axTd}>{s.description}</td><td className={axTd}>{s.access}</td>
              <td className={axTd}><Link to="/admin/portals/$portalId" params={{ portalId: p.id }} search={{ tab: "navigation" }} className="text-vc-link-strong">Edit...</Link></td>
              <td className={axTd}><Link to={s.to as "/student"} className="text-vc-link-strong">View...</Link></td>
              <td className={axTd}><input aria-label={`Notes for ${s.description}`} value={s.notes} onChange={(e) => setD({ ...d, screens: d.screens.map((x) => (x.id === s.id ? { ...x, notes: e.target.value } : x)) })} className="h-7 w-full bg-transparent" /></td>
              <td className={axTd}><AxToggle label={`Published ${s.description}`} checked={s.published} onChange={(v) => setD({ ...d, screens: d.screens.map((x) => (x.id === s.id ? { ...x, published: v } : x)) })} /></td>
              <td className={`${axTd} text-right`}>{format(parseISO(s.edited), "MM/dd/yy")}</td></tr>))}
            {!d.screens.some((s) => s.kind === (tab === "components" ? "Component" : "Content")) && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No {tab === "components" ? "component" : "content"} screens.</td></tr>}</tbody></table>)}
      {(tab === "enabled" || tab === "disabled") && (
        <table className="w-full border-collapse text-[14px]"><thead><tr><th className={axTh}>Name</th><th className={axTh}>Username / Email</th><th className={axTh}>Status</th></tr></thead>
          <tbody>{memberRows.filter((u) => (tab === "enabled" ? u.active : !u.active)).map((u) => <tr key={u.id}><td className={axTd}>{u.last}, {u.first}</td><td className={axTd}>{u.email}</td><td className={axTd}>{u.active ? "Enabled" : "Disabled"}</td></tr>)}
            {!memberRows.some((u) => (tab === "enabled" ? u.active : !u.active)) && <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">No {tab} members.</td></tr>}</tbody></table>)}
      {(tab === "manual" || tab === "mismatch") && <p className="p-5 text-[14px] text-muted-foreground">{tab === "manual" ? "No one has been added to this portal by hand. Members come from their security role." : "No members differ from the membership strategy."}</p>}
      {tab === "admins" && (
        <table className="w-full border-collapse text-[14px]"><thead><tr><th className={axTh}>Name</th><th className={axTh}>Email</th><th className={axTh}>Role</th></tr></thead>
          <tbody>{users.filter((u) => u.role === "admin").map((u) => <tr key={u.id}><td className={axTd}>{u.last}, {u.first}</td><td className={axTd}>{u.email}</td><td className={axTd}>Portal Admin</td></tr>)}</tbody></table>)}
    </AxiomShell>
  );
}

function CategoryEditor({ portal, c, onChange, back }: { portal: PortalRec; c: NavCategory; onChange: (c: NavCategory) => void; back: () => void }) {
  const setItem = (id: string, patch: Partial<NavItem>) => onChange({ ...c, items: c.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  return (
    <div>
      <div className="flex items-start gap-3 border-b border-vc-line bg-vc-note px-4 py-2 text-[13px]">ⓘ Navigation items can be displayed in a variety of layouts and include icons to give users more context.</div>
      <div className="grid gap-8 p-5 lg:grid-cols-[320px_320px]">
        <div className="space-y-2.5">
          <AxField label="Portal"><div className="flex"><input aria-label="Portal" value={portal.description} disabled className={axInput} /><button onClick={back} aria-label="Back to Navigation" className="grid w-9 place-items-center border border-l-0 border-vc-line text-vc-link-strong"><ExternalLink className="size-4" /></button></div></AxField>
          <AxField label="Description"><input aria-label="Menu description" value={c.description} onChange={(e) => onChange({ ...c, description: e.target.value })} className={axInput} /></AxField>
          <AxField label="Icon"><input aria-label="Icon" value={c.icon} onChange={(e) => onChange({ ...c, icon: e.target.value })} className={axInput} placeholder="files_paper" /></AxField>
          <AxField label="Type"><select aria-label="Menu type" value={c.type} onChange={(e) => onChange({ ...c, type: e.target.value as NavCategory["type"] })} className={axSelect}>{NAV_TYPES.map((t) => <option key={t}>{t}</option>)}</select></AxField>
        </div>
        <div className="space-y-2.5"><AxField label="Sort Key"><input aria-label="Menu sort key" inputMode="numeric" value={c.sort} onChange={(e) => onChange({ ...c, sort: Number(e.target.value.replace(/\D/g, "")) || 0 })} className={`${axInput} text-right`} /></AxField></div>
      </div>
      <div className="border-y border-vc-line bg-ax-side px-5 py-3"><button onClick={() => onChange({ ...c, items: [...c.items, { id: `i-${uid()}`, description: "", type: "Screen", icon: "", column: 0, sort: c.items.length + 1, screen: portal.screens[0]?.description ?? "", url: "" }] })} className="h-8 rounded-[3px] bg-ax-save px-4 text-[14px] text-primary-foreground">Add Record</button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[820px] border-collapse text-[14px]"><thead><tr><th className={axTh}>Description</th><th className={axTh}>Navigation Type</th><th className={axTh}>Icon</th><th className={`${axTh} text-right`}>Column Number</th><th className={`${axTh} text-right`}>Sort Key</th><th className={axTh}>Portal Screen</th><th className={axTh}>External Url</th><th className={`${axTh} w-12`} /></tr></thead>
        <tbody>{sortedItems(c).map((i) => (
          <tr key={i.id}>
            <td className={axTd}><input aria-label="Item description" value={i.description} onChange={(e) => setItem(i.id, { description: e.target.value })} className="h-7 w-full bg-transparent" /></td>
            <td className={axTd}><select aria-label="Navigation type" value={i.type} onChange={(e) => setItem(i.id, { type: e.target.value as NavItem["type"] })} className="h-7 w-full bg-transparent">{ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}</select></td>
            <td className={axTd}><input aria-label="Item icon" value={i.icon} onChange={(e) => setItem(i.id, { icon: e.target.value })} className="h-7 w-full bg-transparent" /></td>
            <td className={axTd}><input aria-label="Column number" inputMode="numeric" value={i.column} onChange={(e) => setItem(i.id, { column: Number(e.target.value.replace(/\D/g, "")) || 0 })} className="h-7 w-full bg-transparent text-right" /></td>
            <td className={axTd}><input aria-label="Item sort key" inputMode="numeric" value={i.sort} onChange={(e) => setItem(i.id, { sort: Number(e.target.value.replace(/\D/g, "")) || 0 })} className="h-7 w-full bg-transparent text-right" /></td>
            <td className={axTd}><select aria-label="Portal screen" value={i.screen} disabled={i.type !== "Screen"} onChange={(e) => setItem(i.id, { screen: e.target.value })} className="h-7 w-full bg-transparent"><option value="" />{portal.screens.map((s) => <option key={s.id}>{s.description}</option>)}</select></td>
            <td className={axTd}><input aria-label="External URL" value={i.url} disabled={i.type !== "External URL"} onChange={(e) => setItem(i.id, { url: e.target.value })} className="h-7 w-full bg-transparent" /></td>
            <td className={`${axTd} text-center`}><button aria-label={`Delete ${i.description || "item"}`} onClick={() => onChange({ ...c, items: c.items.filter((x) => x.id !== i.id) })} className="text-destructive"><X className="size-4" strokeWidth={3} /></button></td></tr>))}
          {!c.items.length && <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">No items. Click Add Record.</td></tr>}</tbody></table></div>
    </div>
  );
}
