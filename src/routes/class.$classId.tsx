import { PersonPhoto } from "@/components/common/PersonPhoto";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format, isAfter } from "date-fns";
import { ArrowRight, CalendarDays, Clock, FolderOpen, Home, Image, Megaphone, MessagesSquare, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { RoleGate } from "@/components/auth/RoleGate";
import { StudentCard } from "@/components/portal/StudentCard";
import { courseTitle, teacher, today, type Assignment } from "@/lib/sis-data";
import { rosterOf, useMySections, useSchool, useSectionAssignments, useStudentAssignments, type Section } from "@/lib/school-store";
import { pageHead } from "@/lib/head";
import type { CSSProperties } from "react";

const TABS = [
  { id: "home", label: "Home", icon: Home }, { id: "posts", label: "Posts", icon: Megaphone }, { id: "timeline", label: "Timeline", icon: Clock },
  { id: "calendar", label: "Calendar", icon: CalendarDays }, { id: "resources", label: "Resources", icon: FolderOpen }, { id: "photos", label: "Photos", icon: Image },
  { id: "discussions", label: "Discussions", icon: MessagesSquare }, { id: "directory", label: "Directory", icon: User },
] as const;
type Tab = (typeof TABS)[number]["id"];

export const Route = createFileRoute("/class/$classId")({
  validateSearch: z.object({ tab: z.enum(["home", "posts", "timeline", "calendar", "resources", "photos", "discussions", "directory"]).optional(), page: z.string().optional() }),
  head: ({ params }) => pageHead(`Class Website · ${params.classId}`, "Class website with assignments, resources and directory."),
  component: () => <RoleGate area="shared"><ClassSite /></RoleGate>,
});

function ClassSite() {
  const { classId } = Route.useParams();
  const options = useMySections();
  const c = options.find((x) => x.id === classId);
  if (!c) return <div className="p-10 text-[14px]">This class website isn't available to you. <Link to="/" className="text-vc-link-strong">Go home</Link></div>;
  return <Site c={c} options={options} />;
}
function Site({ c, options }: { c: Section; options: Section[] }) {
  const { tab = "home", page } = Route.useSearch();
  const nav = useNavigate();
  const { user, logout, photos } = useSchool();
  const t = teacher(c.teacherIds[0] ?? c.teacherId);
  const sect = useSectionAssignments(c.id);
  const mine = useStudentAssignments();
  const all = user?.role === "student" ? mine.filter((a) => a.courseId === c.id) : sect;
  const upcoming = all.filter((a) => !isAfter(today(), a.due)).slice(0, 5);
  const ws = c.website;
  return (
    <div className="relative min-h-screen" style={{ ...(ws.barColor ? { '--vc-classbar': ws.barColor } : {}), ...(ws.linkColor ? { '--vc-link-strong': ws.linkColor } : {}) } as CSSProperties}>
      {ws.bg === "photo" && ws.photo ? <img src={ws.photo} alt="" width={1600} height={900} className="fixed inset-0 h-full w-full object-cover" />
        : <div className="fixed inset-0 bg-vc-panel" style={ws.bg === "color" ? { background: ws.color } : undefined} />}
      <div className="relative z-10 flex h-10 items-center justify-between bg-vc-classbar px-6 shadow-sm text-primary-foreground">
        <select aria-label="Change Class" value={c.id} onChange={(e) => nav({ to: "/class/$classId", params: { classId: e.target.value } })} className="h-[26px] w-[320px] rounded-sm bg-background px-1.5 text-[12px] text-foreground">
          <optgroup label={user?.first ?? ""}>{options.map((x) => <option key={x.id} value={x.id}>{x.id}: {courseTitle(x)}</option>)}</optgroup>
        </select>
        <div className="text-[13px]">{user?.email} <button onClick={() => { logout(); nav({ to: "/", replace: true }); }} className="ml-2 underline">log out</button></div>
      </div>
      <div className="relative mx-auto flex w-[calc(100%-2rem)] max-w-[1045px] gap-3 pb-12">
        <div className="min-w-0 flex-1">
          <h1 className={`py-5 text-[34px] font-light ${ws.bg === "none" ? "text-foreground" : "inline-block mt-4 mb-3 rounded-sm bg-background/90 px-3 py-1 text-foreground"}`}>{c.code}: {courseTitle(c)}</h1>
          <div className="min-h-[640px] rounded-t-sm bg-background shadow-sm">
            <div className="flex justify-center border-b border-vc-line bg-background px-5">{TABS.map(({ id, label, icon: Icon }) => (
              <Link key={id} to="/class/$classId" params={{ classId: c.id }} search={{ tab: id === "home" ? undefined : id }}
                className={`flex w-[100px] flex-col items-center gap-1 border-b-2 pb-2 pt-3 text-[15px] ${tab === id ? "border-vc-link-strong text-vc-link-strong" : "border-transparent"}`}>
                <Icon className="size-6" strokeWidth={2} />{label}</Link>))}</div>
            <div className="px-4 py-4">{page && ws.pages.includes(page) && (user?.role !== 'student' || ws.pageContent?.[page]?.published) ? <section><h2 className="text-[24px] font-semibold">{page}</h2><p className="mt-4 whitespace-pre-wrap text-[14px] leading-6">{ws.pageContent?.[page]?.body ?? ''}</p></section> : <Body tab={tab} c={c} upcoming={upcoming} />}</div>
          </div>
        </div>
        <aside className="mt-[94px] w-[290px] shrink-0 space-y-3 text-[13px]">
          <div className="rounded-sm bg-background p-3 shadow-sm">
            <div className="text-[18px]">Teacher</div>
            <div className="mt-1 flex gap-2.5"><PersonPhoto personId={t.id} className="size-[66px]" />
              <div className="text-[15px]"><div className="font-semibold">{t.last}</div><a href={`mailto:${t.email}`} className="text-vc-link-strong">Email</a></div></div>
            <Link to="/grades/$classId" params={{ classId: c.id }} className="mt-3 flex items-center gap-1 text-vc-link-strong">More class information <ArrowRight className="size-3.5" /></Link>
          </div>
          <div className="rounded-sm bg-background p-3 shadow-sm">
            <Link to="/class/$classId" params={{ classId: c.id }} search={{ tab: "resources" }} className="flex items-center gap-1 text-[16px]">All Pages <ArrowRight className="size-4 text-vc-link-strong" /></Link>
            {ws.pages.length ? ws.pages.filter((pg) => user?.role !== 'student' || ws.pageContent?.[pg]?.published).map((pg) => <Link key={pg} to="/class/$classId" params={{ classId: c.id }} search={{ page: pg }} className="mt-3 block text-left text-vc-link-strong">{pg}</Link>)
              : <p className="mt-2 text-muted-foreground">No pages yet.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Body({ tab, c, upcoming }: { tab: Tab; c: Section; upcoming: Assignment[] }) {
  if (tab === "home") return (
    <>
      <div className="w-[300px] border-b border-muted-foreground/60 text-[14px] font-semibold text-muted-foreground">Assignments</div>
      <div className="mt-2 space-y-1.5">{upcoming.length ? upcoming.map((a) => (
        <Link key={a.id} to="/grades/$classId" params={{ classId: c.id }} className="flex gap-3 text-[15px] text-vc-link-strong hover:underline">
          <span className="w-8">{format(a.due, "EEE").toUpperCase()}</span><span className="w-12">{format(a.due, "MMM d")}</span><span>{a.title.length > 30 ? a.category[0] + a.category.slice(1).toLowerCase() : a.title}</span></Link>))
        : <p className="text-[13px] text-muted-foreground">No upcoming assignments.</p>}</div>
      {c.website.sections.map((sec, i) => (
        <section key={i} className="mx-auto mt-6 w-[92%]">
          <h3 className="bg-vc-classbar px-10 py-5 text-[24px] font-bold text-destructive">{sec.title}</h3>
          <p className="whitespace-pre-line px-10 py-5 text-justify text-[15px] leading-7">{sec.body}</p>
        </section>))}
    </>
  );
  if (tab === "directory") return (
    <>
      <h2 className="text-[30px] font-bold">Student Directory</h2>
      <div className="mt-3 text-right"><button onClick={() => window.print()} className="text-[14px] text-vc-link-strong">Download Directory (PDF)</button></div>
      <div className="mt-4 space-y-4 px-3">{rosterOf(c).map((s) => <StudentCard key={s.id} s={s} />)}</div>
    </>
  );
  return <p className="py-16 text-center text-[13px] text-muted-foreground">Nothing has been posted to {TABS.find((x) => x.id === tab)?.label} yet.</p>;
}
