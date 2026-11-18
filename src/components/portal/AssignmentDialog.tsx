import { format } from 'date-fns';
import { Calendar, ChartNoAxesColumn, ChartPie, NotepadText, SquarePlus } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { categoryColor } from '@/lib/category-colors';
import { useSchool } from '@/lib/school-store';
import { courseTitle, type Assignment } from '@/lib/sis-data';
import { teacherNames } from '@/lib/student-presentation';

type Glyph = ComponentType<{ className?: string; strokeWidth?: number }>;

/** One fact in the pop-up grid: an outlined icon, a thin rule, a light label and the value beneath it. */
function Fact({ icon: Icon, label, wide = false, children }: { icon: Glyph; label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`flex items-start gap-2.5 ${wide ? 'col-span-2' : ''}`}>
      <Icon className="mt-0.5 size-7 shrink-0 text-foreground" strokeWidth={1.4} />
      <div className="min-h-[54px] min-w-0 border-l border-vc-gray-light/60 pl-2.5">
        <div className="text-[14px] font-light leading-6 text-vc-gray-dark">{label}</div>
        {children}
      </div>
    </div>
  );
}

/**
 * The assignment pop-up shared by Home, My Calendar, Daily Schedule, the class pages and the assignment
 * center. It opens over the current page (nothing navigates): a gray class header, the type in its
 * category color, the title, then date assigned / due date / max score / weight and the notes.
 * `detailed` is kept for older callers; every caller now gets the same view.
 */
export function AssignmentDialog({ assignment, onClose }: { assignment: Assignment | null; onClose: () => void; detailed?: boolean }) {
  const { sections, users, weights } = useSchool();
  const section = sections.find((s) => s.id === assignment?.courseId);
  const faculty = users.map((u) => ({ ...u, id: u.personId }));
  const color = assignment ? categoryColor(weights[assignment.courseId], assignment.category) : undefined;
  return (
    <Dialog open={assignment !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent aria-describedby={undefined} showCloseButton={false} className="!top-[109px] w-[calc(100%-2rem)] max-w-[640px] !translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-[0_2px_10px_rgba(0,0,0,.35)] sm:rounded-none">
        {assignment && <>
          <div className="flex min-h-[68px] items-start justify-between gap-4 bg-vc-panel px-5 pb-3 pt-3.5">
            <div className="min-w-0">
              <div className="text-[17px] font-light leading-6"><strong className="font-semibold">{section?.id ?? assignment.courseId}:</strong> {section ? courseTitle(section) : ''}</div>
              <div className="text-[13px] font-light leading-5 text-vc-gray-dark">{section ? teacherNames(section.teacherIds, faculty) : ''}</div>
            </div>
            <div className="shrink-0 pt-1 text-[13px] font-semibold uppercase tracking-wide text-vc-gray-dark">Assignment</div>
          </div>
          <div className="px-5 pb-9 pt-7">
            <div className="text-[14px] font-semibold uppercase leading-5" style={{ color }}>{assignment.category}</div>
            <DialogTitle className="mt-0.5 break-words text-[30px] font-semibold leading-9 text-foreground/80">{assignment.title}</DialogTitle>
            <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-6">
              <Fact icon={SquarePlus} label="Date Assigned"><div className="text-[19px] font-semibold leading-7">{format(assignment.assigned, 'EEEE, MMM d')}</div></Fact>
              <Fact icon={Calendar} label="Due Date"><div className="text-[19px] font-semibold leading-7">{format(assignment.due, 'EEEE, MMM d')}</div></Fact>
              <Fact icon={ChartNoAxesColumn} label="Max Score"><div className="text-[19px] font-semibold leading-7">{assignment.points}</div></Fact>
              <Fact icon={ChartPie} label="Weight"><div className="text-[19px] font-semibold leading-7">1</div></Fact>
              {assignment.notes.trim() !== '' && <Fact icon={NotepadText} label="Notes" wide><div className="mt-3 whitespace-pre-wrap text-[15px] leading-6">{assignment.notes}</div></Fact>}
            </div>
          </div>
        </>}
      </DialogContent>
    </Dialog>
  );
}
