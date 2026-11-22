import { Link } from '@tanstack/react-router';
import { fmtGrade } from "@/lib/fmt-grade";
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
import { staffIds, useMySections, useSchool, useStudentAssignments, type Section } from '@/lib/school-store';
import { termById, termOn } from '@/lib/terms';
import { pageHead } from '@/lib/head';

const category = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const pct = (a: Assignment) => a.score !== undefined && a.points > 0 ? a.score / a.points * 100 : null;

export type DetailStudent = { personId: string; first: string; last: string; grade?: number | undefined };
/** The Grade Detail paper. Students see their own; a teacher opens it for any student in the class. */
export function Detail({ list, c, student, standalone = false }: { list: Assignment[]; c: Section; student?: DetailStudent; standalone?: boolean }) {
  const { weights, user: me, termGrades, custom, users, aStatus } = useSchool();
  const user = student ?? me;
  const terms = c.terms.map(termById).filter((t) => t !== undefined);
  const [selected, setSelected] = useState(termOn(c.terms, today())?.id ?? c.terms[0] ?? '');
  const term = terms.find((t) => t.id === selected);
  const items = list.filter((a) => !term || (a.due >= term.start && +a.due <= +term.end + 86399999));
  const calc = items.filter((a) => custom.find((x) => x.id === a.id)?.inCalc !== false);
  const w = weights[c.id] ?? [];
  const avg = weightedAverage(calc, w);
  const summaryWeights = (w.length ? [...w, ...defaultWeights(calc.map((a) => a.category)).filter((x) => !w.some((v) => v.cat === x.cat))] : defaultWeights(calc.map((a) => a.category))).sort((a, b) => a.cat.localeCompare(b.cat));
  const posted = termGrades[`${c.id}|${user?.personId}|${selected}`];
  const faculty = teacherNames(staffIds(c), users.map((u) => ({ ...u, id: u.personId })));
  const categories = [...new Set(items.map((a) => a.category))].sort();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  return <>
    {!standalone && <div className="grade-toolbar flex flex-wrap items-center gap-2 bg-vc-bar px-[26px] py-[7px] text-[12.5px]"><span className="text-vc-gray">view:</span>{terms.map((t) => <Button key={t.id} variant="ghost" size="sm" className={`h-[19px] rounded-none px-1.5 text-[12.5px] font-normal ${selected === t.id ? 'bg-foreground text-background hover:bg-foreground hover:text-background' : ''}`} onClick={() => setSelected(t.id)}>{t.label}</Button>)}</div>}
    <div className={`bg-vc-paper px-4 pb-[30px] md:px-[65px] ${standalone ? "min-h-screen pt-[10px]" : "pt-2.5"}`}>
      <article className={`grade-print border border-vc-line bg-background shadow-lg ${standalone ? "mx-auto max-w-[780px]" : ""}`}>
        <div className="grade-print-action flex h-10 items-center justify-end bg-foreground px-5 text-background"><Button variant="ghost" size="sm" className="h-10 text-[17px] font-normal hover:bg-transparent hover:text-background" onClick={() => window.print()}><Printer className="size-4" />Print to <span className="text-destructive">PDF</span></Button></div>
        <div className="px-5 pb-5 pt-6">
          <h2 className="text-[32px] font-bold leading-10">Grade Detail - {term?.label ?? 'Grades'}</h2>
          <div className="mt-[13px] flex flex-wrap items-start justify-between gap-3 md:max-w-[684px]"><div className="text-[18px] leading-[21px]"><b>{user?.first} {user?.last}</b><span className="text-[14px] text-vc-gray"> - Grade {user?.grade ?? '-'}</span><br /><b>{courseTitle(c)}</b> - {faculty}<br /><span className="text-[16px]">Weighting by {w.length ? 'Assignment Type' : 'Assignment Points'}</span></div>
            <GradeCalculation items={calc} weights={w}><span className="mr-0 mt-[11px] flex shrink-0 bg-vc-bar md:mr-[51px] text-[36px] leading-[59px]"><span className="border-r border-vc-gray-light/70 px-[14px]">{avg === null ? '-' : fmtGrade(avg)}</span><span className="px-[10px]">{posted || (avg === null ? '-' : letterFor(avg))}</span></span></GradeCalculation>
          </div>
          <h3 className="mb-[15px] mt-5 flex items-center gap-2 text-[24px] font-bold leading-7">Summary <span aria-hidden className="grid size-[15px] place-items-center rounded-full bg-vc-link-strong/30 text-[10px] font-bold leading-none text-background">?</span></h3>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] table-fixed text-[16px] md:w-[684px]"><colgroup><col />{w.length > 0 && <col className="w-[109px]" />}<col className="w-[109px]" /><col className="w-[109px]" /><col className="w-[109px]" /></colgroup><thead className="border-b border-foreground/40 bg-vc-bar text-[15px] leading-[18px] [&_th]:h-[41px] [&_th]:border-l [&_th]:border-[#d5d5d5] [&_th]:px-1 [&_th]:pb-[3px] [&_th]:pt-0 [&_th]:align-bottom [&_th:first-child]:border-l-0"><tr><th className="text-center">Assignment Type</th>{w.length > 0 && <th className="text-right">Weighting</th>}<th className="text-right">Points<br />Earned</th><th className="text-right">Points<br />Possible</th><th className="text-right">Average<span className="text-destructive">*</span></th></tr></thead><tbody>{summaryWeights.map((x) => { const st = categoryStats(calc.filter((a) => a.category === x.cat), x.drop); return <tr key={x.cat} className="h-[26.5px] leading-[26px] [&_td]:py-0 [&_td]:pr-[3px]"><td className="pl-1"><b>{category(x.cat)}</b> <span className="text-[13px] text-muted-foreground">({st.count} assignments)</span></td>{w.length > 0 && <td className="text-right"><span className="inline-block bg-vc-bar px-1 text-right leading-[18px]" style={{ minWidth: `${x.weight * 2.1}px` }}>{x.weight.toFixed(2)}%</span></td>}<td className="text-right">{st.pct === null ? '-' : fmtGrade(st.earned)}</td><td className="text-right">{st.pct === null ? '-' : fmtGrade(st.possible)}</td><td className="text-right">{st.pct === null ? '-' : fmtGrade(st.pct)}</td></tr>; })}</tbody></table></div>
          <h3 className="mb-[15px] mt-[10px] flex items-center gap-2 text-[24px] font-bold leading-7">Assignments <span aria-hidden className="grid size-[15px] place-items-center rounded-full bg-vc-link-strong/30 text-[10px] font-bold leading-none text-background">?</span></h3>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] table-fixed text-[16px] [&_td]:px-[3px]"><colgroup><col className="w-[71px]" /><col /><col className="w-[104px]" /><col className="w-[69px]" /><col className="w-[69px]" /><col className="w-[70px]" /></colgroup><thead className="border-b border-foreground/40 bg-vc-bar text-[15px] leading-[18px] [&_th]:h-[41px] [&_th]:border-l [&_th]:border-[#d5d5d5] [&_th]:px-1 [&_th]:pb-[3px] [&_th]:pt-0 [&_th]:align-bottom [&_th:first-child]:border-l-0"><tr><th className="whitespace-nowrap text-left">Due Date</th><th className="text-center">Assignment</th><th className="text-right">Score</th><th className="text-right">Grade</th><th className="text-right">Points<br />Earned</th><th className="text-right">Points<br />Possible</th></tr></thead>
            {categories.map((cat) => { const group = items.filter((a) => a.category === cat).sort((a, b) => +a.due - +b.due); const st = categoryStats(calc.filter((a) => a.category === cat), w.find((x) => x.cat === cat)?.drop); return <tbody key={cat}><tr className="h-[5px]"><td colSpan={6} className="!p-0" /></tr><tr><td /><td className="h-[17px] !py-0 font-bold leading-[17px]">{category(cat)}</td><td colSpan={4} /></tr>{group.map((a) => { const flag = aStatus[`${a.id}|${user?.personId}`] ?? ''; const bad = ['Late', 'Incomplete', 'Missing'].includes(flag); return <tr key={a.id} className={`h-[22px] border-b border-foreground/20 leading-[21px] hover:bg-vc-hint ${bad ? 'italic text-destructive' : ''}`}><td className="whitespace-nowrap py-0">{format(a.due, 'MMM d')}</td><td className="truncate py-0"><Button variant="ghost" onClick={() => setAssignment(a)} className="h-auto max-w-full justify-start truncate whitespace-nowrap rounded-none p-0 text-left text-[16px] font-normal leading-[21px] hover:bg-transparent hover:text-vc-link-strong">{a.title}</Button></td><td className="whitespace-nowrap text-right text-[13px]">{bad ? flag : a.score === undefined ? '-' : `${a.score} / ${a.points}`}</td><td className="text-right">{pct(a) === null ? '-' : `${fmtGrade(pct(a) as number)}%`}</td><td className="text-right">{a.score ?? '-'}</td><td className="text-right">{a.points}</td></tr>; })}<tr className="h-[22px] text-right font-bold leading-[21px]"><td colSpan={4} /><td className="py-0">{st.pct === null ? '-' : fmtGrade(st.earned)}</td><td>{st.pct === null ? '-' : st.possible}</td></tr></tbody>; })}
          </table></div>
        </div>
      </article>
    </div>
    <AssignmentDialog assignment={assignment} onClose={() => setAssignment(null)} />
  </>;
}
