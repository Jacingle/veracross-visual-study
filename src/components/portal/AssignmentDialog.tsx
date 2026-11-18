import { format } from 'date-fns';
import { BarChart3, CalendarDays, CalendarPlus, FileText, PieChart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { categoryColor } from '@/lib/category-colors';
import { useSchool } from '@/lib/school-store';
import { courseTitle, type Assignment } from '@/lib/sis-data';
import { teacherNames } from '@/lib/student-presentation';

export function AssignmentDialog({ assignment, onClose }: { assignment: Assignment | null; onClose: () => void }) {
  const { sections, users, weights } = useSchool();
  const section = sections.find((s) => s.id === assignment?.courseId);
  const faculty = users.map((u) => ({ ...u, id: u.personId }));
  return <Dialog open={assignment !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent aria-describedby={undefined} className="w-[calc(100%-2rem)] max-w-[620px] gap-0 overflow-hidden rounded-none border-0 p-0 text-[13px] sm:rounded-none">
      {assignment && <>
        <DialogHeader className="flex-row items-start justify-between gap-4 space-y-0 bg-vc-panel px-5 py-4 text-left">
          <div className="min-w-0"><DialogTitle className="text-[16px] font-normal leading-5"><strong className="font-semibold">{assignment.courseId}:</strong> {section ? courseTitle(section) : ''}</DialogTitle><div className="mt-1 text-[12px] text-vc-gray">{section ? teacherNames(section.teacherIds, faculty) : ''}</div></div>
          <span className="mr-6 text-[12px] font-semibold text-vc-gray-dark">ASSIGNMENT</span>
        </DialogHeader>
        <div className="px-5 pb-12 pt-8">
          <div className="text-[12px] font-semibold uppercase" style={{ color: categoryColor(weights[assignment.courseId], assignment.category) }}>{assignment.category}</div>
          <h2 className="mt-1 text-[28px] font-semibold leading-9">{assignment.title}</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8">
            {([[CalendarPlus, 'Date Assigned', format(assignment.assigned, 'EEEE, MMM d')], [CalendarDays, 'Due Date', format(assignment.due, 'EEEE, MMM d')], [BarChart3, 'Max Score', String(assignment.points)], [PieChart, 'Weight', String(assignment.points)]] as const).map(([Icon, label, value]) => <div key={label} className="flex min-w-0 items-center gap-3"><Icon className="size-7 shrink-0" strokeWidth={1.5} /><div className="min-w-0 border-l border-vc-line py-1 pl-3"><div className="text-[12px] text-vc-gray">{label}</div><div className="text-[16px] font-semibold leading-5">{value}</div></div></div>)}
          </div>
          <div className="mt-8 flex gap-3"><FileText className="mt-2 size-7 shrink-0" strokeWidth={1.5} /><div className="min-w-0 border-l border-vc-line pl-3"><div className="text-[12px] text-vc-gray">Notes</div><p className="mt-4 whitespace-pre-wrap text-[13px]">{assignment.notes || '-'}</p></div></div>
        </div>
      </>}
    </DialogContent>
  </Dialog>;
}