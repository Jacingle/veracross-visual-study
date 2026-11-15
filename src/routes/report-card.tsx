import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from 'react';
import { Printer } from "lucide-react";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { ME, SCHOOL, courseTitle, teacherFull } from "@/lib/sis-data";
import { useSchool , useMySections, useStudentAssignments } from "@/lib/school-store";
import { gradingPeriods, termById } from '@/lib/terms';
import { weightedAverage, letterFor } from '@/lib/grading';
import { Button } from '@/components/ui/button';
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/report-card")({
  head: () => pageHead("Progress Report", "Term progress reports, published grades and teacher comments."),
  component: Report,
});

function Report() {
  const COURSES = useMySections();
  const { comments, termGrades, user, weights, custom, courseFlags } = useSchool();
  const assignments = useStudentAssignments();
  const periods = gradingPeriods([...new Set(COURSES.flatMap((c) => c.terms))]);
  const [selected, setSelected] = useState('');
  const periodId = selected || periods[0]?.id || '';
  const period = periods.find((p) => p.id === periodId);
  const sid = user?.personId || "me";
  return (
    <PortalShell portal="student">
      <StudentTabs />
      <div className="px-8 py-6">
        <div className="flex justify-between border-b-2 border-foreground/70 pb-3">
          <div><div className="text-[12px] uppercase tracking-wider text-muted-foreground">{SCHOOL.name} · Progress Report</div><h2 className="text-[24px] font-light">{period?.label || 'Progress Report'} · {user?.first} {user?.last}</h2></div>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="size-4" />Print / Save PDF</Button>
        </div>
        {periods.length > 0 && <label className="mt-4 flex items-center gap-3 text-[13px]">Reporting period<select aria-label="Reporting period" className="h-8 border border-vc-line bg-background px-2" value={periodId} onChange={(e) => setSelected(e.target.value)}>{periods.map((p) => <option key={p.id} value={p.id}>{p.id.split('-')[0]} · {p.label}</option>)}</select></label>}
        {COURSES.filter((c) => c.terms.some((id) => periodId.startsWith(id)) && courseFlags[c.id]?.['report'] !== false).map((c) => {
          const id = c.terms.find((t) => periodId.startsWith(t)); const t = id ? termById(id) : undefined;
          const list = assignments.filter((a) => a.courseId === c.id && custom.find((x) => x.id === a.id)?.inCalc !== false && (!t || (+a.due >= +t.start && +a.due <= +(periodId.endsWith('-M') ? t.mid : t.end) + 86399999)));
          const avg = weightedAverage(list, weights[c.id] ?? []); const key = `${c.id}|${sid}|${periodId}`;
          return <div key={c.id} className="border-b border-vc-line py-4"><div className="flex justify-between gap-3"><div className="text-[16px]"><Link to="/grades/$classId" params={{ classId: c.id }} search={{ tab: 'detail' }} className="text-vc-link-strong">{courseTitle(c)}</Link> <span className="text-[13px] text-muted-foreground">· {teacherFull(c.teacherId)}</span></div><div className="text-[18px]">{termGrades[key] || (avg === null ? '-' : `${letterFor(avg)} · ${avg.toFixed(2)}%`)}</div></div>{comments[key] && <p className="mt-1.5 whitespace-pre-line text-[14px] text-foreground/80">{comments[key]}</p>}</div>;
        })}
        {!periods.length && <p className="py-8 text-[13px] text-muted-foreground">No reports available.</p>}
      </div>
    </PortalShell>
  );
}
