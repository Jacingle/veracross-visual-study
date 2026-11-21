import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type SearchRow = { id: string; first?: string; last?: string; grade?: number; cells: string[] };
type Props = {
  open: boolean; onClose: () => void;
  /** "Person" or "Course": shown in the title and on the select button. */
  noun: string; kind: "person" | "course";
  heads: string[]; rows: SearchRow[];
  multi?: boolean; /** Ids already chosen: shown ticked and left out of the results. */ exclude?: string[];
  onSelect: (ids: string[]) => void; onAddNew?: () => void;
};
const MAX = 100;
const box = "h-8 w-full border border-vc-line bg-background px-2 text-[13px] outline-none focus:border-vc-link";
const lbl = "mb-1 mt-3 block text-[11px] font-semibold uppercase text-vc-gray-dark";

/** Veracross-style "Advanced Search" popup: filters on the left, results with tick boxes on the right. */
export function AdvancedSearch({ open, onClose, noun, kind, heads, rows, multi = false, exclude = [], onSelect, onAddNew }: Props) {
  const [last, setLast] = useState(""); const [first, setFirst] = useState(""); const [text, setText] = useState("");
  const [grades, setGrades] = useState<number[]>([]);
  const [applied, setApplied] = useState({ last: "", first: "", text: "", grades: [] as number[] });
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => { if (open) { setLast(""); setFirst(""); setText(""); setGrades([]); setApplied({ last: "", first: "", text: "", grades: [] }); setPicked([]); } }, [open]);
  const allGrades = useMemo(() => [...new Set(rows.map((r) => r.grade).filter((g): g is number => g !== undefined))].sort((a, b) => a - b), [rows]);
  const shown = useMemo(() => rows.filter((r) => !exclude.includes(r.id)
    && (kind === "person"
      ? (!applied.last || (r.last ?? "").toLowerCase().includes(applied.last.toLowerCase())) && (!applied.first || (r.first ?? "").toLowerCase().includes(applied.first.toLowerCase())) && (!applied.grades.length || (r.grade !== undefined && applied.grades.includes(r.grade)))
      : !applied.text || r.cells.join(" ").toLowerCase().includes(applied.text.toLowerCase()))), [rows, exclude, kind, applied]);
  const run = () => setApplied({ last: last.trim(), first: first.trim(), text: text.trim(), grades });
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : multi ? [...p, id] : [id]));
  const choose = () => { if (!picked.length) return; onSelect(picked); onClose(); };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="flex max-h-[88vh] w-[min(920px,96vw)] max-w-none flex-col gap-0 rounded-none p-0 text-[13px]">
        <DialogHeader className="px-5 pb-2 pt-4"><DialogTitle className="text-[20px] font-normal">Advanced Search: {noun}</DialogTitle></DialogHeader>
        <div className="grid min-h-0 flex-1 grid-cols-1 border-y border-vc-line sm:grid-cols-[230px_minmax(0,1fr)]">
          <form onSubmit={(e) => { e.preventDefault(); run(); }} className="overflow-y-auto border-b border-vc-line bg-vc-panel px-4 pb-4 sm:border-b-0 sm:border-r">
            {kind === "person" ? <>
              <label className={lbl} htmlFor="adv-last">Last Name</label><input id="adv-last" className={box} value={last} onChange={(e) => setLast(e.target.value)} />
              <label className={lbl} htmlFor="adv-first">First Name</label><input id="adv-first" className={box} value={first} onChange={(e) => setFirst(e.target.value)} />
              {allGrades.length > 0 && <fieldset><legend className={lbl}>Current Grade</legend>
                <div className="max-h-40 overflow-y-auto border border-vc-line bg-background p-1">{allGrades.map((g) => <label key={g} className="flex items-center gap-2 px-1 py-0.5"><input type="checkbox" checked={grades.includes(g)} onChange={(e) => setGrades((p) => (e.target.checked ? [...p, g] : p.filter((x) => x !== g)))} />Grade {g}</label>)}</div>
                <div className="mt-1 flex gap-3 text-[12px]"><button type="button" className="text-vc-link-strong hover:underline" onClick={() => setGrades(allGrades)}>Select All</button><button type="button" className="text-vc-link-strong hover:underline" onClick={() => setGrades([])}>Select None</button></div></fieldset>}
            </> : <><label className={lbl} htmlFor="adv-text">Name or ID</label><input id="adv-text" className={box} value={text} onChange={(e) => setText(e.target.value)} /></>}
            <button type="submit" className="mt-4 h-8 w-full bg-ax-bar px-3 text-[13px] font-semibold text-primary-foreground hover:brightness-95">Run Query</button>
          </form>
          <div className="min-h-[260px] overflow-auto">
            <table className="w-full min-w-[460px] border-collapse">
              <thead className="sticky top-0 bg-ax-head"><tr><th className="w-9 px-2 py-2" />{heads.map((h) => <th key={h} className="px-2 py-2 text-left font-semibold">{h}</th>)}</tr></thead>
              <tbody>{shown.slice(0, MAX).map((r) => (
                <tr key={r.id} onClick={() => toggle(r.id)} className={`cursor-pointer border-b border-vc-line ${picked.includes(r.id) ? "bg-vc-tile-warm" : "hover:bg-vc-panel"}`}>
                  <td className="px-2 py-1.5"><input type="checkbox" aria-label={`Select ${r.cells[0]}`} checked={picked.includes(r.id)} onChange={() => toggle(r.id)} onClick={(e) => e.stopPropagation()} /></td>
                  {r.cells.map((c, i) => <td key={i} className="px-2 py-1.5">{c}</td>)}
                </tr>))}</tbody>
            </table>
            {!shown.length && <p className="px-4 py-10 text-center text-[15px] text-vc-gray">No results. Change the search and choose Run Query.</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-5 py-3">
          <button type="button" onClick={run} className="h-9 bg-ax-bar px-4 text-[14px] text-primary-foreground hover:brightness-95">Run Query</button>
          {onAddNew && <button type="button" onClick={onAddNew} className="h-9 bg-ax-bar px-4 text-[14px] text-primary-foreground hover:brightness-95">Add New Record...</button>}
          <span className="ml-2 text-[12px] text-vc-gray">{shown.length > MAX ? `Top ${MAX} of ${shown.length} records` : `${shown.length} ${shown.length === 1 ? "record" : "records"}`}</span>
          <div className="ml-auto flex items-center gap-4">
            <button type="button" disabled={!picked.length} onClick={choose} className="h-9 bg-ax-go px-4 text-[14px] font-semibold text-primary-foreground hover:brightness-95 disabled:opacity-50">Select {noun}{multi && picked.length > 1 ? ` (${picked.length})` : ""}</button>
            <button type="button" onClick={onClose} className="text-[15px] text-vc-gray hover:underline">Cancel</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
