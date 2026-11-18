import { createFileRoute, Link } from '@tanstack/react-router';
import { addDays, format, isSameWeek, startOfWeek } from 'date-fns';
import { useEffect, useState } from 'react';
import { usePortal } from '@/lib/portal-store';
import { updateKey } from '@/components/portal/ClassRow';
import { Printer, MessageCircle, CirclePlay, Check, Info } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { Button } from '@/components/ui/button';
import { GradeCalculation } from "@/components/portal/GradeCalculation";
import { AssignmentDialog } from "@/components/portal/AssignmentDialog";
import { teacherNames } from "@/lib/student-presentation";
import { categoryColor } from '@/lib/category-colors';
import { courseTitle, teacherFull, today, type Assignment } from '@/lib/sis-data';
import { categoryStats, defaultWeights, letterFor, weightedAverage } from '@/lib/grading';
import { useMySections, useSchool, useStudentAssignments, type Section } from '@/lib/school-store';
import { termById, termOn } from '@/lib/terms';
import { pageHead } from '@/lib/head';

export const Route = createFileRoute('/grades/$classId')({
  validateSearch: (s: Record<string, unknown>): { tab?: 'detail' } => s['tab'] === 'detail' ? { tab: 'detail' } : {},
  head: ({ params }) => pageHead(`Class ${params.classId} · Grades`, 'Published assignment scores, feedback and term grade details.'),
  component: Grades,
});
const pct = (a: Assignment) => a.score !== undefined && a.points > 0 ? a.score / a.points * 100 : null;
const category = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
function Grades() {
  const { classId } = Route.useParams(); const { tab } = Route.useSearch();
  const c = useMySections().find((x) => x.id === classId);
  const list = useStudentAssignments().filter((a) => a.courseId === classId).sort((a, b) => +b.due - +a.due);
  const { read, markRead } = usePortal();
  const { users } = useSchool();
  const faculty = teacherNames(c?.teacherIds ?? [], users.map((u) => ({ ...u, id: u.personId })));
  const unseen = list.filter((a) => a.score !== undefined && !read.includes(updateKey(a.id, a.score))).map((a) => updateKey(a.id, a.score)).join(',');
  useEffect(() => { if (unseen) unseen.split(',').forEach(markRead); }, [unseen, markRead]);
  return <PortalShell portal="student">{c ? <><div className="flex flex-wrap items-center justify-between gap-2 px-7 pb-5 pt-4"><h1 className="text-[25px] font-light"><strong className="font-semibold">{c.id}:</strong> {courseTitle(c)} <span className="ml-2 text-[13px] italic text-muted-foreground">{faculty}</span></h1><Link to="/class/$classId" params={{ classId }} className="text-[12px] text-vc-link-strong">View Class Website →</Link></div><div className="flex px-6 text-[13px]">{[['', 'All Assignments'], ['detail', 'Grade Detail']].map(([v, label]) => <Link key={v} to="/grades/$classId" params={{ classId }} search={v ? { tab: 'detail' } : {}} className={`px-4 py-2.5 ${Boolean(tab) === Boolean(v) ? 'bg-vc-panel font-semibold' : 'text-muted-foreground'}`}>{label}</Link>)}</div>{tab ? <Detail list={list} c={c} /> : <AllAssignments list={list} />}</> : <p className="p-8">You're not enrolled in this class.</p>}</PortalShell>;
}
function AllAssignments({ list }: { list: Assignment[] }) {
  const { comments, aStatus, user, weights } = useSchool();
  const { done, toggleDone, read } = usePortal();
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [filter, setFilter] = useState('all'); const [sort, setSort] = useState('date'); const [expanded, setExpanded] = useState<string | null>(null);
  const feedback = (a: Assignment) => comments[`a|${a.id}|${user?.personId}`] ?? '';
  const status = (a: Assignment) => aStatus[`${a.id}|${user?.personId}`] ?? '';
  const shown = list.filter((a) => filter === 'all' || (filter === 'updates' ? a.score !== undefined && !read.includes(updateKey(a.id, a.score)) : filter === 'feedback' ? Boolean(feedback(a)) : filter === 'problems' ? ['Missing', 'Incomplete', 'Late'].includes(status(a)) : a.score === undefined && a.due >= today()));
  const groups: { key: string; label: string; items: Assignment[] }[] = [];
  for (const a of shown) { const start = startOfWeek(a.due); const key = sort === 'type' ? a.category : String(+start); let group = groups.find((g) => g.key === key); if (!group) { group = { key, label: sort === 'type' ? category(a.category) : `${format(start, 'MMMM d')} - ${format(addDays(start, 6), 'MMMM d')}`, items: [] }; groups.push(group); } group.items.push(a); }
  return <><div className="flex flex-wrap items-center justify-between gap-2 bg-vc-panel px-6 py-1 text-[12px]"><div className="flex gap-1">{[['all', 'All Assignments'], ['updates', 'New Updates'], ['notifications', 'Notifications'], ['feedback', 'Feedback'], ['problems', 'Problems']].map(([v, label]) => <Button key={v} size="sm" variant="ghost" onClick={() => setFilter(v ?? 'all')} className={`h-6 px-2 text-[12px] ${filter === v ? 'bg-foreground text-background' : v === 'updates' ? 'bg-vc-note text-vc-gray-dark' : v === 'problems' ? 'text-destructive' : v === 'notifications' ? 'text-vc-tile-warm-fg' : 'text-vc-link-strong'}`}>{label}</Button>)}</div><div className="flex items-center gap-1"><span className="text-muted-foreground">sort by:</span>{[['date', 'Due Date'], ['type', 'Assignment Type']].map(([v, label]) => <Button key={v} size="sm" variant="ghost" onClick={() => setSort(v ?? 'date')} className={`h-6 px-2 text-[12px] ${sort === v ? 'bg-foreground text-background' : ''}`}>{label}</Button>)}</div></div>{groups.map((g) => <section key={g.key}><h2 className="border-b border-vc-line px-8 pb-2 pt-6 text-[18px]">{g.label} <span className="text-[11px]">({g.items.length} assignments)</span></h2>{g.items.map((a) => <div key={a.id}><Button variant="ghost" onClick={() => setExpanded(expanded === a.id ? null : a.id)} className={`grid h-auto min-h-9 w-full grid-cols-[90px_minmax(0,1fr)_65px] gap-2 rounded-none border-b border-vc-line px-7 py-1.5 text-left text-[13px] ${expanded === a.id ? 'bg-vc-panel' : ''}`}><span className="flex gap-2 text-[12px] font-semibold">{format(a.due, 'MMM d')} {format(a.due, 'EEE')}</span><span className="min-w-0 whitespace-normal font-normal"><span style={{ borderColor: categoryColor(weights[a.courseId], a.category), color: categoryColor(weights[a.courseId], a.category) }} className="mr-2 border-l-2 bg-vc-panel px-1 font-semibold">{category(a.category)}</span>{a.title}{done.includes(a.id) && <span className="ml-2 bg-vc-success px-1 text-primary-foreground">✓ Done!</span>}{feedback(a) && <MessageCircle className="ml-2 inline size-3 text-vc-link-strong" />}</span><span className="flex justify-end gap-1"><strong>{a.score ?? '-'}</strong><span className="bg-vc-line px-1 text-muted-foreground">{a.points}</span></span></Button>{expanded === a.id && <div className="grid gap-6 bg-vc-panel/50 px-8 py-5 text-[13px] md:grid-cols-2"><div><div className="flex gap-8"><div><div className="text-[11px] text-muted-foreground">DATE ASSIGNED</div><b>{format(a.assigned, 'EEE, MMM dd')}</b></div><div><div className="text-[11px] text-muted-foreground">DUE DATE</div><b>{format(a.due, 'EEE, MMM dd')}</b></div></div><p className="mt-4 whitespace-pre-wrap">{a.notes || '-'}</p><div className="mt-4 flex gap-2"><Button variant="outline" size="sm" onClick={() => setSelected(a)} className="h-7 text-[12px]">Assignment Details</Button><Button variant="outline" size="sm" onClick={() => toggleDone(a.id)} className="h-7 text-[12px]"><Check className="size-3" />{done.includes(a.id) ? 'Mark Not Done' : 'Mark Done'}</Button></div></div><div><h3 className="text-[12px] font-semibold">ASSIGNMENT FEEDBACK</h3><p className="mt-3 whitespace-pre-wrap">{feedback(a) || '-'}</p>{status(a) && <div className="mt-3">{status(a)}</div>}</div></div>}</div>)}</section>)}{!shown.length && <p className="px-8 py-10 text-[13px] text-muted-foreground">No assignments.</p>}<AssignmentDialog assignment={selected} onClose={() => setSelected(null)} /></>;
}
function Detail({ list, c }: { list: Assignment[]; c: Section }) {
  const { weights, user, termGrades, custom, users } = useSchool();
  const terms = c.terms.map(termById).filter((t) => t !== undefined);
  const [selected, setSelected] = useState(termOn(c.terms, today())?.id ?? c.terms[0] ?? '');
  const term = terms.find((t) => t.id === selected);
  const items = list.filter((a) => !term || (a.due >= term.start && +a.due <= +term.end + 86399999));
  const calc = items.filter((a) => custom.find((x) => x.id === a.id)?.inCalc !== false);
  const w = weights[c.id] ?? [];
  const avg = weightedAverage(calc, w);
  const summaryWeights = (w.length ? [...w, ...defaultWeights(calc.map((a) => a.category)).filter((x) => !w.some((v) => v.cat === x.cat))] : defaultWeights(calc.map((a) => a.category))).sort((a, b) => a.cat.localeCompare(b.cat));
  const posted = termGrades[`${c.id}|${user?.personId}|${selected}`];
  const faculty = teacherNames(c.teacherIds, users.map((u) => ({ ...u, id: u.personId })));
  const categories = [...new Set(items.map((a) => a.category))].sort();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  return <>
    <div className="grade-toolbar flex flex-wrap items-center gap-1 bg-vc-panel px-6 py-1.5 text-[12px]"><span className="text-vc-gray">view:</span>{terms.map((t) => <Button key={t.id} variant="ghost" size="sm" className={`h-6 rounded-none px-2 text-[12px] ${selected === t.id ? 'bg-foreground text-background hover:bg-foreground hover:text-background' : ''}`} onClick={() => setSelected(t.id)}>{t.label}</Button>)}</div>
    <div className="bg-vc-panel px-4 py-5 md:px-[62px]">
      <article className="grade-print border border-vc-line bg-background shadow-lg">
        <div className="grade-print-action flex justify-end bg-foreground px-5 py-1 text-background"><Button variant="ghost" size="sm" className="h-8 text-[16px] font-normal hover:bg-transparent hover:text-background" onClick={() => window.print()}><Printer className="size-4" />Print to <span className="text-destructive">PDF</span></Button></div>
        <div className="px-5 pb-6 pt-6">
          <h2 className="text-[30px] font-bold leading-9">Grade Detail - {term?.label ?? 'Grades'}</h2>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="text-[16px] leading-5"><b>{user?.first} {user?.last}</b><span className="text-[12px] text-muted-foreground"> - Grade {user?.grade ?? '-'}</span><br /><b>{courseTitle(c)}</b> - {faculty}<br /><span className="text-[14px]">Weighting by {w.length ? 'Assignment Type' : 'Assignment Points'}</span></div>
            <GradeCalculation items={calc} weights={w}><span className="flex shrink-0 bg-vc-panel text-[34px] leading-[48px]"><span className="border-r border-vc-line px-3">{avg === null ? '-' : avg.toFixed(2)}</span><span className="px-3">{posted || (avg === null ? '-' : letterFor(avg))}</span></span></GradeCalculation>
          </div>
          <h3 className="mb-3 mt-5 flex items-center gap-2 text-[24px] font-bold">Summary <Info className="size-3 text-vc-link" /></h3>
          <div className="overflow-x-auto"><table className="w-full text-[14px]"><thead className="bg-vc-panel"><tr><th className="w-1/2 p-1 text-center">Assignment Type</th><th className="p-1 text-right">Points<br />Earned</th><th className="p-1 text-right">Points<br />Possible</th><th className="p-1 text-right">Average<span className="text-destructive">*</span></th>{w.length > 0 && <th className="p-1 text-right">Weight</th>}</tr></thead><tbody>{summaryWeights.map((x) => { const st = categoryStats(calc.filter((a) => a.category === x.cat), x.drop); return <tr key={x.cat}><td className="py-1"><b>{category(x.cat)}</b> <span className="text-[10px] text-muted-foreground">({st.count} assignments)</span></td><td className="text-right">{st.pct === null ? '-' : st.earned.toFixed(2)}</td><td className="text-right">{st.pct === null ? '-' : st.possible.toFixed(2)}</td><td className="text-right">{st.pct === null ? '-' : st.pct.toFixed(2)}</td>{w.length > 0 && <td className="text-right">{x.weight}%{x.drop && <span className="block text-[10px] text-muted-foreground">Drop lowest</span>}</td>}</tr>; })}</tbody></table></div>
          <h3 className="mb-3 mt-4 flex items-center gap-2 text-[24px] font-bold">Assignments <Info className="size-3 text-vc-link" /></h3>
          <div className="overflow-x-auto"><table className="w-full text-[13px]"><thead className="bg-vc-panel"><tr><th className="whitespace-nowrap p-1 text-left">Due Date</th><th className="w-1/2 p-1 text-center">Assignment</th><th className="p-1 text-right">Score</th><th className="p-1 text-right">Grade</th><th className="p-1 text-right">Points<br />Earned</th><th className="p-1 text-right">Points<br />Possible</th></tr></thead>
            {categories.map((cat) => { const group = items.filter((a) => a.category === cat).sort((a, b) => +a.due - +b.due); const st = categoryStats(calc.filter((a) => a.category === cat), w.find((x) => x.cat === cat)?.drop); return <tbody key={cat}><tr><td /><td className="px-2 pb-1 pt-2 font-bold">{category(cat)}</td><td colSpan={4} /></tr>{group.map((a) => <tr key={a.id} className="border-b border-vc-line"><td className="whitespace-nowrap py-1">{format(a.due, 'MMM d')}</td><td className="px-2 py-1"><Button variant="ghost" onClick={() => setAssignment(a)} className="h-auto whitespace-normal rounded-none p-0 text-left text-[13px] font-normal leading-4 hover:bg-transparent hover:text-vc-link-strong">{a.title}</Button></td><td className="whitespace-nowrap text-right">{a.score === undefined ? '-' : `${a.score} / ${a.points}`}</td><td className="text-right">{pct(a) === null ? '-' : `${pct(a)?.toFixed(2)}%`}</td><td className="text-right">{a.score ?? '-'}</td><td className="text-right">{a.points}</td></tr>)}<tr className="text-right font-bold"><td colSpan={4} /><td className="py-1">{st.pct === null ? '-' : st.earned.toFixed(2)}</td><td>{st.pct === null ? '-' : st.possible}</td></tr></tbody>; })}
          </table></div>
        </div>
      </article>
    </div>
    <AssignmentDialog assignment={assignment} onClose={() => setAssignment(null)} />
  </>;
}
