import { createFileRoute, Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { PortalShell, StudentTabs } from '@/components/portal/PortalShell';
import { teacherShort, today } from '@/lib/sis-data';
import { useMySections, useSchool, useStudentAssignments } from '@/lib/school-store';
import { categoryColor } from '@/lib/category-colors';
import { pageHead } from '@/lib/head';

export const Route = createFileRoute('/updates')({
  head: () => pageHead('Recent Updates', 'Assignment due dates, published scores and recorded attendance for your classes.'),
  component: Updates,
});

function Updates() {
  const assignments = useStudentAssignments();
  const sections = useMySections();
  const { attendance, attDone, user, weights } = useSchool();
  const sid = user?.personId ?? '';
  const events = [
    ...assignments.filter((a) => +a.due <= +today() + 86399999).map((a) => ({ id: a.id, date: a.due, courseId: a.courseId, kind: a.score === undefined ? 'ASSIGNMENT DUE' : 'GRADE UPDATE', category: a.category, title: a.title, score: a.score === undefined ? '' : `${a.score} / ${a.points}`, dateLabel: 'DUE DATE' })),
    ...sections.flatMap((c) => attDone.filter((key) => key.startsWith(`${c.id}|`)).map((key) => { const day = key.split('|')[1] ?? ''; return { id: key, date: new Date(`${day}T12:00:00`), courseId: c.id, kind: 'CLASS ATTENDANCE', category: attendance[`${key}|${sid}`] ?? 'Present', title: 'Class Attendance', score: '', dateLabel: 'DATE' }; })),
  ].filter((e) => Number.isFinite(+e.date)).sort((a, b) => +b.date - +a.date).slice(0, 50);
  const dates = [...new Set(events.map((e) => format(e.date, 'yyyy-MM-dd')))];
  return <PortalShell portal="student"><StudentTabs /><div className="px-5 py-6 sm:px-12">
    {dates.map((day) => <section key={day} className="mb-6"><h2 className="mb-3 text-center text-[20px] font-semibold">{format(new Date(`${day}T12:00:00`), 'EEEE, MMM d')}</h2>
      {events.filter((e) => format(e.date, 'yyyy-MM-dd') === day).map((e) => { const c = sections.find((s) => s.id === e.courseId); return <div key={e.id} className="grid grid-cols-1 gap-3 border-y border-l-2 border-vc-line border-l-vc-link px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_150px]"><div><span className="bg-vc-tile px-1.5 py-1 text-[10px] text-vc-link-strong">{e.kind}</span><div className="mt-2 text-[13px]">{c?.code}: {c?.name} <span className="text-[12px] text-muted-foreground">{c ? teacherShort(c.teacherId) : ''}</span></div></div><div><span className="border border-vc-line px-1 py-0.5 text-[10px]" style={e.kind === 'CLASS ATTENDANCE' ? undefined : { borderColor: categoryColor(weights[e.courseId], e.category) }}>{e.category}</span><div className="mt-2 text-[14px] font-semibold">{e.kind === 'CLASS ATTENDANCE' ? e.title : <Link to="/grades/$classId" params={{ classId: e.courseId }} className="hover:text-vc-link-strong">{e.title}</Link>}{e.score && <span className="ml-3 text-vc-link-strong">{e.score}</span>}</div></div><div className="flex gap-2 text-muted-foreground"><CalendarDays className="mt-1 size-5" /><div><div className="text-[10px]">{e.dateLabel}</div><div className="text-[13px] font-semibold">{format(e.date, 'EEE, MMM d')}</div></div></div></div>; })}
    </section>)}
    {!events.length && <p className="py-12 text-center text-[14px] text-muted-foreground">No recent updates.</p>}
  </div></PortalShell>;
}
