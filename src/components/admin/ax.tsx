// Axiom-style building blocks: blue panels, form fields, YES/NO toggles, left section menu, record tables.
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

export const axInput = "h-7 w-full border border-vc-line bg-background px-2 text-[13px] outline-none focus:border-vc-link disabled:bg-vc-panel disabled:text-muted-foreground";
export const axSelect = `${axInput} pr-6`;

/** Blue-header panel used on the Portal Admin homepage. */
export function AxPanel({ title, right, children, className = "" }: { title: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`border border-vc-line bg-background shadow-sm ${className}`}>
      <div className="flex items-center justify-between bg-ax-panel px-3 py-1.5 text-[12px] text-primary-foreground">{title}{right ?? <ExternalLink className="size-3.5 opacity-80" />}</div>
      {children}
    </section>
  );
}
/** White box with a thin blue top rule and a light heading (Manage Related Content, Directories, ...). */
export function AxBox({ title, children }: { title: string; children: ReactNode }) {
  return <section className="min-h-[260px] border border-vc-line border-t-2 border-t-ax-panel bg-background p-3"><h3 className="mb-3 text-[16px] font-light">{title}</h3>{children}</section>;
}
/** Grey section bar inside a detail screen ("General", "Design", "Stats"). */
export function AxGroup({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <section className={className}><h3 className="bg-ax-head px-3 py-2 text-[15px] font-semibold">{title}</h3><div className="space-y-2.5 px-3 py-3">{children}</div></section>;
}
export function AxField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid grid-cols-[minmax(110px,150px)_minmax(0,1fr)] items-center gap-3"><div className="text-[11px] uppercase text-foreground/70">{label}</div><div>{children}</div></div>;
}
/** Green YES / grey NO switch like Axiom's flags. */
export function AxToggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative h-[26px] w-[62px] rounded-[4px] border text-[11px] font-bold text-primary-foreground ${checked ? "border-ax-save bg-ax-save" : "border-vc-line bg-vc-gray-light"} ${disabled ? "opacity-60" : ""}`}>
      <span className={`absolute top-1/2 -translate-y-1/2 ${checked ? "left-2" : "right-2"}`}>{checked ? "YES" : "NO"}</span>
      <span className={`absolute inset-y-[2px] w-[22px] rounded-[3px] bg-background ${checked ? "right-[2px]" : "left-[2px]"}`} />
    </button>
  );
}
export type AxMenuGroup = { title: string; items: { id: string; label: string }[] };
/** Left-hand section menu on detail screens. */
export function AxSideMenu({ groups, active, onSelect }: { groups: AxMenuGroup[]; active: string; onSelect: (id: string) => void }) {
  return (
    <nav aria-label="Sections" className="min-h-[calc(100vh-96px)] w-[210px] shrink-0 border-r border-vc-line bg-ax-side py-3">
      {groups.map((g) => (
        <div key={g.title} className="mb-3">
          <div className="px-3 pb-1 pt-1 text-[12px] font-bold uppercase tracking-wide text-foreground/60">▾ {g.title}</div>
          {g.items.map((it) => (
            <button key={it.id} type="button" onClick={() => onSelect(it.id)} aria-current={active === it.id ? "page" : undefined}
              className={`block w-full border-l-[4px] px-3 py-1.5 text-left text-[14px] ${active === it.id ? "border-ax-top bg-ax-head font-bold text-foreground" : "border-transparent text-vc-link-strong hover:bg-ax-head"}`}>{it.label}</button>))}
        </div>))}
    </nav>
  );
}
/** Screen heading with the "Last Modified" note. */
export function AxScreenTitle({ title, modified }: { title: string; modified?: string | undefined }) {
  return <div className="flex items-end justify-between border-b border-vc-line px-5 py-3"><h2 className="text-[22px] font-light uppercase tracking-wide">{title}</h2>{modified && <div className="text-[11px] text-muted-foreground">{modified}</div>}</div>;
}
export const axTh = "border-b border-r border-vc-line bg-ax-head px-2 py-1.5 text-left text-[12px] font-semibold";
export const axTd = "border-b border-vc-line px-2 py-1.5";
