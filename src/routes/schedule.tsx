import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { addDays, format, parseISO, isValid, isSameDay } from 'date-fns';
import { Calendar, CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const periods = mine.flatMap((c) => meetingsOn(c, schedulingSets, d).map((b) => ({ start: b.start, time: scheduleTime(b.start), title: courseTitle(c), detail: [teacherNames(c.teacherIds, faculty), b.name || c.block, c.room].filter(Boolean).join(' • '), courseId: c.id, kind: /^(lunch|office hours|break)\b/i.test(courseTitle(c)) ? 'break' : 'class' }))).sort((a, b) => a.start.localeCompare(b.start));
  const all = useStudentAssignments();
  const [selected, setSelected] = useState<Assignment | null>(null);
  const dayEvents = events().filter((e) => isSameDay(e.date, d));
  return <PortalShell portal="student">
    <StudentTabs />
    <div className="grid grid-cols-1 items-start gap-3 px-5 pt-6 sm:grid-cols-[1fr_auto_1fr] sm:pr-8">
      <div className="flex h-[34px] justify-self-start overflow-hidden rounded-[4px] border border-vc-gray-light bg-gradient-to-b from-background to-vc-panel shadow-[0_1px_1px_rgba(0,0,0,.22)]">
        <Button variant="ghost" aria-label="Previous Day" title="Previous Day" onClick={() => go(-1)} className="h-full w-[45px] rounded-none px-0 text-foreground/70 hover:bg-transparent hover:text-foreground"><ChevronLeft className="size-5" strokeWidth={1.25} /></Button>
        <label className="relative flex w-[62px] cursor-pointer items-center justify-center gap-1 border-x border-vc-gray-light/70 px-0 text-foreground/70 [--cut:var(--background)] hover:bg-vc-panel hover:[--cut:var(--vc-panel)]"><CalendarDays className="size-4 fill-current stroke-(--cut)" /><ChevronDown className="size-3" /><input aria-label="Schedule date" type="date" className="absolute inset-0 w-full opacity-0" value={format(d, 'yyyy-MM-dd')} onChange={(e) => e.target.value && nav({ search: (p) => ({ ...p, date: e.target.value }) })} /></label>
        <Button variant="ghost" aria-label="Next Day" title="Next Day" onClick={() => go(1)} className="h-full w-[45px] rounded-none px-0 text-foreground/70 hover:bg-transparent hover:text-foreground"><ChevronRight className="size-5" strokeWidth={1.25} /></Button>
      </div>
      <div className="text-center sm:order-none"><div className="text-[20px] font-semibold leading-7 text-foreground/80">{format(d, 'EEEE, MMM d')}</div>{periods.length > 0 && <div className="text-[19px] leading-7 text-foreground/75">{format(d, 'EEEE')}</div>}</div>
      <div className="flex h-[34px] justify-self-center overflow-hidden rounded-[4px] border border-vc-gray-light bg-gradient-to-b from-background to-vc-panel shadow-[0_1px_1px_rgba(0,0,0,.22)] sm:justify-self-end">
        {(['student', 'school'] as const).map((v) => <Button key={v} variant="ghost" onClick={() => nav({ search: (p) => ({ ...p, view: v }) })} className={`h-full rounded-none px-[17px] text-[15px] font-semibold ${view === v ? 'bg-vc-toggle text-primary-foreground hover:bg-vc-toggle hover:text-primary-foreground' : 'text-foreground/80 hover:bg-transparent'}`}>{v === 'student' ? 'Student Schedule' : 'School Schedule'}</Button>)}
      </div>
    </div>
    <div className="px-5 pb-8 pt-[35px] sm:px-[46px]">
      {dayEvents.map((e) => <div key={e.title} className="mb-[35px] flex min-h-[51px] items-center bg-vc-sky px-2.5 text-[14px] text-vc-link-strong">{e.time && <b className="mr-1.5 font-semibold">{e.time}</b>}{e.title}</div>)}
      {periods.length === 0 && <div className="pb-24 text-center"><Calendar className="mx-auto size-[26px] text-foreground" strokeWidth={1.6} /><h2 className="mt-[26px] text-[27px] font-semibold leading-8 text-foreground/80">Nothing Scheduled</h2><p className="mt-[22px] text-[14.5px] leading-5 text-foreground">Nothing is scheduled for this day</p></div>}
      {periods.map((p, i) => {
        const hw = view === 'student' ? all.filter((a) => a.courseId === p.courseId && isSameDay(a.due, d)) : [];
        return <div key={`${p.courseId}-${i}`} className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-x-[18px] border-b border-vc-line py-2.5 sm:grid-cols-[56px_300px_minmax(0,1fr)]">
          <div className="pt-0.5 text-right text-[14px] font-semibold leading-5 text-foreground/85">{p.time}</div>
          <div className={`border-l-[3px] pl-4 ${p.kind === 'break' ? 'border-vc-tile-warm-fg' : 'border-vc-link'}`}><div className="text-[17px] leading-6 text-foreground/90">{p.title}</div><div className="text-[13px] leading-5 text-vc-gray">{p.detail}</div></div>
          <div className="col-start-2 mt-2 space-y-2 sm:col-start-3 sm:mt-0">{hw.map((a) => <div key={a.id} className="flex items-start gap-8 pt-0.5"><span className="mt-0.5 border border-foreground/70 px-1.5 py-[3px] text-[10.5px] uppercase leading-[14px] text-foreground/80">{a.category}</span><Button variant="ghost" onClick={() => setSelected(a)} className="mt-1 h-auto min-w-0 whitespace-normal rounded-none p-0 text-left text-[14px] font-normal hover:bg-transparent hover:text-vc-link-strong">{a.title}</Button></div>)}</div>
        </div>;
      })}
    </div>
    <AssignmentDialog assignment={selected} onClose={() => setSelected(null)} />
  </PortalShell>;
}
