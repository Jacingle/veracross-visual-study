import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, BookOpen, CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Globe, Image, Library, MessageSquareText, Settings, UsersRound } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { PortalShell } from "@/components/portal/PortalShell";
import { Detail } from "@/components/portal/GradeDetail";
import { Gradebook } from "@/components/teacher/Gradebook";
import { AssignmentsTab } from "@/components/teacher/AssignmentsTab";
import { Attendance, GradesComments, Reports, Weights } from "@/components/teacher/ClassTools";
import { courseTitle, teacherFull, today } from "@/lib/sis-data";
import { ClassCalendar, ClassNotifications, ClassPhotos, ClassSettings } from "@/components/teacher/ClassExtras";
import { WebsiteSettings } from "@/components/teacher/WebsiteSettings";
import { termLabel } from "@/lib/terms";
import { defaultWeights, letterFor, weightedAverage } from "@/lib/grading";
import { scoreOf } from "@/lib/gradebook";
import { isoDay, rosterOf, useMySections, useSchool, useSectionAssignments, type Section } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

const TABS = [
  { id: "overview", label: "Students", icon: UsersRound }, { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "gradebook", label: "Gradebook", icon: BookOpen }, { id: "grades", label: "Grades & Comments", icon: MessageSquareText },
  { id: "notifications", label: "Notifications", icon: Bell }, { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "website", label: "Website", icon: Globe }, { id: "photos", label: "Photos", icon: Image }, { id: "settings", label: "Settings", icon: Settings },
] as const;
/** Pages reached from inside the gradebook; the Gradebook item stays selected while on them. */
const UNDER_GRADEBOOK = ["assignments", "weights", "reports"];

export const Route = createFileRoute("/teacher/class/$classId")({
  validateSearch: z.object({
    tab: z.enum(["overview", "attendance", "assignments", "gradebook", "grades", "weights", "reports", "website", "notifications", "calendar", "photos", "settings", "gradedetail"]).optional(),
    aid: z.string().optional(), sub: z.enum(["details", "students"]).optional(), sid: z.string().optional(), date: z.string().optional(),
  }),
  head: ({ params }) => pageHead(`${params.classId} · Class Management`, "Attendance, assignments, gradebook, comments and website for this class."),
  component: ClassManager,
});

