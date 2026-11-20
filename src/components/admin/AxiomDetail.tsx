import { ChevronDown, ExternalLink, Flag } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** The green action button in the Axiom toolbar (ADD COURSE, UPDATE ...). */
export function AxAction({ className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={`h-[34px] border border-ax-go/70 bg-ax-go px-5 text-[14px] font-bold uppercase tracking-wide text-primary-foreground hover:brightness-95 disabled:opacity-50 ${className}`} />;
}
/** Green "Add Record" button that sits above a grid. */
export function AxAdd({ className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={`h-[38px] border border-ax-go/70 bg-ax-go px-3.5 text-[15px] text-primary-foreground hover:brightness-95 ${className}`} />;
}

export type AxGroup = { heading?: string; items: { id: string; label: string }[] };

/** Detail layout: grey sidebar of record sections on the left, an upper-case section title, the form and grid. */
export function AxDetail({ groups, active, onSelect, title, meta, banner, children }: { groups: AxGroup[]; active: string; onSelect: (id: string) => void; title: string; meta?: ReactNode; banner?: ReactNode; children: ReactNode }) {
  return (
    <div className="-m-3 flex min-h-[calc(100vh-86px)] bg-background sm:-m-4">
      <nav aria-label="Record sections" className="hidden w-[180px] shrink-0 bg-ax-side py-2 lg:block">
        {groups.map((g, i) => (
          <div key={g.heading ?? i} className="mb-2">
            <div className="flex items-center gap-1.5 px-2.5 py-2 text-[15px] font-semibold uppercase text-foreground/70"><ChevronDown className="size-3" />{g.heading ?? "All"}</div>
            {g.items.map((it) => (
              <button key={it.id} onClick={() => onSelect(it.id)} aria-current={active === it.id ? "page" : undefined}
                className={`block w-full border-l-[5px] px-[19px] py-[9px] text-left text-[13px] ${active === it.id ? "border-vc-link bg-vc-bar font-semibold text-foreground" : "border-transparent text-vc-link-strong/80 hover:bg-vc-bar/60"}`}>{it.label}</button>))}
          </div>))}
      </nav>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3 border-b border-vc-line px-6 py-2.5">
          <h1 className="text-[22px] font-light uppercase leading-8">{title}</h1>
          <div className="text-[13px] text-vc-gray">{meta}</div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto border-b border-vc-line bg-vc-panel px-3 py-1.5 lg:hidden">{groups.flatMap((g) => g.items).map((it) => <button key={it.id} onClick={() => onSelect(it.id)} className={`shrink-0 px-3 py-1 text-[13px] ${active === it.id ? "bg-vc-bar font-semibold" : "text-vc-link-strong"}`}>{it.label}</button>)}</div>
        {banner}
        {children}
      </div>
    </div>
  );
}

export const AxBanner = ({ children = "Fields in bold are required" }: { children?: ReactNode }) => <div className="flex items-center gap-3 bg-vc-tile-warm px-5 py-2 text-[13px]"><span className="grid size-[18px] place-items-center rounded-full bg-vc-gray-light text-[11px] font-bold text-primary-foreground">i</span>{children}</div>;

export const axInput = "h-[30px] w-full border border-vc-gray-light/80 bg-background px-2.5 text-[13px] outline-none focus:border-vc-link disabled:bg-vc-panel";

/** One labelled field: bold for required fields, a light dotted-underline label for optional ones. */
export function AxField({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,115px)_minmax(0,1fr)] items-center gap-x-3 py-[4px]">
      <span className={`text-[13px] uppercase leading-4 ${required ? "font-bold text-foreground" : "border-b border-dotted border-vc-gray-light text-vc-gray-dark"} w-fit`}>{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** YES / NO switch: green with a white knob when on, light grey when off. */
export function AxToggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative flex h-[28px] w-[72px] items-center border text-[12px] font-semibold ${on ? "border-ax-go/70 bg-ax-go pl-3 text-primary-foreground" : "border-vc-gray-light bg-vc-panel pl-10 text-vc-gray"}`}>
      {on ? "YES" : "NO"}<span className={`absolute inset-y-[3px] w-[24px] border border-vc-gray-light/70 bg-background ${on ? "right-[3px]" : "left-[3px]"}`} />
    </button>
  );
}

/** Grid table styling: grey header with dotted column rules, light rows, row count footer. */
export const axTh = "border-r border-dotted border-vc-line bg-ax-head px-2.5 pb-1.5 pt-3 text-left align-bottom text-[15px] font-semibold leading-5";
export const axTd = "h-[44px] border-b border-r border-dotted border-vc-line px-2.5 text-[15px]";
export function AxEmpty() { return <div className="py-16 text-center text-[52px] font-light leading-none text-vc-gray-light">No Results</div>; }
export function AxFooter({ count, right }: { count: number; right?: ReactNode }) {
  return <div className="flex items-center justify-between border-t border-vc-line bg-vc-panel px-3 py-1.5 text-[14px]"><span>{right}</span><span className="flex items-center gap-2"><Flag className="size-4 text-vc-gray" />{count} records</span></div>;
}
export const AxOpen = ({ label }: { label: string }) => <ExternalLink aria-label={label} className="size-[18px] text-vc-link" />;
