import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, CalendarCheck, ClipboardList, Globe, MessageSquareText, Scale, Table2, Users } from "lucide-react";
import { z } from "zod";
import { PortalShell } from "@/components/portal/PortalShell";
import { Gradebook } from "@/components/teacher/Gradebook";
import { AssignmentsTab } from "@/components/teacher/AssignmentsTab";
import { Attendance, GradesComments, Reports, Weights } from "@/components/teacher/ClassTools";
import { courseTitle, teacherFull, today } from "@/lib/sis-data";
import { WebsiteSettings } from "@/components/teacher/WebsiteSettings";
import { termLabel } from "@/lib/terms";
import { defaultWeights, letterFor, weightedAverage } from "@/lib/grading";
import { scoreOf } from "@/lib/gradebook";
import { isoDay, rosterOf, useMySections, useSchool, useSectionAssignments, type Section } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

const TABS = [
  { id: "overview", label: "Students", icon: Users }, { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "assignments", label: "Assignments", icon: ClipboardList }, { id: "gradebook", label: "Gradebook", icon: Table2 },
  { id: "grades", label: "Grades & Comments", icon: MessageSquareText }, { id: "weights", label: "Weights", icon: Scale },
  { id: "reports", label: "Reports", icon: BarChart3 }, { id: "website", label: "Website", icon: Globe },
] as const;

export const Route = createFileRoute("/teacher/class/$classId")({
  validateSearch: z.object({
    tab: z.enum(["overview", "attendance", "assignments", "gradebook", "grades", "weights", "reports", "website"]).optional(),
    aid: z.string().optional(), sub: z.enum(["details", "students"]).optional(), sid: z.string().optional(), date: z.string().optional(),
  }),
  head: ({ params }) => pageHead(`${params.classId} · Class Management`, "Attendance, assignments, gradebook, comments and website for this class."),
  component: ClassManager,
});

function ClassManager() {
  const { classId } = Route.useParams();
  const mineAll = useMySections();
  const c = mineAll.find((x) => x.id === classId);
  if (!c) return <PortalShell portal="teacher" area="teacher"><p className="p-8 text-[14px]">This class isn't available — it may be unpublished or not assigned to you. <Link to="/teacher" className="text-vc-link-strong">Back to faculty home</Link></p></PortalShell>;
  return <Manager key={c.id} c={c} mine={mineAll} />;
}
function Manager({ c, mine }: { c: Section; mine: Section[] }) {
  const { tab = "overview", aid, sub, sid, date } = Route.useSearch();
  const { scores, weights, custom } = useSchool();
  const nav = useNavigate();
  const list = useSectionAssignments(c.id);
  const roster = rosterOf(c);
  const w = weights[c.id] ?? [];
  return (
    <PortalShell portal="teacher" area="teacher" wide={tab !== 'attendance'}>
      {tab === 'attendance' && <div className="bg-vc-panel"><div className="px-5 py-3 text-[17px]"><select aria-label="Change class" className="max-w-full bg-transparent" value={c.id} onChange={(e) => nav({ to: '/teacher/class/$classId', params: { classId: e.target.value }, search: { tab } })}>{mine.map((x) => <option key={x.id} value={x.id}>{x.id}: {x.name}</option>)}</select></div><div className="flex overflow-x-auto border-b border-vc-line px-4">{TABS.map(({ id, label }) => <Link key={id} to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: id }} className={`shrink-0 px-4 py-4 text-[13px] ${tab === id ? 'border-x border-t border-vc-line bg-background text-vc-link-strong' : 'text-muted-foreground'}`}>{label}</Link>)}</div></div>}
      <div className={`min-h-[640px] ${tab === 'attendance' ? '' : 'grid grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-[230px_minmax(0,1fr)]'}`}>
      {tab !== 'attendance' && <aside className="border-r border-vc-line bg-vc-panel py-4">
        <div className="mb-4 flex gap-2.5 px-4"><Globe className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0"><div className="text-[14px] font-semibold leading-tight">{c.id}: {c.name}</div>
            <select aria-label="Change class" className="mt-0.5 w-full bg-transparent text-[12px] text-muted-foreground" value={c.id} onChange={(e) => nav({ to: "/teacher/class/$classId", params: { classId: e.target.value }, search: { tab } })}>
              <option value={c.id} disabled>change class</option>{mine.map((x) => <option key={x.id} value={x.id}>{courseTitle(x)}</option>)}</select></div></div>
        {TABS.map(({ id, label, icon: Icon }) => (
          <Link key={id} to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: id }}
            className={`mx-2 flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] ${tab === id ? "bg-vc-select" : "hover:bg-background"}`}><Icon className="size-5 text-foreground/70" strokeWidth={1.5} />{label}</Link>))}
        <div className="mt-4 px-5 text-[11px] text-muted-foreground">{c.teacherIds.map(teacherFull).join(", ")}<br />{c.block} · Room {c.room} · {roster.length} students<br />{c.terms.map(termLabel).join(", ")}</div>
      </aside>}
      <div className="min-w-0">
      <div className="px-4 py-4">
        {tab === "overview" && (
          <table className="w-full text-[13px]">
            <thead><tr className="border-b-2 border-foreground/70 text-left text-[11px] uppercase text-muted-foreground"><th className="py-1.5">Student</th><th>Grade</th><th>Current Average</th><th>Missing</th><th /></tr></thead>
            <tbody>{roster.map((s) => {
              const scored = list.filter((a) => custom.find((x) => x.id === a.id)?.inCalc !== false).map((a) => ({ category: a.category, points: a.points, score: scoreOf(scores, a, s.id) }));
              const av = weightedAverage(scored, w);
              const missing = list.filter((a) => a.due < today() && scoreOf(scores, a, s.id) === undefined).length;
              return (
                <tr key={s.id} className="border-b border-vc-line"><td className="py-1.5">{s.last}, {s.first}</td><td>{s.grade}</td><td className="font-semibold">{av !== null ? `${letterFor(av)} · ${av.toFixed(2)}%` : "—"}</td>
                  <td className={missing ? "text-destructive" : "text-muted-foreground"}>{missing}</td>
                  <td className="text-right"><Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "grades", sid: s.id }} className="text-vc-link-strong hover:underline">Grades & Comments</Link></td></tr>);
            })}</tbody>
          </table>
        )}
        {tab === "attendance" && <Attendance c={c} roster={roster} date={date ?? isoDay(today())} />}
        {tab === "assignments" && <AssignmentsTab courseId={c.id} list={list} roster={roster} aid={aid} sub={sub} />}
        {tab === "gradebook" && <Gradebook courseId={c.id} list={list} roster={roster} />}
        {tab === "grades" && <GradesComments c={c} roster={roster} list={list} sid={sid} />}
        {tab === "weights" && <Weights key={c.id} c={c} list={list} />}
        {tab === "reports" && <Reports list={list} roster={roster} />}
        {tab === "website" && <WebsiteSettings c={c} />}
      </div>
      </div>
      </div>
    </PortalShell>
  );
}