function ClassManager() {
  const { classId } = Route.useParams();
  const search = Route.useSearch();
  const mineAll = useMySections();
  const c = mineAll.find((x) => x.id === classId);
  if (!c) return <PortalShell portal="teacher" area="teacher"><p className="p-8 text-[14px]">This class isn't available — it may be unpublished or not assigned to you. <Link to="/teacher" className="text-vc-link-strong">Back to faculty home</Link></p></PortalShell>;
  return search.tab === "gradedetail" ? <StudentPaper c={c} sid={search.sid} /> : <Manager key={c.id} c={c} mine={mineAll} />;
}
/** A student's Grade Detail, same paper the student sees; opened in a new tab from the gradebook. */
function StudentPaper({ c, sid }: { c: Section; sid: string | undefined }) {
  const { scores } = useSchool();
  const all = useSectionAssignments(c.id);
  const s = rosterOf(c).find((x) => x.id === sid);
  const list = all.map((a) => ({ ...a, score: scoreOf(scores, a, sid ?? "") }));
  if (!s) return <PortalShell portal="teacher" area="teacher"><p className="p-8 text-[14px]">That student isn't in this class. <Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "gradebook" }} className="text-vc-link-strong">Back to the gradebook</Link></p></PortalShell>;
  return <PortalShell portal="teacher" area="teacher"><Detail list={list} c={c} student={{ personId: s.id, first: s.first, last: s.last, grade: s.grade }} /></PortalShell>;
}
function Manager({ c, mine }: { c: Section; mine: Section[] }) {
  const { tab = "overview", aid, sub, sid, date } = Route.useSearch();
  const { scores, weights, custom } = useSchool();
  const nav = useNavigate();
  const list = useSectionAssignments(c.id);
  const roster = rosterOf(c);
  const w = weights[c.id] ?? [];
  const [open, setOpen] = useState(true);
  const active = UNDER_GRADEBOOK.includes(tab) ? "gradebook" : tab;
  return (
    <PortalShell portal="teacher" area="teacher" bare>
      <div className={`relative grid min-h-[560px] overflow-hidden rounded-[14px] bg-background shadow-xl ${open ? "grid-cols-[176px_minmax(0,1fr)]" : "grid-cols-[0_minmax(0,1fr)]"}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Collapse menu" : "Expand menu"} title={open ? "Collapse menu" : "Expand menu"} className={`absolute top-[18px] z-20 grid size-[22px] place-items-center rounded-full border border-vc-line bg-background shadow-sm ${open ? "left-[165px]" : "left-2"}`}>{open ? <ChevronLeft className="size-3.5" strokeWidth={3} /> : <ChevronRight className="size-3.5" strokeWidth={3} />}</button>
      <aside className={`${open ? "" : "hidden"} bg-[#f3f5f8] pt-[14px]`}>
        <div className="mb-[22px] flex items-start gap-2.5 px-[14px]"><Library className="mt-0.5 size-[18px] shrink-0 text-foreground/55" strokeWidth={1.5} />
          <div className="min-w-0"><div className="truncate text-[12.5px] font-medium leading-[15px]">{c.id}: {c.name}</div>
            <select aria-label="Change class" className="w-full cursor-pointer appearance-none bg-transparent text-[10px] leading-[14px] text-muted-foreground outline-none" value={c.id} onChange={(e) => nav({ to: "/teacher/class/$classId", params: { classId: e.target.value }, search: { tab: active } })}>
              <option value={c.id} disabled>change class</option>{mine.map((x) => <option key={x.id} value={x.id}>{courseTitle(x)}</option>)}</select></div></div>
        {TABS.map(({ id, label, icon: Icon }) => (
          <Link key={id} to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: id }} aria-current={active === id ? "page" : undefined}
            className={`mx-[8px] mb-[2px] flex h-[36px] items-center gap-3 rounded-[6px] px-[10px] text-[12px] ${active === id ? "bg-[#d4e6f9] text-foreground" : "text-foreground/70 hover:bg-background"}`}><Icon className="size-[16px] text-foreground/60" strokeWidth={1.5} />{label}</Link>))}
      </aside>
      <div className="min-w-0">
      {tab === "weights" && <div className="flex flex-wrap items-center gap-3 border-b border-vc-line px-5 pb-0 pl-[40px] pt-[7px]">
        <Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "gradebook" }} className="mb-2 flex h-[28px] items-center gap-2 rounded-[5px] bg-[#4a4a4a] px-3 text-[11px] font-medium text-primary-foreground hover:brightness-110"><span className="grid size-4 place-items-center rounded-full bg-primary-foreground text-[#4a4a4a]"><ChevronLeft className="size-3" strokeWidth={3} /></span>Back to Scores</Link>
        <span className="border-b-2 border-[#4a9be0] px-3 pb-[9px] pt-[8px] text-[11px] text-[#4a9be0]">Weights</span>
      </div>}
      <div className={tab === "attendance" ? "px-6 py-6" : tab === "gradebook" || tab === "weights" ? "" : "px-4 py-4 pl-[40px]"}>
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
        {tab === "gradebook" && <Gradebook courseId={c.id} terms={c.terms} list={list} roster={roster} />}
        {tab === "grades" && <GradesComments c={c} roster={roster} list={list} sid={sid} />}
        {tab === "weights" && <Weights key={c.id} c={c} list={list} />}
        {tab === "reports" && <Reports list={list} roster={roster} />}
        {tab === "website" && <WebsiteSettings c={c} />}
        {tab === "notifications" && <ClassNotifications c={c} list={list} roster={roster} />}
        {tab === "calendar" && <ClassCalendar c={c} list={list} />}
        {tab === "photos" && <ClassPhotos roster={roster} />}
        {tab === "settings" && <ClassSettings c={c} count={roster.length} />}
      </div>
      </div>
      </div>
    </PortalShell>
  );
}
