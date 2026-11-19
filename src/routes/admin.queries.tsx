import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { Download, Play, Star, Printer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AxiomShell } from '@/components/admin/AxiomShell';
import { Button } from '@/components/ui/button';
import { useSchool } from '@/lib/school-store';
import { downloadCsv, publishingError } from '@/lib/admin-tools';
import { useAdminWorkspace } from '@/lib/admin-workspace';
import { teacherNames } from '@/lib/student-presentation';
import { pageHead } from '@/lib/head';

export const Route = createFileRoute('/admin/queries')({
  validateSearch: z.object({ source: z.enum(['people', 'classes']).optional(), q: z.string().optional(), status: z.string().optional(), role: z.string().optional() }),
  head: () => pageHead('Administration · Queries & Records', 'Find people and classes, export school records and batch publish class sections.'),
  component: Queries,
});
function Queries() {
  const { source = 'people', q = '', status = '', role = '' } = Route.useSearch();
  const nav = useNavigate({ from: '/admin/queries' });
  const { users, sections, user, update } = useSchool();
  const workspace = useAdminWorkspace(user?.id);
  const [selected, setSelected] = useState<string[]>([]);
  const [ascending, setAscending] = useState(true);
  const people = users.filter((u) => (!role || u.role === role) && (!status || u.active === (status === 'active')) && `${u.first} ${u.last} ${u.email}`.toLowerCase().includes(q.toLowerCase())).sort((a,b) => (a.last.localeCompare(b.last) || a.first.localeCompare(b.first)) * (ascending ? 1 : -1));
  const classes = sections.filter((c) => (!status || c.published === (status === 'published')) && `${c.code} ${c.name} ${c.room} ${c.block}`.toLowerCase().includes(q.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name) * (ascending ? 1 : -1));
  const ids = (source === 'people' ? people : classes).map((r) => r.id);
  const chosen = selected.filter((id) => ids.includes(id));
  const rows = source === 'people' ? [['Last Name', 'First Name', 'Email', 'Role', 'Grade', 'Status'], ...people.map((u) => [u.last, u.first, u.email, u.role, u.grade ?? '', u.active ? 'Active' : 'Inactive'])] : [['Class ID', 'Class', 'Teachers', 'Room', 'Block', 'Terms', 'Enrolled', 'Published'], ...classes.map((c) => [c.code, c.name, teacherNames(c.teacherIds, users.map((u) => ({ ...u, id: u.personId }))), c.room, c.block, c.terms.join(', '), c.studentIds.length, c.published])];
  const batch = (published: boolean) => {
    const targets = classes.filter((c) => chosen.includes(c.id));
    if (published) { const invalid = targets.find((c) => publishingError(c, users)); if (invalid) { toast.error(`${invalid.code}: ${publishingError(invalid, users)}`); return; } }
    update((s) => ({ ...s, sections: s.sections.map((c) => targets.some((t) => t.id === c.id) ? { ...c, published } : c) }));
    toast.success(`${targets.length} classes ${published ? 'published' : 'unpublished'}`); setSelected([]);
  };
  const saveQuery = () => { const path = window.location.pathname + window.location.search; if (!workspace.favorites.some((f) => f.path === path)) workspace.toggleFavorite({ title: `Find ${source} · ${q || status || role || 'all'}`, path }); toast.success('Query saved to Favorites'); };
  return <AxiomShell title="Queries & Records" actions={<Button variant="ghost" size="sm" onClick={saveQuery} className="h-7 text-primary-foreground"><Star className="size-4" />Save Query</Button>}>
    <div className="grid gap-3 lg:grid-cols-[190px_minmax(0,1fr)]">
      <aside className="border border-vc-line bg-background"><h2 className="border-b border-vc-line bg-ax-head p-3 font-semibold">QUERY TEMPLATES</h2>{(['people', 'classes'] as const).map((s) => <Button key={s} variant="ghost" onClick={() => { setSelected([]); nav({ search: { source: s } }); }} className={`h-10 w-full justify-start rounded-none px-3 text-[13px] ${source === s ? 'border-l-4 border-ax-top bg-vc-select' : ''}`}>Find {s === 'people' ? 'People' : 'Classes'}</Button>)}</aside>
      <section className="min-w-0 border border-vc-line bg-background">
        <div className="flex flex-wrap items-end gap-3 border-b border-vc-line bg-ax-head p-3"><label className="min-w-40 flex-1 text-[11px] text-muted-foreground">NAME / IDENTIFIER<input aria-label="Query text" value={q} onChange={(e) => nav({ search: (p) => ({ ...p, q: e.target.value }), replace: true })} className="mt-1 block h-8 w-full border border-vc-line bg-background px-2 text-[13px] text-foreground" /></label><label className="text-[11px] text-muted-foreground">STATUS<select aria-label="Query status" value={status} onChange={(e) => nav({ search: (p) => ({ ...p, status: e.target.value }) })} className="mt-1 block h-8 border border-vc-line bg-background px-2 text-[13px] text-foreground"><option value="">All</option>{(source === 'people' ? ['active', 'inactive'] : ['published', 'draft']).map((s) => <option key={s}>{s}</option>)}</select></label>{source === 'people' && <label className="text-[11px] text-muted-foreground">ROLE<select aria-label="Query role" value={role} onChange={(e) => nav({ search: (p) => ({ ...p, role: e.target.value }) })} className="mt-1 block h-8 border border-vc-line bg-background px-2 text-[13px] text-foreground"><option value="">All</option>{['student', 'teacher', 'admin'].map((r) => <option key={r}>{r}</option>)}</select></label>}<Button size="sm" variant="outline" onClick={() => { setSelected([]); nav({ search: { source } }); }}>Clear</Button></div>
        <div className="flex flex-wrap items-center gap-2 border-b border-vc-line px-3 py-2"><span className="mr-auto text-muted-foreground">{ids.length} records{chosen.length > 0 && ` · ${chosen.length} selected`}</span><Button variant="ghost" size="sm" onClick={() => setAscending((v) => !v)} className="h-7 text-[12px]">{ascending ? 'A → Z' : 'Z → A'}</Button><Button aria-label="Export query results" title="Export CSV" variant="outline" size="icon" className="size-7" onClick={() => downloadCsv(`${source}.csv`, rows)}><Download className="size-4" /></Button><Button aria-label="Print query results" title="Print" variant="outline" size="icon" className="size-7" onClick={() => window.print()}><Printer className="size-4" /></Button>{source === 'classes' && <><Button size="sm" className="h-7 bg-ax-go text-primary-foreground" disabled={!chosen.length} onClick={() => batch(true)}>Publish selected</Button><Button variant="outline" size="sm" className="h-7" disabled={!chosen.length} onClick={() => batch(false)}>Unpublish selected</Button></>}</div>
        <div className="overflow-x-auto"><table className="admin-grid min-w-[640px] w-full"><thead><tr><th className="w-8"><input aria-label="Select all query results" type="checkbox" checked={ids.length > 0 && chosen.length === ids.length} onChange={(e) => setSelected(e.target.checked ? ids : [])} /></th>{rows[0]?.map((h) => <th key={String(h)}>{h}</th>)}</tr></thead><tbody>{(source === 'people' ? people : classes).map((record, i) => <tr key={record.id}><td><input aria-label={`Select ${record.id}`} type="checkbox" checked={chosen.includes(record.id)} onChange={(e) => setSelected((s) => e.target.checked ? [...s, record.id] : s.filter((id) => id !== record.id))} /></td>{rows[i + 1]?.map((cell, j) => <td key={j}>{j === 0 ? source === 'people' ? <Link to="/admin/users" search={{ q: 'email' in record ? record.email : '' }} className="text-vc-link-strong hover:underline">{String(cell)}</Link> : <Link to="/admin/courses/$courseId" params={{ courseId: record.id }} className="text-vc-link-strong hover:underline">{String(cell)}</Link> : String(cell)}</td>)}</tr>)}{!ids.length && <tr><td colSpan={9} className="py-16 text-center text-[24px] font-light text-vc-gray-light">No Results</td></tr>}</tbody></table></div>
      </section>
    </div>
  </AxiomShell>;
}
