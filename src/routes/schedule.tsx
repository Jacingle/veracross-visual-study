import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { addDays, format, parseISO, isValid, isSameDay } from 'date-fns';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { PortalShell, StudentTabs } from '@/components/portal/PortalShell';
import { AssignmentDialog } from '@/components/portal/AssignmentDialog';
import { Button } from '@/components/ui/button';
import { today, courseTitle, events, type Assignment } from '@/lib/sis-data';
import { useMySections, useStudentAssignments, useSchool } from '@/lib/school-store';
import { meetingsOn } from '@/lib/scheduling';
import { scheduleTime, teacherNames } from '@/lib/student-presentation';
import { pageHead } from '@/lib/head';

export const Route = createFileRoute('/schedule')({
  validateSearch: z.object({ date: z.string().optional(), view: z.enum(['student', 'school']).optional() }),
  head: () => pageHead('Daily Schedule', 'Your class schedule for the day, with blocks, rooms and homework.'),
  component: Schedule,
});

function Schedule() {
  const { date, view = 'student' } = Route.useSearch();
  const nav = useNavigate({ from: '/schedule' });
  const parsed = date ? parseISO(date) : today();
  const d = isValid(parsed) ? parsed : today();
  const go = (n: number) => nav({ search: (p) => ({ ...p, date: format(addDays(d, n), 'yyyy-MM-dd') }) });
  const mine = useMySections();
  const { schedulingSets, users } = useSchool();
  const faculty = users.map((u) => ({ ...u, id: u.personId }));
  const periods = mine.flatMap((c) => meetingsOn(c, schedulingSets, d).map((b) => ({ start: b.start, time: scheduleTime(b.start), title: courseTitle(c), detail: [teacherNames(c.teacherIds, faculty), b.name || c.block, c.room].filter(Boolean).join(' • '), courseId: c.id }))).sort((a, b) => a.start.localeCompare(b.start));
  const all = useStudentAssignments();
  const [selected, setSelected] = useState<Assignment | null>(null);
  const dayEvents = events().filter((e) => isSameDay(e.date, d));
  return <PortalShell portal="student">
    <StudentTabs />
    <div className="grid grid-cols-1 items-start gap-3 px-5 pt-6 sm:grid-cols-[1fr_auto_1fr]">
      <div className="flex justify-self-start border border-vc-line shadow-sm">
        <Button variant="ghost" aria-label="Previous Day" title="Previous Day" onClick={() => go(-1)} className="h-8 rounded-none px-3.5 text-vc-gray"><ChevronLeft className="size-4" /></Button>
        <label className="relative flex cursor-pointer items-center gap-1 border-x border-vc-line px-3.5 text-vc-gray-dark hover:bg-vc-panel"><CalendarDays className="size-4" /><ChevronDown className="size-3" /><input aria-label="Schedule date" type="date" className="absolute inset-0 w-full opacity-0" value={format(d, 'yyyy-MM-dd')} onChange={(e) => e.target.value && nav({ search: (p) => ({ ...p, date: e.target.value }) })} /></label>
        <Button variant="ghost" aria-label="Next Day" title="Next Day" onClick={() => go(1)} className="h-8 rounded-none px-3.5 text-vc-gray"><ChevronRight className="size-4" /></Button>
      </div>
      <div className="text-center sm:order-none"><div className="text-[19px] font-semibold text-foreground/80">{format(d, 'EEEE, MMM d')}</div>{periods.length > 0 && <div className="mt-1 text-[15px] text-foreground/75">{format(d, 'EEEE')}</div>}</div>
      <div className="flex justify-self-center border border-vc-line text-[13px] shadow-sm sm:justify-self-end">
        {(['student', 'school'] as const).map((v) => <Button key={v} variant="ghost" onClick={() => nav({ search: (p) => ({ ...p, view: v }) })} className={`h-8 rounded-none px-3.5 text-[13px] font-semibold ${view === v ? 'bg-vc-link text-primary-foreground hover:bg-vc-link hover:text-primary-foreground' : ''}`}>{v === 'student' ? 'Student Schedule' : 'School Schedule'}</Button>)}
      </div>
    </div>
    <div className="px-5 pb-8 pt-8 sm:px-10">
      {dayEvents.map((e) => <div key={e.title} className="mb-7 bg-vc-sky px-3 py-4 text-[13px] text-vc-link-strong">{e.title}</div>)}
      {periods.length === 0 && <div className="pb-14 pt-1 text-center"><CalendarDays className="mx-auto size-7" strokeWidth={1.5} /><h2 className="mt-6 text-[26px] font-semibold">Nothing Scheduled</h2><p className="mt-5 text-[13px]">Nothing is scheduled for this day</p></div>}
      {periods.map((p, i) => {
        const hw = view === 'student' ? all.filter((a) => a.courseId === p.courseId && isSameDay(a.due, d)) : [];
        return <div key={`${p.courseId}-${i}`} className="grid grid-cols-[60px_minmax(0,1fr)] items-start gap-x-4 border-b border-vc-line py-2 sm:grid-cols-[60px_280px_minmax(0,1fr)]">
          <div className="pt-0.5 text-right text-[13px] font-semibold">{p.time}</div>
          <div className="border-l-2 border-vc-link pl-4"><div className="text-[16px] leading-5">{p.title}</div><div className="mt-1 text-[12px] text-vc-gray">{p.detail}</div></div>
          <div className="col-start-2 mt-2 space-y-2 sm:col-start-3 sm:mt-0">{hw.map((a) => <div key={a.id} className="flex items-start gap-5"><span className="mt-0.5 border border-vc-gray-dark px-1 py-0.5 text-[10px] text-vc-gray-dark">{a.category}</span><Button variant="ghost" onClick={() => setSelected(a)} className="h-auto min-w-0 whitespace-normal rounded-none p-0 text-left text-[13px] font-normal hover:bg-transparent hover:text-vc-link-strong">{a.title}</Button></div>)}</div>
        </div>;
      })}
    </div>
    <AssignmentDialog assignment={selected} onClose={() => setSelected(null)} />
  </PortalShell>;
}
