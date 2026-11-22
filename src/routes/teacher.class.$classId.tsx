import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { VcSelect } from '@/components/teacher/VcSelect';
import { Bell, Book, Calendar, ChevronLeft, ChevronRight, Image, Library, MessageSquareText, PanelsTopLeft, Pencil, Settings, UsersRound } from "lucide-react";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { z } from "zod";
import { ErrorPage } from "@/components/common/ErrorPage";
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
  { id: "overview", label: "Students", icon: UsersRound }, { id: "attendance", label: "Attendance", icon: Pencil },
  { id: "gradebook", label: "Gradebook", icon: Book }, { id: "grades", label: "Grades & Comments", icon: MessageSquareText },
  { id: "notifications", label: "Notifications", icon: Bell }, { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "website", label: "Website", icon: PanelsTopLeft }, { id: "photos", label: "Photos", icon: Image }, { id: "settings", label: "Settings", icon: Settings },
] as const;
/** Pages reached from inside the gradebook; the Gradebook item stays selected while on them. */
const UNDER_GRADEBOOK = ["assignments", "weights", "reports"];

export const Route = createFileRoute("/teacher/class/$classId")({
  validateSearch: z.object({
    tab: z.enum(["overview", "attendance", "assignments", "gradebook", "grades", "weights", "reports", "website", "notifications", "calendar", "photos", "settings", "gradedetail"]).optional(),
    aid: z.coerce.string().optional(), sub: z.enum(["details", "students"]).optional(), sid: z.coerce.string().optional(), date: z.coerce.string().optional(),
  }),
  head: ({ params }) => pageHead(`${params.classId} · Class Management`, "Attendance, assignments, gradebook, comments and website for this class."),
  component: ClassManager,
});

