import { ExternalLink, Search } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  label: string; ids: string[]; onChange: (ids: string[]) => void;
  nameOf: (id: string) => string; onSearch: () => void; onOpen?: (id: string) => void;
  /** One person (Teacher) or several (Teacher's Aide). */ multi?: boolean; placeholder?: string;
};

/**
 * A person lookup field. Click a name to highlight it (Ctrl/Shift-click adds more, Ctrl+A highlights all),
 * then press Delete or Backspace to remove them. Backspace with nothing highlighted highlights the last name first.
 */
export function PersonField({ label, ids, onChange, nameOf, onSearch, onOpen, multi = false, placeholder = "" }: Props) {
  const [sel, setSel] = useState<string[]>([]);
  useEffect(() => { setSel((s) => s.filter((id) => ids.includes(id))); }, [ids]);
  const remove = () => { if (!sel.length) return; onChange(ids.filter((id) => !sel.includes(id))); setSel([]); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); if (sel.length) remove(); else if (e.key === "Backspace" && ids.length) setSel([ids[ids.length - 1]!]); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") { e.preventDefault(); setSel(ids); }
    else if (e.key === "Enter") { e.preventDefault(); onSearch(); }
    else if (e.key === "Escape") setSel([]);
  };
  const click = (id: string, e: React.MouseEvent) => { e.stopPropagation(); setSel((s) => (multi && (e.ctrlKey || e.metaKey || e.shiftKey) ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : [id])); };
  const last = ids[ids.length - 1];
  return (
    <div className="flex items-stretch">
      <div tabIndex={0} role="group" aria-label={`${label}. Click a name, then press Delete to remove it.`} onKeyDown={onKey} onClick={(e) => e.currentTarget.focus()}
        className="flex min-h-[30px] min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0.5 border border-vc-gray-light/80 bg-background px-1.5 py-0.5 text-[13px] outline-none focus:border-vc-link">
        {ids.map((id) => <button type="button" key={id} aria-pressed={sel.includes(id)} onClick={(e) => click(id, e)} className={`px-1 text-left ${sel.includes(id) ? "bg-ax-bar text-primary-foreground" : "hover:bg-vc-panel"}`}>{nameOf(id)}</button>)}
        {!ids.length && <span className="px-1 text-vc-gray-light">{placeholder}</span>}
      </div>
      <button type="button" onClick={onSearch} aria-label={`Search ${label}`} title="Advanced search" className="grid w-8 shrink-0 place-items-center border border-l-0 border-vc-gray-light/80 bg-background hover:bg-vc-panel"><Search className="size-4" /></button>
      <button type="button" disabled={!last || !onOpen} onClick={() => last && onOpen?.(last)} aria-label={`Open ${label} record`} title="Open record" className="grid w-8 shrink-0 place-items-center border border-l-0 border-vc-gray-light/80 bg-background text-vc-link hover:bg-vc-panel disabled:text-vc-gray-light"><ExternalLink className="size-4" /></button>
    </div>
  );
}
