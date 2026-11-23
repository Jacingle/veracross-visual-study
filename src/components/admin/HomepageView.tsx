import { Link, useNavigate } from "@tanstack/react-router";
import { FileText, ListChecks, Plus, Search, Settings } from "lucide-react";
import { useState, type ReactNode } from "react";
import { HoverMenu } from "@/components/admin/AdminTools";
import { linkKind, metrics, type HomeLink, type Homepage, type HomeSection, type LinkKind } from "@/lib/admin-homepages";
import { useRecordWindow } from "@/lib/record-window";
import { useSchool } from "@/lib/school-store";

const KIND: Record<LinkKind, { Icon: typeof Search; label: string }> = { find: { Icon: Search, label: "Find" }, add: { Icon: Plus, label: "Add" }, report: { Icon: FileText, label: "Report" }, config: { Icon: Settings, label: "Configuration" } };
const linkCls = "flex items-center gap-2 py-[3px] text-[14px] text-vc-link-strong hover:underline";

/** A homepage the way Veracross lays it out: quick Find and Add links, Counter Tiles, then Link Tiles grouped by task. */
export function HomepageView({ page, extra }: { page: Homepage; extra?: ReactNode }) {
  const school = useSchool();
  const nav = useNavigate();
  const openRecord = useRecordWindow();
  const [filter, setFilter] = useState("");
  const [more, setMore] = useState<Record<string, boolean>>({});
  const m = metrics(school);
  const run = (a: "new-course" | "new-class" | "new-person") => { if (a === "new-course") openRecord("/admin/course/new"); else if (a === "new-class") openRecord("/admin/class/new"); else nav({ to: "/admin/users", search: { add: "user" } }); };
  const row = (l: HomeLink) => {
    const { Icon, label } = KIND[linkKind(l)];
    const icon = <Icon aria-label={label} className="size-3.5 shrink-0 text-vc-gray" />;
    return "action" in l
      ? <button key={l.label} type="button" onClick={() => run(l.action)} className={`${linkCls} w-full text-left`}>{icon}{l.label}</button>
      : <Link key={`${l.to}${JSON.stringify(l.search ?? {})}${l.label}`} to={l.to} search={(l.search ?? {}) as never} className={linkCls}>{icon}{l.label}</Link>;
  };
  const needle = filter.trim().toLowerCase();
  const shown = (s: HomeSection) => !needle || `${s.title} ${[...s.groups.flatMap((g) => [g.heading, ...g.links.map((l) => l.label)]), ...(s.more ?? []).map((l) => l.label)].join(" ")}`.toLowerCase().includes(needle);
  const quick = page.quick;
  return (
    <div className="mx-auto max-w-[1240px] border border-vc-line bg-background">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-vc-line bg-vc-panel px-4 py-2">
        {quick && quick.find.length > 0 && <div className="flex flex-wrap items-center gap-x-4"><span className="text-[11px] font-bold uppercase text-vc-gray-dark">Find</span>{quick.find.map(row)}</div>}
        {quick && quick.add.length > 0 && <HoverMenu label="Add">{quick.add.map((l) => <li key={l.label} role="none">{"action" in l ? <button role="menuitem" type="button" onClick={() => run(l.action)} className="block w-full px-3 py-1.5 text-left text-vc-link-strong hover:bg-vc-panel">{l.label}</button> : null}</li>)}</HoverMenu>}
        <input aria-label="Find a task" placeholder="Find a task…" value={filter} onChange={(e) => setFilter(e.target.value)} className="ml-auto h-8 w-full max-w-72 border border-vc-line bg-background px-2 text-[13px] outline-none focus:border-vc-link" />
      </div>
      <h2 className="px-5 pb-1 pt-5 text-[30px] font-light text-ax-top">{page.heading}</h2>
      {page.counters && page.counters.length > 0 && (
        <div aria-label="Counter tiles" className="grid grid-cols-2 gap-3 px-5 pt-3 sm:grid-cols-3 lg:grid-cols-4">
          {page.counters.map((c) => (
            <Link key={c.label} to={c.to} search={(c.search ?? {}) as never} className="border border-vc-line border-l-4 border-l-ax-panel bg-background px-3 py-2.5 hover:bg-vc-panel">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</div><div className={`text-[28px] font-light ${c.metric === "pendingPurchases" && m[c.metric] > 0 ? "text-destructive" : "text-ax-top"}`}>{m[c.metric]}</div>
            </Link>))}
        </div>)}
      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-3">
        {page.sections.filter(shown).map((s) => (
          <section key={s.title} aria-label={s.title} className="min-h-[200px] border border-vc-line border-t-2 border-t-ax-panel bg-background">
            <h3 className="flex items-center justify-between bg-vc-panel px-4 py-2 text-[17px] font-light">{s.title}
              {s.more && <button type="button" aria-label={`Set-up links for ${s.title}`} aria-expanded={!!more[s.title]} title="Consolidated view: set-up links" onClick={() => setMore((o) => ({ ...o, [s.title]: !o[s.title] }))} className={`grid size-7 place-items-center hover:bg-ax-head ${more[s.title] ? "bg-ax-head" : ""}`}><ListChecks className="size-4" /></button>}
            </h3>
            <div className="space-y-4 px-4 py-3">
              {s.groups.map((g) => <div key={g.heading}><h4 className="mb-1 text-[14px] font-bold">{g.heading}</h4>{g.links.map(row)}</div>)}
              {s.more && more[s.title] && <div className="border-t border-dotted border-vc-gray-light pt-2"><h4 className="mb-1 text-[14px] font-bold">Set-up</h4>{s.more.map(row)}</div>}
            </div>
          </section>))}
        {extra}
      </div>
    </div>
  );
}
