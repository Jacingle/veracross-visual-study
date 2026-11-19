import { createFileRoute, Link } from '@tanstack/react-router';
import { addDays, format, startOfWeek } from 'date-fns';
import { useState } from 'react';
import { usePortal } from '@/lib/portal-store';
import { updateKey } from '@/components/portal/ClassRow';
import { ArrowRight, Printer } from 'lucide-react';
import { CommentsSolid } from '@/components/portal/icons';
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
  validateSearch: (s: Record<string, unknown>): { tab?: 'detail'; filter?: 'updates' } => ({ ...(s['tab'] === 'detail' ? { tab: 'detail' as const } : {}), ...(s['filter'] === 'updates' ? { filter: 'updates' as const } : {}) }),
  head: ({ params }) => pageHead(`Class ${params.classId} · Grades`, 'Published assignment scores, feedback and term grade details.'),
  component: Grades,
});
const pct = (a: Assignment) => a.score !== undefined && a.points > 0 ? a.score / a.points * 100 : null;
const category = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
function Grades() {
  const { classId } = Route.useParams(); const { tab, filter: startFilter } = Route.useSearch();
  const c = useMySections().find((x) => x.id === classId);
  const list = useStudentAssignments().filter((a) => a.courseId === classId).sort((a, b) => +b.due - +a.due);
  const { read } = usePortal();
  const { users } = useSchool();
  const faculty = teacherNames(c?.teacherIds ?? [], users.map((u) => ({ ...u, id: u.personId })));
  const [fresh] = useState(() => new Set(list.filter((a) => a.score !== undefined && !read.includes(updateKey(a.id, a.score))).map((a) => a.id)));
  const fullNames = teacherFullNames(c?.teacherIds ?? [], users.map((u) => ({ ...u, id: u.personId })));
  return <PortalShell portal="student" maxWidth={930}>{c ? <>
    <div className="relative px-9 pb-[19px] pt-2.5">
      <h1 className="flex flex-wrap items-baseline gap-x-3 text-[25px] font-light leading-9"><span><strong className="font-semibold">{c.id}:</strong> {courseTitle(c)}</span><span className="text-[14px] italic text-vc-gray">{fullNames}</span></h1>
      <Link to="/class/$classId" params={{ classId }} className="absolute right-3 top-3 flex items-center gap-1 text-[12px] text-vc-link">View Class Website <ArrowRight className="size-3" /></Link>
    </div>
    <div className="flex pl-[26px]">{[['', 'All Assignments'], ['detail', 'Grade Detail']].map(([v, label]) => <Link key={v} to="/grades/$classId" params={{ classId }} search={v ? { tab: 'detail' } : {}} className={`px-[15px] py-[9px] text-[14.5px] leading-5 ${Boolean(tab) === Boolean(v) ? 'bg-vc-bar font-semibold text-foreground' : 'text-vc-gray'}`}>{label}</Link>)}</div>
    {tab ? <Detail list={list} c={c} /> : <AllAssignments list={list} teacherName={faculty} fresh={fresh} startFilter={startFilter ?? 'all'} />}</> : <p className="p-8">You're not enrolled in this class.</p>}</PortalShell>;
}
function AllAssignments({ list, teacherName, fresh, startFilter }: { list: Assignment[]; teacherName: string; fresh: Set<string>; startFilter: string }) {
  const { comments, aStatus, user, weights } = useSchool();
  const { read, markRead } = usePortal();
  const [filter, setFilter] = useState(startFilter); const [sort, setSort] = useState('date'); const [expanded, setExpanded] = useState<string | null>(null);
  const feedback = (a: Assignment) => comments[`a|${a.id}|${user?.personId}`] ?? '';
  const status = (a: Assignment) => aStatus[`${a.id}|${user?.personId}`] ?? '';
  const shown = list.filter((a) => filter === 'all' || (filter === 'updates' ? fresh.has(a.id) : filter === 'feedback' ? Boolean(feedback(a)) : filter === 'problems' ? ['Missing', 'Incomplete', 'Late'].includes(status(a)) : a.score === undefined && a.due >= today()));
  const groups: { key: string; label: string; items: Assignment[] }[] = [];
  for (const a of shown) { const start = startOfWeek(a.due); const key = sort === 'type' ? a.category : String(+start); let group = groups.find((g) => g.key === key); if (!group) { group = { key, label: sort === 'type' ? category(a.category) : `${format(start, 'MMMM d')} - ${format(addDays(start, 6), 'MMMM d')}`, items: [] }; groups.push(group); } group.items.push(a); }
  const FILTERS: [string, string, string][] = [['all', 'All Assignments', ''], ['updates', 'New Updates', 'bg-vc-hint text-foreground/70'], ['notifications', 'Notifications', 'text-vc-notify'], ['feedback', 'Feedback', 'text-vc-comment'], ['problems', 'Problems', 'text-destructive']];
  const chip = (on: boolean, extra = '') => `h-[19px] rounded-none px-[5px] text-[13px] font-medium leading-[19px] ${on ? 'bg-foreground font-semibold text-background hover:bg-foreground hover:text-background' : `hover:bg-transparent ${extra}`}`;
  return <>
    <div className="flex flex-wrap items-center justify-between gap-2 bg-vc-bar px-[26px] py-[7px]">
      <div className="flex gap-[7px]">{FILTERS.map(([v, label, extra]) => <Button key={v} size="sm" variant="ghost" onClick={() => setFilter(v)} className={chip(filter === v, extra)}>{label}</Button>)}</div>
      <div className="flex items-center gap-2 text-[12.5px]"><span className="text-vc-gray">sort by:</span>{[['date', 'Due Date'], ['type', 'Assignment Type']].map(([v, label]) => <Button key={v} size="sm" variant="ghost" onClick={() => setSort(v ?? 'date')} className={chip(sort === v)}>{label}</Button>)}</div>
    </div>
    {groups.map((g) => <section key={g.key}>
      <h2 className="border-b border-vc-line px-7 pb-[7px] pt-6 text-[20px] leading-7">{g.label} <span className="text-[14px] font-medium text-vc-gray-dark">({g.items.length} assignments)</span></h2>
      {g.items.map((a) => {
        const color = categoryColor(weights[a.courseId], a.category); const open = expanded === a.id; const fb = feedback(a); const flag = status(a);
        const isNew = a.score !== undefined && !read.includes(updateKey(a.id, a.score));
        const hasNotes = a.notes.trim() !== '';
        return <div key={a.id} className={`border-b border-vc-line ${isNew ? 'bg-vc-note' : ''}`}>
          <button type="button" aria-expanded={open} onClick={() => { setExpanded(open ? null : a.id); if (a.score !== undefined) markRead(updateKey(a.id, a.score)); }} className={`flex min-h-[46px] w-full cursor-pointer items-center pl-7 pr-7 text-left text-[14px] ${open && !isNew ? 'bg-vc-bar' : ''}`}>
            {fb && <CommentsSolid aria-label="Has feedback" className="mr-[13px] h-[16px] w-[17px] shrink-0 text-vc-comment" />}
            <b className="w-[52px] shrink-0 font-semibold">{format(a.due, 'MMM dd')}</b><b className="w-[44px] shrink-0 font-semibold">{format(a.due, 'EEE')}</b>
            <span className="flex min-w-0 flex-1 items-center gap-2.5 py-2"><span className="flex shrink-0 items-stretch"><span className="w-[3px] shrink-0" style={{ background: color }} /><span className="bg-vc-bar px-1.5 text-[14.5px] font-semibold leading-[26px]" style={{ color }}>{category(a.category)}</span></span><span className="min-w-0 break-words text-[15px]">{a.title}</span></span>
            {a.score === undefined ? <span className={`shrink-0 pl-3 text-[14px] ${flag || a.due >= today() ? 'italic text-vc-gray-dark' : ''}`}>{flag || (a.due >= today() ? 'Pending' : 'Complete')}</span> : <span className="flex shrink-0 items-stretch pl-3 text-[17px] leading-[21px]"><strong className="bg-background px-[6px] font-bold">{a.score}</strong><span className="min-w-[27px] bg-vc-bar px-[5px] text-center font-light text-vc-gray-dark">{a.points}</span></span>}
          </button>
          {open && <div className={`grid gap-8 px-7 pb-6 pt-5 text-[14px] ${isNew ? '' : 'bg-background'} ${fb ? 'md:grid-cols-[54fr_46fr]' : ''}`}>
            <div>
              <div className="flex gap-[34px]">{[['DATE ASSIGNED', a.assigned], ['DUE DATE', a.due]].map(([label, d]) => <div key={String(label)}><div className="text-[12px] font-light uppercase leading-5 text-vc-gray-dark">{String(label)}</div><div className="text-[16px] font-semibold leading-5">{format(d as Date, 'EEE, MMM dd')}</div></div>)}</div>
              {hasNotes && <p className="mt-[18px] whitespace-pre-wrap text-[14px] leading-[17px]">{a.notes}</p>}
            </div>
            {fb && <div>
              <h3 className="text-[13px] font-bold uppercase leading-5">Assignment Feedback</h3>
              <div className="mt-2.5 flex justify-end"><span className="border-r-[3px] border-vc-comment bg-vc-bar px-2 text-[14px] font-semibold leading-[20px] text-vc-comment">{teacherName}</span></div>
              <p className="mt-5 whitespace-pre-wrap pl-[50px] text-justify text-[14px] leading-[17px]">{fb}</p><div className="mt-4 border-b border-dotted border-vc-gray-light" />
            </div>}
          </div>}
        </div>;
      })}
    </section>)}
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
        <div className="grade-print-action flex h-10 items-center justify-end bg-foreground px-5 text-background"><Button variant="ghost" size="sm" className="h-10 text-[17px] font-normal hover:bg-transparent hover:text-background" onClick={() => window.print()}><Printer className="size-4" />Print to <span className="text-destructive">PDF</span></Button></div>
        <div className="px-5 pb-5 pt-6">
          <h2 className="text-[32px] font-bold leading-10">Grade Detail - {term?.label ?? 'Grades'}</h2>
          <div className="mt-[13px] flex flex-wrap items-start justify-between gap-3 md:max-w-[684px]"><div className="text-[18px] leading-[21px]"><b>{user?.first} {user?.last}</b><span className="text-[14px] text-vc-gray"> - Grade {user?.grade ?? '-'}</span><br /><b>{courseTitle(c)}</b> - {faculty}<br /><span className="text-[16px]">Weighting by {w.length ? 'Assignment Type' : 'Assignment Points'}</span></div>
            <GradeCalculation items={calc} weights={w}><span className="mr-0 mt-[11px] flex shrink-0 bg-vc-bar md:mr-[51px] text-[36px] leading-[59px]"><span className="border-r border-vc-gray-light/70 px-[14px]">{avg === null ? '-' : avg.toFixed(2)}</span><span className="px-[10px]">{posted || (avg === null ? '-' : letterFor(avg))}</span></span></GradeCalculation>
          </div>
          <h3 className="mb-[15px] mt-5 flex items-center gap-2 text-[24px] font-bold leading-7">Summary <span aria-hidden className="grid size-[15px] place-items-center rounded-full bg-vc-link-strong/30 text-[10px] font-bold leading-none text-background">?</span></h3>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] table-fixed text-[16px] md:w-[684px]"><colgroup><col />{w.length > 0 && <col className="w-[109px]" />}<col className="w-[109px]" /><col className="w-[109px]" /><col className="w-[109px]" /></colgroup><thead className="border-b border-foreground/40 bg-vc-bar text-[15px] leading-[18px] [&_th]:h-[41px] [&_th]:border-l [&_th]:border-[#d5d5d5] [&_th]:px-1 [&_th]:pb-[3px] [&_th]:pt-0 [&_th]:align-bottom [&_th:first-child]:border-l-0"><tr><th className="text-center">Assignment Type</th>{w.length > 0 && <th className="text-right">Weighting</th>}<th className="text-right">Points<br />Earned</th><th className="text-right">Points<br />Possible</th><th className="text-right">Average<span className="text-destructive">*</span></th></tr></thead><tbody>{summaryWeights.map((x) => { const st = categoryStats(calc.filter((a) => a.category === x.cat), x.drop); return <tr key={x.cat} className="h-[26.5px] leading-[26px] [&_td]:py-0 [&_td]:pr-[3px]"><td className="pl-1"><b>{category(x.cat)}</b> <span className="text-[13px] text-muted-foreground">({st.count} assignments)</span></td>{w.length > 0 && <td className="text-right"><span className="inline-block bg-vc-bar px-1 text-right leading-[18px]" style={{ minWidth: `${x.weight * 2.1}px` }}>{x.weight.toFixed(2)}%</span></td>}<td className="text-right">{st.pct === null ? '-' : st.earned.toFixed(2)}</td><td className="text-right">{st.pct === null ? '-' : st.possible.toFixed(2)}</td><td className="text-right">{st.pct === null ? '-' : st.pct.toFixed(2)}</td></tr>; })}</tbody></table></div>
          <h3 className="mb-[15px] mt-[10px] flex items-center gap-2 text-[24px] font-bold leading-7">Assignments <span aria-hidden className="grid size-[15px] place-items-center rounded-full bg-vc-link-strong/30 text-[10px] font-bold leading-none text-background">?</span></h3>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] table-fixed text-[16px] [&_td]:px-[3px]"><colgroup><col className="w-[71px]" /><col /><col className="w-[104px]" /><col className="w-[69px]" /><col className="w-[69px]" /><col className="w-[70px]" /></colgroup><thead className="border-b border-foreground/40 bg-vc-bar text-[15px] leading-[18px] [&_th]:h-[41px] [&_th]:border-l [&_th]:border-[#d5d5d5] [&_th]:px-1 [&_th]:pb-[3px] [&_th]:pt-0 [&_th]:align-bottom [&_th:first-child]:border-l-0"><tr><th className="whitespace-nowrap text-left">Due Date</th><th className="text-center">Assignment</th><th className="text-right">Score</th><th className="text-right">Grade</th><th className="text-right">Points<br />Earned</th><th className="text-right">Points<br />Possible</th></tr></thead>
            {categories.map((cat) => { const group = items.filter((a) => a.category === cat).sort((a, b) => +a.due - +b.due); const st = categoryStats(calc.filter((a) => a.category === cat), w.find((x) => x.cat === cat)?.drop); return <tbody key={cat}><tr className="h-[5px]"><td colSpan={6} className="!p-0" /></tr><tr><td /><td className="h-[17px] !py-0 font-bold leading-[17px]">{category(cat)}</td><td colSpan={4} /></tr>{group.map((a) => { const flag = aStatus[`${a.id}|${user?.personId}`] ?? ''; const bad = ['Late', 'Incomplete', 'Missing'].includes(flag); return <tr key={a.id} className={`h-[22px] border-b border-foreground/20 leading-[21px] hover:bg-vc-hint ${bad ? 'italic text-destructive' : ''}`}><td className="whitespace-nowrap py-0">{format(a.due, 'MMM d')}</td><td className="truncate py-0"><Button variant="ghost" onClick={() => setAssignment(a)} className="h-auto max-w-full justify-start truncate whitespace-nowrap rounded-none p-0 text-left text-[16px] font-normal leading-[21px] hover:bg-transparent hover:text-vc-link-strong">{a.title}</Button></td><td className="whitespace-nowrap text-right text-[13px]">{bad ? flag : a.score === undefined ? '-' : `${a.score} / ${a.points}`}</td><td className="text-right">{pct(a) === null ? '-' : `${pct(a)?.toFixed(2)}%`}</td><td className="text-right">{a.score ?? '-'}</td><td className="text-right">{a.points}</td></tr>; })}<tr className="h-[22px] text-right font-bold leading-[21px]"><td colSpan={4} /><td className="py-0">{st.pct === null ? '-' : st.earned.toFixed(2)}</td><td>{st.pct === null ? '-' : st.possible}</td></tr></tbody>; })}
          </table></div>
        </div>
      </article>
    </div>
    <AssignmentDialog assignment={assignment} onClose={() => setAssignment(null)} />
  </>;
}
