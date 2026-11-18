import { format } from 'date-fns';
import { BarChart3, CalendarDays, CalendarPlus, FileText, Info, PieChart, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { categoryColor } from '@/lib/category-colors';
import { useSchool } from '@/lib/school-store';
import { courseTitle, type Assignment } from '@/lib/sis-data';
import { teacherNames } from '@/lib/student-presentation';

/**
 * The assignment pop-up shared by the class website, home, calendar, schedule and assignment center:
 * a bar in the assignment type's color, the title, then the due date, notes and class rows.
 * `detailed` adds the assigned date, max score and weight rows used in the assignment center.
 */
export function AssignmentDialog({ assignment, onClose, detailed = true }: { assignment: Assignment | null; onClose: () => void; detailed?: boolean }) {
  const { sections, users, weights } = useSchool();
  const section = sections.find((s) => s.id === assignment?.courseId);
  const faculty = users.map((u) => ({ ...u, id: u.personId }));
  const color = assignment ? categoryColor(weights[assignment.courseId], assignment.category) : '#3a8fd1';
  const Row = ({ icon: Icon, children, bold }: { icon: typeof FileText; children?: React.ReactNode; bold?: boolean }) => (
    <div className="flex min-h-[44px] items-center gap-[22px] border-b border-vc-line px-[46px] py-2 last:border-b-0"><Icon className="size-[22px] shrink-0 text-foreground" strokeWidth={1.5} />
      <div className={bold ? 'text-[21px] font-semibold' : 'text-[15px]'}>{children}</div></div>);
  return <Dialog open={assignment !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent aria-describedby={undefined} showCloseButton={false} overlay={detailed} className={`w-[calc(100%-2rem)] max-w-[470px] ${detailed ? '' : '!top-[16%] !translate-y-0'} gap-0 overflow-hidden rounded-[2px] border border-vc-gray-light p-0 shadow-[0_2px_8px_rgba(0,0,0,.35)] sm:rounded-[2px]`}>
      {assignment && <>
        <div className="flex h-[46px] items-center justify-between px-4 text-primary-foreground" style={{ background: color }}>
          <span className="text-[15px] font-semibold uppercase tracking-wide">{assignment.category}</span>
          <DialogClose aria-label="Close" className="grid size-6 place-items-center outline-none"><X className="size-5" strokeWidth={4} /></DialogClose>
        </div>
        <DialogHeader className="space-y-0 border-b border-vc-line px-4 pb-4 pt-5 text-left">
          <DialogTitle className="text-[28px] font-normal leading-9">{assignment.title}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Row icon={CalendarDays} bold>{format(assignment.due, 'EEE, MMM d')}</Row>
          {detailed && <><Row icon={CalendarPlus}><span className="text-vc-gray">Assigned</span> <strong>{format(assignment.assigned, 'EEE, MMM d')}</strong></Row>
            <Row icon={BarChart3}><span className="text-vc-gray">Max Score</span> <strong>{assignment.points}</strong></Row>
            <Row icon={PieChart}><span className="text-vc-gray">Weight</span> <strong>{assignment.points}</strong></Row></>}
          <Row icon={FileText}><span className="whitespace-pre-wrap">{assignment.notes}</span></Row>
          <Row icon={Info}><span className="italic text-vc-gray-dark">{section ? `${courseTitle(section)} - ${teacherNames(section.teacherIds, faculty)}` : ''}</span></Row>
        </div>
      </>}
    </DialogContent>
  </Dialog>;
}
