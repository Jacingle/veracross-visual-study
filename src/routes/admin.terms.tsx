import { createFileRoute, Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import { useState } from 'react';
import { AxiomShell } from '@/components/admin/AxiomShell';
import { AxFooter } from '@/components/admin/AxiomDetail';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/head';
import { useSchool } from '@/lib/school-store';
import { schoolYears, yearStartFor } from '@/lib/terms';
export const Route = createFileRoute('/admin/terms')({ head: () => pageHead('Cedar Ridge · School Years & Terms', 'Review semester dates, grading periods and classes by school year.'), component: Terms });
function Terms() {
 const { sections } = useSchool();
 const years = schoolYears();
 const [yearId, setYearId] = useState(String(yearStartFor(new Date())));
 const year = years.find((y) => y.id === yearId);
 if (!year) return null;
 return <AxiomShell title="School Years & Terms"><div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
 <aside className="border border-vc-line bg-background"><h2 className="border-b border-vc-line bg-ax-head px-3 py-2 font-semibold">SCHOOL YEARS</h2>{years.map((y) => <Button key={y.id} variant="ghost" onClick={() => setYearId(y.id)} className={`h-9 w-full justify-start rounded-none ${year.id === y.id ? 'border-l-4 border-vc-link bg-vc-select' : ''}`}>{y.label}{y.id === String(yearStartFor(new Date())) && <span className="ml-auto text-[11px] text-muted-foreground">Current</span>}</Button>)}</aside>
 <section className="min-w-0 border border-vc-line bg-background"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-vc-line px-4 py-3"><h2 className="text-[21px] font-light">SCHOOL YEAR: {year.label}</h2><Button asChild variant="outline" size="sm"><Link to="/admin/courses">Review Classes</Link></Button></div>
 <h3 className="border-b border-vc-line bg-ax-head px-3 py-2 font-semibold">Terms</h3><div className="overflow-x-auto"><table className="admin-grid w-full min-w-[560px]"><thead><tr><th>Term ID</th><th>Description</th><th>Start Date</th><th>End Date</th><th>Classes</th></tr></thead><tbody>{year.terms.map((t) => <tr key={t.id}><td>{t.id}</td><td>{t.label}</td><td>{format(t.start, 'MMM d, yyyy')}</td><td>{format(t.end, 'MMM d, yyyy')}</td><td>{sections.filter((c) => c.terms.includes(t.id)).length}</td></tr>)}</tbody></table></div><AxFooter count={year.terms.length} />
 <h3 className="border-y border-vc-line bg-ax-head px-3 py-2 font-semibold">Grading Periods</h3><div className="overflow-x-auto"><table className="admin-grid w-full min-w-[560px]"><thead><tr><th>Period ID</th><th>Description</th><th>Term</th><th>Reporting Date</th></tr></thead><tbody>{year.terms.flatMap((t) => [{ id: `${t.id}-M`, label: `Mid-${t.label}`, date: t.mid, term: t.label }, { id: t.id, label: t.label, date: t.end, term: t.label }]).map((g) => <tr key={g.id}><td>{g.id}</td><td>{g.label}</td><td>{g.term}</td><td>{format(g.date, 'MMM d, yyyy')}</td></tr>)}</tbody></table></div><AxFooter count={year.terms.length * 2} /></section></div></AxiomShell>;
}
