import { createFileRoute, Link } from '@tanstack/react-router';
import { addDays, format, startOfWeek } from 'date-fns';
import { useState } from 'react';
import { usePortal } from '@/lib/portal-store';
import { updateKey } from '@/components/portal/ClassRow';
import { ArrowRight, Printer } from 'lucide-react';
import { CommentsSolid } from '@/components/portal/icons';
import { ErrorPage } from '@/components/common/ErrorPage';
import { PortalShell } from '@/components/portal/PortalShell';
import { Button } from '@/components/ui/button';
import { GradeCalculation } from "@/components/portal/GradeCalculation";
import { AssignmentDialog } from "@/components/portal/AssignmentDialog";
import { teacherFullNames, teacherNames } from "@/lib/student-presentation";
import { categoryColor } from '@/lib/category-colors';
import { courseTitle, today, type Assignment } from '@/lib/sis-data';
import { categoryStats, defaultWeights, letterFor, weightedAverage } from '@/lib/grading';
import { staffIds, useMySections, useSchool, useStudentAssignments, type Section } from '@/lib/school-store';
import { termById, termOn } from '@/lib/terms';
import { pageHead } from '@/lib/head';
import { Detail } from '@/components/portal/GradeDetail';

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
  const faculty = teacherNames(c ? staffIds(c) : [], users.map((u) => ({ ...u, id: u.personId })));
  const [fresh] = useState(() => new Set(list.filter((a) => a.score !== undefined && !read.includes(updateKey(a.id, a.score))).map((a) => a.id)));
  const fullNames = teacherFullNames(c ? staffIds(c) : [], users.map((u) => ({ ...u, id: u.personId })));
  return <PortalShell portal="student" maxWidth={930}>{c ? <>
    <div className="relative px-9 pb-[19px] pt-2.5">
      <h1 className="flex flex-wrap items-baseline gap-x-3 text-[25px] font-light leading-9"><span><strong className="font-semibold">{c.id}:</strong> {courseTitle(c)}</span><span className="text-[14px] italic text-vc-gray">{fullNames}</span></h1>
      <Link to="/class/$classId" params={{ classId }} className="absolute right-3 top-3 flex items-center gap-1 text-[12px] text-vc-link">View Class Website <ArrowRight className="size-3" /></Link>
    </div>
    <div className="flex pl-[26px]">{[['', 'All Assignments'], ['detail', 'Grade Detail']].map(([v, label]) => <Link key={v} to="/grades/$classId" params={{ classId }} search={v ? { tab: 'detail' } : {}} className={`px-[15px] py-[9px] text-[14.5px] leading-5 ${Boolean(tab) === Boolean(v) ? 'bg-vc-bar font-semibold text-foreground' : 'text-vc-gray'}`}>{label}</Link>)}</div>
    {tab ? <Detail list={list} c={c} /> : <AllAssignments list={list} teacherName={faculty} fresh={fresh} startFilter={startFilter ?? 'all'} />}</> : <ErrorPage fullPage={false} title="Access Restricted" message="You do not have access to this class." detail="You are not enrolled in this class." />}</PortalShell>;
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
