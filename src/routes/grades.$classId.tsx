import { createFileRoute, Link } from '@tanstack/react-router';
import { addDays, format, startOfWeek } from 'date-fns';
import { useEffect, useState } from 'react';
import { usePortal } from '@/lib/portal-store';
import { updateKey } from '@/components/portal/ClassRow';
import { ArrowRight, Printer, MessageCircle, Check, Paperclip } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { Button } from '@/components/ui/button';
import { GradeCalculation } from "@/components/portal/GradeCalculation";
import { AssignmentDialog } from "@/components/portal/AssignmentDialog";
import { teacherFullNames, teacherNames } from "@/lib/student-presentation";
import { categoryColor } from '@/lib/category-colors';
import { courseTitle, today, type Assignment } from '@/lib/sis-data';
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
  const [fresh] = useState(() => new Set(list.filter((a) => a.score !== undefined && !read.includes(updateKey(a.id, a.score))).map((a) => a.id)));
  const unseen = list.filter((a) => a.score !== undefined && !read.includes(updateKey(a.id, a.score))).map((a) => updateKey(a.id, a.score)).join(',');
  useEffect(() => { if (unseen) unseen.split(',').forEach(markRead); }, [unseen, markRead]);
  const fullNames = teacherFullNames(c?.teacherIds ?? [], users.map((u) => ({ ...u, id: u.personId })));
  return <PortalShell portal="student" maxWidth={930}>{c ? <>
    <div className="relative px-9 pb-[19px] pt-2.5">
      <h1 className="flex flex-wrap items-baseline gap-x-3 text-[25px] font-light leading-9"><span><strong className="font-semibold">{c.id}:</strong> {courseTitle(c)}</span><span className="text-[14px] italic text-vc-gray">{fullNames}</span></h1>
      <Link to="/class/$classId" params={{ classId }} className="absolute right-3 top-3 flex items-center gap-1 text-[12px] text-vc-link">View Class Website <ArrowRight className="size-3" /></Link>
    </div>
    <div className="flex pl-[26px]">{[['', 'All Assignments'], ['detail', 'Grade Detail']].map(([v, label]) => <Link key={v} to="/grades/$classId" params={{ classId }} search={v ? { tab: 'detail' } : {}} className={`px-[15px] py-[9px] text-[14.5px] leading-5 ${Boolean(tab) === Boolean(v) ? 'bg-vc-bar font-semibold text-foreground' : 'text-vc-gray'}`}>{label}</Link>)}</div>
    {tab ? <Detail list={list} c={c} /> : <AllAssignments list={list} teacherName={faculty} fresh={fresh} />}</> : <p className="p-8">You're not enrolled in this class.</p>}</PortalShell>;
}
function AllAssignments({ list, teacherName, fresh }: { list: Assignment[]; teacherName: string; fresh: Set<string> }) {
  const { comments, aStatus, user, weights } = useSchool();
  const { done, toggleDone } = usePortal();
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [filter, setFilter] = useState('all'); const [sort, setSort] = useState('date'); const [expanded, setExpanded] = useState<string | null>(null);
  const feedback = (a: Assignment) => comments[`a|${a.id}|${user?.personId}`] ?? '';
  const status = (a: Assignment) => aStatus[`${a.id}|${user?.personId}`] ?? '';
  const shown = list.filter((a) => filter === 'all' || (filter === 'updates' ? fresh.has(a.id) : filter === 'feedback' ? Boolean(feedback(a)) : filter === 'problems' ? ['Missing', 'Incomplete', 'Late'].includes(status(a)) : a.score === undefined && a.due >= today()));
  const groups: { key: string; label: string; items: Assignment[] }[] = [];
  for (const a of shown) { const start = startOfWeek(a.due); const key = sort === 'type' ? a.category : String(+start); let group = groups.find((g) => g.key === key); if (!group) { group = { key, label: sort === 'type' ? category(a.category) : `${format(start, 'MMMM d')} - ${format(addDays(start, 6), 'MMMM d')}`, items: [] }; groups.push(group); } group.items.push(a); }
  const FILTERS: [string, string, string][] = [['all', 'All Assignments', ''], ['updates', 'New Updates', 'bg-vc-hint text-vc-tile-warm-fg'], ['notifications', 'Notifications', 'text-vc-tile-warm-fg'], ['feedback', 'Feedback', 'text-vc-link-strong'], ['problems', 'Problems', 'text-destructive']];
  const chip = (on: boolean, extra = '') => `h-[19px] rounded-none px-[6px] text-[12.5px] font-medium leading-[19px] ${on ? 'bg-foreground font-semibold text-background hover:bg-foreground hover:text-background' : `hover:bg-transparent ${extra}`}`;
  return <>
    <div className="flex flex-wrap items-center justify-between gap-2 bg-vc-bar px-[26px] py-[7px]">
      <div className="flex gap-2">{FILTERS.map(([v, label, extra]) => <Button key={v} size="sm" variant="ghost" onClick={() => setFilter(v)} className={chip(filter === v, extra)}>{label}</Button>)}</div>
      <div className="flex items-center gap-2 text-[12.5px]"><span className="text-vc-gray">sort by:</span>{[['date', 'Due Date'], ['type', 'Assignment Type']].map(([v, label]) => <Button key={v} size="sm" variant="ghost" onClick={() => setSort(v ?? 'date')} className={chip(sort === v)}>{label}</Button>)}</div>
    </div>
    {groups.map((g) => <section key={g.key}>
      <h2 className="border-b border-vc-line px-10 pb-[7px] pt-7 text-[20px] font-light leading-7">{g.label} <span className="text-[12px]">({g.items.length} assignments)</span></h2>
      {g.items.map((a) => {
        const color = categoryColor(weights[a.courseId], a.category); const open = expanded === a.id; const fb = feedback(a);
        return <div key={a.id} className="border-b border-vc-line">
          <div className={`flex min-h-[46px] items-center gap-3 pl-3.5 pr-6 ${open ? 'bg-vc-bar' : ''}`}>
            <span className="grid w-[18px] shrink-0 place-items-center">{fb && <MessageCircle className="size-[17px] fill-current text-vc-link" />}</span>
            <button type="button" onClick={() => setExpanded(open ? null : a.id)} className="grid min-w-0 flex-1 cursor-pointer grid-cols-[52px_44px_minmax(0,1fr)] items-center py-2 text-left text-[14px]">
              <b className="font-semibold">{format(a.due, 'MMM dd')}</b><b className="font-semibold">{format(a.due, 'EEE')}</b>
              <span className="flex min-w-0 items-center gap-2.5"><span className="flex shrink-0 items-stretch"><span className="w-[3px] shrink-0" style={{ background: color }} /><span className="bg-vc-bar px-1.5 text-[14.5px] font-semibold leading-[26px] text-foreground">{category(a.category)}</span></span><span className="min-w-0 break-words text-[15px]">{a.title}</span></span>
            </button>
            {done.includes(a.id) && <span className="flex shrink-0 items-center gap-1 bg-vc-done px-2 py-[3px] text-[13px] font-semibold text-primary-foreground"><Check className="size-3.5" strokeWidth={3} />Done!</span>}
            
            {a.score === undefined ? <span className="flex min-w-[74px] shrink-0 justify-end text-[14px] italic text-vc-gray-dark">{status(a) || (a.due >= today() ? 'Pending' : '-')}</span> : <span className="flex shrink-0 items-stretch text-[17px] leading-[21px]"><strong className="bg-background px-[6px] font-bold">{a.score}</strong><span className="min-w-[27px] bg-vc-bar px-[5px] text-center font-light text-vc-gray-dark">{a.points}</span></span>}
          </div>
          {open && <div className="grid gap-8 bg-[oklch(0.985_0_0)] px-7 pb-6 pt-5 text-[14px] md:grid-cols-[54fr_46fr]">
            <div>
              <div className="flex gap-[34px]">{[['DATE ASSIGNED', a.assigned], ['DUE DATE', a.due]].map(([label, d]) => <div key={String(label)}><div className="text-[12px] font-light uppercase leading-5 text-vc-gray-dark">{String(label)}</div><div className="text-[16px] font-semibold leading-5">{format(d as Date, 'EEE, MMM dd')}</div></div>)}</div>
              <p className="mt-[18px] whitespace-pre-wrap text-[14px] leading-[17px]">{a.notes || '-'}</p>
              <div className="mt-4 flex gap-2"><Button variant="outline" size="sm" onClick={() => setSelected(a)} className="h-7 rounded-none text-[12px]">Assignment Details</Button><Button variant="outline" size="sm" onClick={() => toggleDone(a.id)} className="h-7 rounded-none text-[12px]"><Check className="size-3" />{done.includes(a.id) ? 'Mark Not Done' : 'Mark Done'}</Button></div>
            </div>
            <div>
              <h3 className="text-[13px] font-bold uppercase leading-5">Assignment Feedback</h3>
              {fb ? <div className="mt-2.5"><div className="flex justify-end"><span className="border-r-[3px] border-vc-link-strong bg-vc-sky px-2 text-[14px] font-semibold leading-[20px] text-vc-link-strong">{teacherName}</span></div><p className="mt-5 whitespace-pre-wrap pl-[50px] text-justify text-[14px] leading-[17px]">{fb}</p><div className="mt-4 border-b border-dotted border-vc-gray-light" /></div> : <p className="mt-3">-</p>}
              {status(a) && <div className="mt-3 flex items-center gap-1.5 text-[13px]"><Paperclip className="size-3.5" />{status(a)}</div>}
            </div>
          </div>}
        </div>;
      })}
    </section>)}
    {!shown.length && <p className="px-10 py-10 text-[14px] text-vc-gray-dark">No assignments.</p>}
    <AssignmentDialog assignment={selected} onClose={() => setSelected(null)} />
  </>;
}
function Detail({ list, c }: { list: Assignment[]; c: Section }) {
  const { weights, user, termGrades, custom, users, aStatus } = useSchool();
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
    <div className="grade-toolbar flex flex-wrap items-center gap-2 bg-vc-bar px-[26px] py-[7px] text-[12.5px]"><span className="text-vc-gray">view:</span>{terms.map((t) => <Button key={t.id} variant="ghost" size="sm" className={`h-[19px] rounded-none px-1.5 text-[12.5px] font-normal ${selected === t.id ? 'bg-foreground text-background hover:bg-foreground hover:text-background' : ''}`} onClick={() => setSelected(t.id)}>{t.label}</Button>)}</div>
    <div className="bg-vc-paper px-4 pb-[30px] pt-2.5 md:px-[65px]">
      <article className="grade-print border border-vc-line bg-background shadow-lg">
        <div className="grade-print-action flex justify-end bg-foreground px-5 py-1 text-background"><Button variant="ghost" size="sm" className="h-8 text-[16px] font-normal hover:bg-transparent hover:text-background" onClick={() => window.print()}><Printer className="size-4" />Print to <span className="text-destructive">PDF</span></Button></div>
        <div className="px-5 pb-6 pt-6">
          <h2 className="text-[32px] font-bold leading-10">Grade Detail - {term?.label ?? 'Grades'}</h2>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3 md:max-w-[684px]"><div className="text-[18px] leading-[21px]"><b>{user?.first} {user?.last}</b><span className="text-[12px] text-muted-foreground"> - Grade {user?.grade ?? '-'}</span><br /><b>{courseTitle(c)}</b> - {faculty}<br /><span className="text-[16px]">Weighting by {w.length ? 'Assignment Type' : 'Assignment Points'}</span></div>
            <GradeCalculation items={calc} weights={w}><span className="mr-0 mt-2.5 flex shrink-0 bg-vc-bar md:mr-[51px] text-[36px] leading-[59px]"><span className="border-r-2 border-background px-[15px]">{avg === null ? '-' : avg.toFixed(2)}</span><span className="px-[10px]">{posted || (avg === null ? '-' : letterFor(avg))}</span></span></GradeCalculation>
          </div>
          <h3 className="mb-3 mt-5 flex items-center gap-2 text-[24px] font-bold">Summary <span aria-hidden className="grid size-[15px] place-items-center rounded-full bg-vc-link-strong/30 text-[10px] font-bold leading-none text-background">?</span></h3>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] table-fixed text-[16px] md:w-[684px]"><colgroup><col />{w.length > 0 && <col className="w-[109px]" />}<col className="w-[109px]" /><col className="w-[109px]" /><col className="w-[109px]" /></colgroup><thead className="bg-vc-bar text-[15px] leading-[18px]"><tr><th className="p-1 text-center">Assignment Type</th>{w.length > 0 && <th className="p-1 text-right">Weighting</th>}<th className="p-1 text-right">Points<br />Earned</th><th className="p-1 text-right">Points<br />Possible</th><th className="p-1 text-right">Average<span className="text-destructive">*</span></th></tr></thead><tbody>{summaryWeights.map((x) => { const st = categoryStats(calc.filter((a) => a.category === x.cat), x.drop); return <tr key={x.cat} className="leading-[21px]"><td className="py-0.5"><b>{category(x.cat)}</b> <span className="text-[12px] text-muted-foreground">({st.count} assignments)</span></td>{w.length > 0 && <td className="text-right">{x.weight.toFixed(2)}%</td>}<td className="text-right">{st.pct === null ? '-' : st.earned.toFixed(2)}</td><td className="text-right">{st.pct === null ? '-' : st.possible.toFixed(2)}</td><td className="text-right">{st.pct === null ? '-' : st.pct.toFixed(2)}</td></tr>; })}</tbody></table></div>
          <h3 className="mb-3 mt-4 flex items-center gap-2 text-[24px] font-bold">Assignments <span aria-hidden className="grid size-[15px] place-items-center rounded-full bg-vc-link-strong/30 text-[10px] font-bold leading-none text-background">?</span></h3>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] table-fixed text-[16px] md:w-[684px]"><colgroup><col className="w-[69px]" /><col /><col className="w-[104px]" /><col className="w-[70px]" /><col className="w-[65px]" /><col className="w-[73px]" /></colgroup><thead className="bg-vc-bar text-[15px] leading-[18px]"><tr><th className="whitespace-nowrap p-1 text-left">Due Date</th><th className="p-1 text-center">Assignment</th><th className="p-1 text-right">Score</th><th className="p-1 text-right">Grade</th><th className="p-1 text-right">Points<br />Earned</th><th className="p-1 text-right">Points<br />Possible</th></tr></thead>
            {categories.map((cat) => { const group = items.filter((a) => a.category === cat).sort((a, b) => +a.due - +b.due); const st = categoryStats(calc.filter((a) => a.category === cat), w.find((x) => x.cat === cat)?.drop); return <tbody key={cat}><tr><td /><td className="px-2 pb-1 pt-2 font-bold">{category(cat)}</td><td colSpan={4} /></tr>{group.map((a) => { const flag = aStatus[`${a.id}|${user?.personId}`] ?? ''; const bad = ['Late', 'Incomplete', 'Missing'].includes(flag); return <tr key={a.id} className={`border-b border-foreground/30 leading-[21px] hover:bg-vc-hint ${bad ? 'italic text-destructive' : ''}`}><td className="whitespace-nowrap py-0">{format(a.due, 'MMM d')}</td><td className="truncate px-2 py-0"><Button variant="ghost" onClick={() => setAssignment(a)} className="h-auto max-w-full justify-start truncate whitespace-nowrap rounded-none p-0 text-left text-[16px] font-normal leading-[21px] hover:bg-transparent hover:text-vc-link-strong">{a.title}</Button></td><td className="whitespace-nowrap text-right text-[13px]">{bad ? flag : a.score === undefined ? '-' : `${a.score} / ${a.points}`}</td><td className="text-right">{pct(a) === null ? '-' : `${pct(a)?.toFixed(2)}%`}</td><td className="text-right">{a.score ?? '-'}</td><td className="text-right">{a.points}</td></tr>; })}<tr className="text-right font-bold leading-[21px]"><td colSpan={4} /><td className="py-0.5">{st.pct === null ? '-' : st.earned.toFixed(2)}</td><td>{st.pct === null ? '-' : st.possible}</td></tr></tbody>; })}
          </table></div>
        </div>
      </article>
    </div>
    <AssignmentDialog assignment={assignment} onClose={() => setAssignment(null)} />
  </>;
}
