import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Trash2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { AxiomShell, Panel } from '@/components/admin/AxiomShell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSchool } from '@/lib/school-store';
import { schoolYears, termLabel } from '@/lib/terms';
import { durationMinutes, validateSchedulingSet, type BlockMeeting, type SchedulingSet } from '@/lib/scheduling';
import type { ReactNode } from 'react';
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
  return <AxiomShell title="Scheduling Sets" actions={<Button size="sm" onClick={() => setDraft({ id: crypto.randomUUID(), name: '', terms: [], blocks: [], weekdays: [1, 2, 3, 4, 5], meetings: [] })}><Plus className="size-4" />New Scheduling Set</Button>}>
    <Panel title={`Scheduling Sets (${schedulingSets.length})`}>
      <div className="overflow-x-auto"><table className="w-full text-[13px]"><thead><tr className="border-b border-vc-line text-left text-[11px] uppercase text-muted-foreground"><th className="py-2">Name</th><th>Terms</th><th>Blocks</th><th>Classes</th><th /></tr></thead><tbody>{schedulingSets.map((set) => <tr key={set.id} className="border-b border-vc-line"><td className="py-3"><Button variant="link" className="h-auto p-0" onClick={() => setDraft({ weekdays: [], meetings: [], ...structuredClone(set) })}>{set.name}</Button></td><td>{set.terms.map(termLabel).join(', ')}</td><td>{set.blocks.map((b) => b.name).join(', ')}</td><td>{sections.filter((c) => c.scheduleSetId === set.id).length}</td><td><Button variant="ghost" size="icon" aria-label={`Delete ${set.name}`} onClick={() => { if (sections.some((c) => c.scheduleSetId === set.id)) { toast.error('Remove this scheduling set from its classes first.'); return; } if (confirm(`Delete ${set.name}?`)) update((s) => ({ ...s, schedulingSets: s.schedulingSets.filter((x) => x.id !== set.id) })); }}><Trash2 className="size-4 text-destructive" /></Button></td></tr>)}</tbody></table></div>
      {!schedulingSets.length && <div className="py-10 text-center text-muted-foreground"><CalendarDays className="mx-auto mb-2 size-8" />No scheduling sets.</div>}
    </Panel>
    <Dialog open={Boolean(draft)} onOpenChange={(v) => !v && setDraft(null)}><DialogContent className="max-h-[90dvh] max-w-[780px] overflow-y-auto text-[13px]"><DialogHeader><DialogTitle>{schedulingSets.some((s) => s.id === draft?.id) ? 'Edit Scheduling Set' : 'New Scheduling Set'}</DialogTitle></DialogHeader>{draft && <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
      <Step n={1} title="Name & Terms"><label className="block">Name<input required aria-label="Scheduling set name" className={inp} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
      <fieldset><legend className="mb-2 font-semibold">School Years & Terms</legend><div className="grid gap-3 sm:grid-cols-3">{schoolYears().map((y) => <div key={y.id}><strong>{y.label}</strong>{y.terms.map((t) => <label key={t.id} className="mt-1 flex items-center gap-2"><input type="checkbox" checked={draft.terms.includes(t.id)} onChange={(e) => setDraft({ ...draft, terms: e.target.checked ? [...draft.terms, t.id] : draft.terms.filter((x) => x !== t.id) })} />{t.label}</label>)}</div>)}</div></fieldset></Step>
      <Step n={2} title="Blocks" hint="Create the blocks classes will be scheduled into (for example A Block, B Block, Lunch).">
        <div className="space-y-2">{draft.blocks.map((b) => <div key={b.id} className="flex gap-2"><input required aria-label="Block name" placeholder="Block name" className={inp} value={b.name} onChange={(e) => setDraft({ ...draft, blocks: draft.blocks.map((x) => x.id === b.id ? { ...x, name: e.target.value } : x) })} /><Button type="button" variant="ghost" size="icon" aria-label="Remove block" className="size-8" onClick={() => setDraft({ ...draft, blocks: draft.blocks.filter((x) => x.id !== b.id), meetings: (draft.meetings ?? []).map((m) => m.blockId === b.id ? { ...m, blockId: '' } : m) })}><Trash2 className="size-4 text-destructive" /></Button></div>)}</div>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setDraft({ ...draft, blocks: [...draft.blocks, { id: crypto.randomUUID(), name: '', days: [], start: '', end: '' }] })}><Plus className="size-4" />Add Block</Button>
      </Step>
      <Step n={3} title="Set Length" hint="Choose the days in this scheduling set.">
        <div className="flex flex-wrap gap-3">{days.map((label, i) => { const day = (i + 1) % 7; const on = draft.weekdays?.includes(day) ?? false; return <label key={label} className="flex items-center gap-1"><input type="checkbox" checked={on} onChange={(e) => setDraft({ ...draft, weekdays: e.target.checked ? [...(draft.weekdays ?? []), day] : (draft.weekdays ?? []).filter((x) => x !== day) })} />{label}</label>; })}</div>
      </Step>
      <Step n={4} title="Meeting Times & Block Assignments" hint="Add each day's meeting times, then assign a block to each time.">
        <div className="grid gap-3 md:grid-cols-2">{days.map((label, i) => ({ label, day: (i + 1) % 7 })).filter(({ day }) => draft.weekdays?.includes(day)).map(({ label, day }) => { const ms = (draft.meetings ?? []).filter((m) => m.day === day).sort((x, y) => x.start.localeCompare(y.start)); const change = (id: string, patch: Partial<BlockMeeting>) => setDraft({ ...draft, meetings: (draft.meetings ?? []).map((m) => m.id === id ? { ...m, ...patch } : m) }); return <div key={day} className="rounded-sm border border-vc-line">
          <div className="bg-foreground px-2 py-1 text-center font-semibold text-background">{label}</div>
          <div className="space-y-1.5 p-2">{ms.map((m) => <div key={m.id} className="grid grid-cols-[86px_86px_minmax(0,1fr)_28px] items-center gap-1"><input type="time" aria-label={`${label} start`} className={inp} value={m.start} onChange={(e) => change(m.id, { start: e.target.value })} /><input type="time" aria-label={`${label} end`} className={inp} value={m.end} onChange={(e) => change(m.id, { end: e.target.value })} /><select aria-label={`${label} block`} className={inp} value={m.blockId} onChange={(e) => change(m.id, { blockId: e.target.value })}><option value="">— block —</option>{draft.blocks.map((b) => <option key={b.id} value={b.id}>{b.name || 'Unnamed'}</option>)}</select><Button type="button" variant="ghost" size="icon" aria-label="Remove meeting time" className="size-7" onClick={() => setDraft({ ...draft, meetings: (draft.meetings ?? []).filter((x) => x.id !== m.id) })}><Trash2 className="size-3.5 text-destructive" /></Button>{m.start && m.end && <span className="col-span-4 text-[11px] text-muted-foreground">{durationMinutes(m.start, m.end)} minutes</span>}</div>)}
            <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setDraft({ ...draft, meetings: [...(draft.meetings ?? []), { id: crypto.randomUUID(), day, start: ms.at(-1)?.end ?? '08:00', end: '', blockId: '' }] })}><Plus className="size-3.5" />Add meeting time</Button></div></div>; })}</div>
      </Step>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button type="submit">Save Scheduling Set</Button></div>
    </form>}</DialogContent></Dialog>
  </AxiomShell>;
}
function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return <section className="border-t border-vc-line pt-3"><h3 className="flex items-center gap-2 font-semibold"><span className="grid size-6 place-items-center rounded-full bg-primary text-[12px] text-primary-foreground">{n}</span>{title}</h3>{hint && <p className="mb-2 mt-1 text-muted-foreground">{hint}</p>}<div className="mt-2">{children}</div></section>;
}
