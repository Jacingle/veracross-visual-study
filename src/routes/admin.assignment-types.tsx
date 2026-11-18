import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/head";
import { useSchool, type AssignmentType } from "@/lib/school-store";
import { ALL_ASSIGNMENTS } from "@/lib/sis-data";

export const Route = createFileRoute("/admin/assignment-types")({
  head: () => pageHead("Axiom · Class Assignment Types", "Set up the assignment types teachers can use and the color each one shows in the app."),
  component: AssignmentTypes,
});

/** Readable text color (black or white) for a hex background. */
const ink = (hex: string) => { const n = parseInt(hex.replace("#", "").padEnd(6, "0"), 16); const l = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); return l > 150 ? "text-foreground" : "text-primary-foreground"; };
const box = "size-[13px] accent-ax-top";

function AssignmentTypes() {
  const { assignmentTypes, custom, update } = useSchool();
  const [picked, setPicked] = useState<string[]>([]);
  const [showObsolete, setShowObsolete] = useState(true);
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of [...ALL_ASSIGNMENTS, ...custom]) { const k = a.category.toUpperCase(); m[k] = (m[k] ?? 0) + 1; }
    return m;
  }, [custom]);
  const rows = [...assignmentTypes].sort((a, b) => a.description.localeCompare(b.description)).filter((t) => showObsolete || !t.obsolete);
  const patch = (id: string, p: Partial<AssignmentType>) => update((s) => ({ ...s, assignmentTypes: s.assignmentTypes.map((t) => (t.id === id ? { ...t, ...p } : t)) }));
  const add = () => update((s) => {
    const id = String(Math.max(0, ...s.assignmentTypes.map((t) => Number(t.id) || 0)) + 1);
    return { ...s, assignmentTypes: [...s.assignmentTypes, { id, description: `NEW TYPE ${id}`, abbreviation: "NEW", color: "#3a8fd1", system: false, obsolete: false, sortKey: Number(id) }] };
  });
  const remove = () => {
    const del = assignmentTypes.filter((t) => picked.includes(t.id));
    const blocked = del.filter((t) => t.system || (counts[t.description.toUpperCase()] ?? 0) > 0);
    if (blocked.length) { toast.error(`${blocked.map((t) => t.description).join(", ")} can't be deleted: it is a system type or already used. Mark it obsolete instead.`); return; }
    update((s) => ({ ...s, assignmentTypes: s.assignmentTypes.filter((t) => !picked.includes(t.id)) })); setPicked([]); toast.success("Deleted");
  };
  const cell = "border-b border-r border-dotted border-vc-line px-2 py-0 h-[34px]";
  const th = "border-r border-dotted border-vc-line bg-ax-head px-2 pb-1.5 pt-6 text-left align-bottom text-[12px] font-semibold text-foreground/80";
  return (
    <AxiomShell title="Class Assignment Types" actions={<><label className="flex items-center gap-1.5 text-[12px]"><input type="checkbox" className={box} checked={showObsolete} onChange={(e) => setShowObsolete(e.target.checked)} />Show obsolete</label><Button size="sm" variant="outline" disabled={!picked.length} onClick={remove}>Delete Selected</Button><Button size="sm" className="bg-ax-go text-primary-foreground hover:bg-ax-go/90" onClick={add}><Plus className="size-4" />Add</Button></>}>
      <p className="mb-2 max-w-[820px] text-[12px] text-muted-foreground">Assignment types are set up here for the whole school. The color you choose is the color of that type everywhere in the portals: assignment chips, the assignment center, the class pages, the gradebook and the calendars. Teachers choose from these types when they create an assignment and weight them for their class.</p>
      <div className="overflow-x-auto border border-vc-line bg-background">
        <table className="w-full min-w-[920px] border-collapse text-[13px]">
          <thead><tr><th className="w-[34px] border-r border-dotted border-vc-line bg-ax-head" /><th className={`${th} w-[56px] text-right`}>ID</th><th className={th}>Description</th><th className={`${th} w-[120px]`}>Abbreviation</th><th className={`${th} w-[70px]`}>System</th><th className={`${th} w-[110px] text-right`}># CY Assignments</th><th className={`${th} w-[150px]`}>Color</th><th className={`${th} w-[80px]`}>Obsolete</th><th className={`${th} w-[80px] text-right`}>Sort Key</th></tr></thead>
          <tbody>{rows.map((t) => (
            <tr key={t.id} className="bg-[#fafafa] hover:bg-vc-sky/60">
              <td className={`${cell} text-center`}><input type="checkbox" aria-label={`Select ${t.description}`} className={box} checked={picked.includes(t.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, t.id] : p.filter((x) => x !== t.id)))} /></td>
              <td className={`${cell} text-right`}>{t.id}</td>
              <td className={cell}><input aria-label="Description" disabled={(counts[t.description.toUpperCase()] ?? 0) > 0} title={(counts[t.description.toUpperCase()] ?? 0) > 0 ? "In use: mark obsolete instead of renaming" : undefined} value={t.description} onChange={(e) => patch(t.id, { description: e.target.value.toUpperCase() })} className="h-7 w-full bg-transparent outline-none focus:bg-background focus:ring-1 focus:ring-ax-top" /></td>
              <td className={cell}><input aria-label="Abbreviation" value={t.abbreviation} maxLength={8} onChange={(e) => patch(t.id, { abbreviation: e.target.value })} className="h-7 w-full bg-transparent outline-none focus:bg-background focus:ring-1 focus:ring-ax-top" /></td>
              <td className={`${cell} text-center`}><input type="checkbox" disabled checked={t.system} aria-label="System" className={box} /></td>
              <td className={`${cell} text-right`}>{(counts[t.description.toUpperCase()] ?? 0).toLocaleString() === "0" ? "" : (counts[t.description.toUpperCase()] ?? 0).toLocaleString()}</td>
              <td className="relative h-[34px] border-b border-r border-dotted border-vc-line p-0" style={{ background: t.color }}>
                <span className={`pointer-events-none flex h-full items-center px-2 font-medium uppercase ${ink(t.color)}`}>{t.color}</span>
                <input type="color" aria-label={`${t.description} color`} value={t.color} onChange={(e) => patch(t.id, { color: e.target.value })} className="absolute inset-0 size-full cursor-pointer opacity-0" />
              </td>
              <td className={`${cell} text-center`}><input type="checkbox" aria-label={`${t.description} obsolete`} className={box} checked={t.obsolete} onChange={(e) => patch(t.id, { obsolete: e.target.checked })} /></td>
              <td className={cell}><input aria-label="Sort key" inputMode="numeric" value={String(t.sortKey)} onChange={(e) => /^\d{0,4}$/.test(e.target.value) && patch(t.id, { sortKey: Number(e.target.value) })} className="h-7 w-full bg-transparent text-right outline-none focus:bg-background focus:ring-1 focus:ring-ax-top" /></td>
            </tr>))}
          </tbody>
        </table>
      </div>
    </AxiomShell>
  );
}
