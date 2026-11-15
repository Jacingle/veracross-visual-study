import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Trash2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { AxiomShell, Panel } from '@/components/admin/AxiomShell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSchool } from '@/lib/school-store';
import { schoolYears, termLabel } from '@/lib/terms';
import { durationMinutes, validateSchedulingSet, type SchedulingSet } from '@/lib/scheduling';
import { pageHead } from '@/lib/head';

export const Route = createFileRoute('/admin/scheduling')({
  head: () => pageHead('Administration · Scheduling Sets', 'Manage term-based weekly timetables, blocks and meeting times.'),
  component: Scheduling,
});
const inp = 'h-8 w-full border border-vc-line bg-background px-2 text-[13px]';
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function Scheduling() {
  const { schedulingSets, sections, update } = useSchool();
  const [draft, setDraft] = useState<SchedulingSet | null>(null);
  const save = () => {
    if (!draft) return;
    const error = validateSchedulingSet(draft);
    if (error) { toast.error(error); return; }
    const next = { ...draft, name: draft.name.trim() };
    update((s) => ({ ...s, schedulingSets: s.schedulingSets.some((x) => x.id === next.id) ? s.schedulingSets.map((x) => x.id === next.id ? next : x) : [...s.schedulingSets, next] }));
    setDraft(null); toast.success('Scheduling set saved');
  };
  return <AxiomShell title="Scheduling Sets" actions={<Button size="sm" onClick={() => setDraft({ id: crypto.randomUUID(), name: '', terms: [], blocks: [] })}><Plus className="size-4" />New Scheduling Set</Button>}>
    <Panel title={`Scheduling Sets (${schedulingSets.length})`}>
      <div className="overflow-x-auto"><table className="w-full text-[13px]"><thead><tr className="border-b border-vc-line text-left text-[11px] uppercase text-muted-foreground"><th className="py-2">Name</th><th>Terms</th><th>Blocks</th><th>Classes</th><th /></tr></thead><tbody>{schedulingSets.map((set) => <tr key={set.id} className="border-b border-vc-line"><td className="py-3"><Button variant="link" className="h-auto p-0" onClick={() => setDraft(structuredClone(set))}>{set.name}</Button></td><td>{set.terms.map(termLabel).join(', ')}</td><td>{set.blocks.map((b) => `${b.name}: ${b.start}–${b.end}`).join(', ')}</td><td>{sections.filter((c) => c.scheduleSetId === set.id).length}</td><td><Button variant="ghost" size="icon" aria-label={`Delete ${set.name}`} onClick={() => { if (sections.some((c) => c.scheduleSetId === set.id)) { toast.error('Remove this scheduling set from its classes first.'); return; } if (confirm(`Delete ${set.name}?`)) update((s) => ({ ...s, schedulingSets: s.schedulingSets.filter((x) => x.id !== set.id) })); }}><Trash2 className="size-4 text-destructive" /></Button></td></tr>)}</tbody></table></div>
      {!schedulingSets.length && <div className="py-10 text-center text-muted-foreground"><CalendarDays className="mx-auto mb-2 size-8" />No scheduling sets.</div>}
    </Panel>
    <Dialog open={Boolean(draft)} onOpenChange={(v) => !v && setDraft(null)}><DialogContent className="max-h-[90dvh] max-w-[780px] overflow-y-auto text-[13px]"><DialogHeader><DialogTitle>{schedulingSets.some((s) => s.id === draft?.id) ? 'Edit Scheduling Set' : 'New Scheduling Set'}</DialogTitle></DialogHeader>{draft && <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
      <label className="block">Name<input required aria-label="Scheduling set name" className={inp} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
      <fieldset><legend className="mb-2 font-semibold">School Years & Terms</legend><div className="grid gap-3 sm:grid-cols-3">{schoolYears().map((y) => <div key={y.id}><strong>{y.label}</strong>{y.terms.map((t) => <label key={t.id} className="mt-1 flex items-center gap-2"><input type="checkbox" checked={draft.terms.includes(t.id)} onChange={(e) => setDraft({ ...draft, terms: e.target.checked ? [...draft.terms, t.id] : draft.terms.filter((x) => x !== t.id) })} />{t.label}</label>)}</div>)}</div></fieldset>
      <div className="flex items-center justify-between"><h3 className="font-semibold">Weekly Blocks</h3><Button type="button" variant="outline" size="sm" onClick={() => setDraft({ ...draft, blocks: [...draft.blocks, { id: crypto.randomUUID(), name: '', days: [], start: '', end: '' }] })}><Plus className="size-4" />Add Block</Button></div>
      {draft.blocks.map((b) => { const change = (patch: Partial<typeof b>) => setDraft({ ...draft, blocks: draft.blocks.map((x) => x.id === b.id ? { ...x, ...patch } : x) }); return <fieldset key={b.id} className="border-t border-vc-line pt-3"><div className="grid grid-cols-[minmax(0,1fr)_110px_110px_32px] gap-2"><label>Block<input required aria-label="Block name" className={inp} value={b.name} onChange={(e) => change({ name: e.target.value })} /></label><label>Start<input required type="time" aria-label="Block start" className={inp} value={b.start} onChange={(e) => change({ start: e.target.value })} /></label><label>End<input required type="time" aria-label="Block end" className={inp} value={b.end} onChange={(e) => change({ end: e.target.value })} /></label><Button type="button" variant="ghost" size="icon" aria-label="Remove block" className="mt-4 size-8" onClick={() => setDraft({ ...draft, blocks: draft.blocks.filter((x) => x.id !== b.id) })}><Trash2 className="size-4 text-destructive" /></Button></div><div className="mt-2 flex flex-wrap gap-3">{days.map((label, i) => { const day = (i + 1) % 7; return <label key={label} className="flex items-center gap-1"><input type="checkbox" checked={b.days.includes(day)} onChange={(e) => change({ days: e.target.checked ? [...b.days, day] : b.days.filter((x) => x !== day) })} />{label}</label>; })}{b.start && b.end && <span className="ml-auto text-muted-foreground">{durationMinutes(b.start, b.end)} minutes</span>}</div></fieldset>; })}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button type="submit">Save Scheduling Set</Button></div>
    </form>}</DialogContent></Dialog>
  </AxiomShell>;
}