function ClassManager() {
  const { classId } = Route.useParams();
  const search = Route.useSearch();
  const mineAll = useMySections();
  const c = mineAll.find((x) => x.id === classId);
  if (!c) return <ErrorPage title="Access Restricted" message="You do not have access to this class." detail="It may be unpublished or not assigned to you." />;
  return search.tab === "gradedetail" ? <StudentPaper c={c} sid={search.sid} /> : <Manager key={c.id} c={c} mine={mineAll} />;
}
/** Shows what went wrong instead of a blank error page, so a broken document can be reported precisely. */
class PaperGuard extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() { return this.state.err ? <ErrorPage title="Something Went Wrong" message="This grade detail couldn't be shown." detail={`${this.state.err.message} Please contact your support representative if the problem continues.`} /> : this.props.children; }
}
/** A student's Grade Detail, same paper the student sees; opened in a new tab from the gradebook. */
function StudentPaper({ c, sid }: { c: Section; sid: string | undefined }) {
  const { scores } = useSchool();
  const all = useSectionAssignments(c.id);
  const s = rosterOf(c).find((x) => x.id === sid);
  const list = all.map((a) => ({ ...a, score: scoreOf(scores, a, sid ?? "") }));
  if (!s) return <ErrorPage title="Page Not Found" message="That student is not in this class." />;
  return <div className="min-h-screen bg-vc-paper"><div className="px-4 pt-3 text-[13px]"><Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "gradebook" }} className="text-vc-link-strong hover:underline">← Back to the gradebook</Link></div><PaperGuard><Detail standalone list={list} c={c} student={{ personId: s.id, first: s.first, last: s.last, grade: s.grade }} /></PaperGuard></div>;
}
function Manager({ c, mine }: { c: Section; mine: Section[] }) {
  const { tab = "overview", aid, sub, sid, date } = Route.useSearch();
  const { scores, weights, custom } = useSchool();
  const nav = useNavigate();
  const list = useSectionAssignments(c.id);
  const roster = rosterOf(c);
  const w = weights[c.id] ?? [];
  const [open, setOpen] = useState(true);
  const [wterm, setWterm] = useState(c.terms[0] ?? "");
  const box = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const host = box.current?.parentElement; if (!host) return;
    const fit = () => { const w = host.getBoundingClientRect().width; if (w > 0) setZoom(Math.min(2.4, Math.max(0.7, w / 1256))); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(host); return () => ro.disconnect();
  }, []);
  const active = UNDER_GRADEBOOK.includes(tab) ? "gradebook" : tab;
  return (
    <PortalShell portal="teacher" area="teacher" bare maxWidth={1900}>
      <div ref={box} style={{ zoom }} className={`relative grid min-h-[560px] overflow-hidden rounded-[14px] bg-background shadow-xl ${open ? "grid-cols-[175px_minmax(0,1fr)]" : "grid-cols-[0_minmax(0,1fr)]"}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Collapse menu" : "Expand menu"} title={open ? "Collapse menu" : "Expand menu"} className={`absolute top-[7px] z-20 grid size-[18px] place-items-center rounded-full border border-vc-line bg-background shadow-sm ${open ? "left-[165px]" : "left-2"}`}>{open ? <ChevronLeft className="size-3.5" strokeWidth={3} /> : <ChevronRight className="size-3.5" strokeWidth={3} />}</button>
      <aside className={`${open ? "" : "hidden"} bg-[#f4f6fa] pt-[14px]`}>
        <div className="mb-[22px] flex items-start gap-[10px] pl-[15px] pr-3"><Library className="mt-0.5 size-[17px] shrink-0 text-foreground/55" strokeWidth={1.5} />
          <div className="min-w-0"><div className="truncate text-[12px] font-medium leading-[15px]">{c.id}: {c.name}</div>
            <VcSelect aria-label="Change class" className="w-full cursor-pointer bg-transparent text-[9.5px] leading-[13px] text-muted-foreground outline-none" value={c.id} onChange={(e) => nav({ to: "/teacher/class/$classId", params: { classId: e.target.value }, search: { tab: active } })}>
              <option value={c.id} disabled>change class</option>{mine.map((x) => <option key={x.id} value={x.id}>{courseTitle(x)}</option>)}</VcSelect></div></div>
        {TABS.map(({ id, label, icon: Icon }) => (
          <Link key={id} to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: id }} aria-current={active === id ? "page" : undefined}
            className={`mx-[9px] mb-[8px] flex h-[30px] items-center gap-[9.5px] rounded-[5px] pl-[6px] text-[11.5px] ${active === id ? "bg-[#dbeafb] text-foreground" : "text-foreground/70 hover:bg-background"}`}><Icon className="size-[14px] text-foreground/50" strokeWidth={1.5} />{label}</Link>))}
      </aside>
      <div className="min-w-0" >
      {tab === "weights" && <div className="flex flex-wrap items-center gap-3 border-b border-vc-line px-5 pb-0 pl-[15px] pt-[6px]">
        <Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "gradebook" }} className="mb-[6px] flex h-[26px] shrink-0 items-center gap-[8px] whitespace-nowrap rounded-[4px] bg-[#4d4d4d] px-[12px] text-[12px] font-medium text-primary-foreground hover:brightness-110"><span className="grid size-4 place-items-center rounded-full bg-primary-foreground text-[#4a4a4a]"><ChevronLeft className="size-3" strokeWidth={3} /></span>Back to Scores</Link>
        <span className="ml-[8px] border-b-2 border-[#4fb3e6] px-[17px] pb-[9px] pt-[8px] text-[11.5px] text-[#4fb3e6]">Weights</span>
        <span className="relative mb-2 ml-[8px]"><VcSelect aria-label="Term" value={wterm} onChange={(e) => setWterm(e.target.value)} className="h-[23px] w-[99px] rounded-[3px] border border-[#e1e4e8] bg-background pl-2 pr-5 text-[10.5px] text-foreground/70 outline-none">{c.terms.map((x) => <option key={x} value={x}>{termLabel(x).replace(/^\d{4}-\d{2} /, "")}</option>)}</VcSelect></span>
      </div>}
      <div className={tab === "attendance" ? "px-6 py-6" : tab === "gradebook" || tab === "weights" || tab === "assignments" ? "" : "px-4 py-4 pl-[15px]"}>
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
        {tab === "weights" && <Weights key={c.id} c={c} list={list} termId={wterm} />}
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
