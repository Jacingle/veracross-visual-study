import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { format, isAfter } from "date-fns";
import { ArrowRight, CalendarDays, Clock, FolderOpen, Home, Image, Megaphone, MessagesSquare, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { RoleGate } from "@/components/auth/RoleGate";
import { StudentCard } from "@/components/portal/StudentCard";
import { ALL_SECTIONS, COURSES, courseTitle, rosterFor, sectionsFor, teacher, today, type Assignment, type Course } from "@/lib/sis-data";
import { bgSrc, useSchool, useSectionAssignments } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

const TABS = [
  { id: "home", label: "Home", icon: Home }, { id: "posts", label: "Posts", icon: Megaphone }, { id: "timeline", label: "Timeline", icon: Clock },
  { id: "calendar", label: "Calendar", icon: CalendarDays }, { id: "resources", label: "Resources", icon: FolderOpen }, { id: "photos", label: "Photos", icon: Image },
  { id: "discussions", label: "Discussions", icon: MessagesSquare }, { id: "directory", label: "Directory", icon: User },
] as const;
type Tab = (typeof TABS)[number]["id"];

export const Route = createFileRoute("/class/$classId")({
  validateSearch: z.object({ tab: z.enum(["home", "posts", "timeline", "calendar", "resources", "photos", "discussions", "directory"]).optional() }),
  loader: ({ params }) => { const c = ALL_SECTIONS.find((x) => x.id === params.classId); if (!c) throw notFound(); return { c }; },
  head: ({ loaderData }) => pageHead(loaderData ? `${loaderData.c.code}: ${courseTitle(loaderData.c)}` : "Class Website", "Class website with assignments, resources and directory."),
  component: () => <RoleGate area="shared"><ClassSite /></RoleGate>,
});

function ClassSite() {
  const { c } = Route.useLoaderData();
  const { tab = "home" } = Route.useSearch();
  const nav = useNavigate();
  const { user, settings, logout } = useSchool();
  const t = teacher(c.teacherId);
  const all = useSectionAssignments(c.id);
  const upcoming = all.filter((a) => !isAfter(today(), a.due)).slice(0, 5);
  const options = user?.role === "teacher" ? sectionsFor(user.personId) : user?.role === "admin" ? ALL_SECTIONS : COURSES;
  const src = bgSrc(settings.classSite.bg);
  return (
    <div className="relative min-h-screen">
      {src ? <img src={src} alt="" width={1920} height={1088} className="fixed inset-0 h-full w-full object-cover" /> : <div className="fixed inset-0 bg-vc-sky" />}
      <div className="relative flex h-8 items-center justify-between border-b border-primary-foreground/20 bg-vc-classbar px-6 text-primary-foreground">
        <select value={c.id} onChange={(e) => nav({ to: "/class/$classId", params: { classId: e.target.value } })} className="h-[22px] w-[280px] rounded-sm bg-background px-1.5 text-[12px] text-muted-foreground">
          {options.map((x) => <option key={x.id} value={x.id}>{courseTitle(x)}</option>)}
        </select>
        <div className="text-[13px]">{user?.email} <button onClick={() => { logout(); nav({ to: "/", replace: true }); }} className="ml-2 underline">log out</button></div>
      </div>
      <div className="relative mx-auto flex w-[calc(100%-2rem)] max-w-[1045px] gap-3 pb-12">
        <div className="min-w-0 flex-1">
          <h1 className="py-4 text-[30px] font-light text-primary-foreground [text-shadow:0_2px_8px_rgb(0_0_0_/0.6)]">{c.code}: {courseTitle(c)}</h1>
          <div className="min-h-[640px] bg-background">
            <div className="flex bg-vc-panel px-5">{TABS.map(({ id, label, icon: Icon }) => (
              <Link key={id} to="/class/$classId" params={{ classId: c.id }} search={{ tab: id === "home" ? undefined : id }}
                className={`flex w-[88px] flex-col items-center gap-1 border-b-2 pb-1.5 pt-2.5 text-[13px] ${tab === id ? "border-vc-link-strong bg-background text-vc-link-strong" : "border-transparent"}`}>
                <Icon className="size-5" strokeWidth={2} />{label}</Link>))}</div>
            <div className="px-4 py-4"><Body tab={tab} c={c} upcoming={upcoming} /></div>
          </div>
        </div>
        <aside className="mt-[94px] w-[250px] shrink-0 space-y-3 text-[13px]">
          <div className="bg-background p-3">
            <div className="text-[16px]">Teacher</div>
            <div className="mt-1 flex gap-2.5"><div className="grid h-[80px] w-[54px] place-items-center bg-vc-tile text-lg text-vc-link-strong">{t.first[0]}{t.last[0]}</div>
              <div><div className="font-semibold">{t.prefix} {t.last}</div><a href={`mailto:${t.email}`} className="text-vc-link-strong">Email</a></div></div>
            <Link to="/grades/$classId" params={{ classId: c.id }} className="mt-3 flex items-center gap-1 text-vc-link-strong">More class information <ArrowRight className="size-3.5" /></Link>
          </div>
          <div className="bg-background p-3">
            <Link to="/class/$classId" params={{ classId: c.id }} search={{ tab: "resources" }} className="flex items-center gap-1 text-[16px]">All Pages <ArrowRight className="size-4 text-vc-link-strong" /></Link>
            <button onClick={() => toast("Everything Document", { description: "Opens the class's shared document." })} className="mt-3 block text-vc-link-strong">Everything Document</button>
            <button onClick={() => toast("Course Essay Guidelines")} className="mt-2 block text-vc-link-strong">Course Essay Guidelines</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Body({ tab, c, upcoming }: { tab: Tab; c: Course; upcoming: Assignment[] }) {
  if (tab === "home") return (
    <>
      <div className="w-[300px] border-b border-muted-foreground/60 text-[14px] font-semibold text-muted-foreground">Assignments</div>
      <div className="mt-2 space-y-1.5">{upcoming.length ? upcoming.map((a) => (
        <Link key={a.id} to="/grades/$classId" params={{ classId: c.id }} className="flex gap-3 text-[15px] text-vc-link-strong hover:underline">
          <span className="w-8">{format(a.due, "EEE").toUpperCase()}</span><span className="w-12">{format(a.due, "MMM d")}</span><span>{a.title.length > 30 ? a.category[0] + a.category.slice(1).toLowerCase() : a.title}</span></Link>))
        : <p className="text-[13px] text-muted-foreground">No upcoming assignments.</p>}</div>
      <button onClick={() => toast("Everything Document")} className="mx-auto mt-7 block h-[46px] w-[92%] bg-vc-link text-[17px] text-primary-foreground hover:opacity-90">Everything Document</button>
    </>
  );
  if (tab === "directory") return (
    <>
      <h2 className="text-[30px] font-bold">Student Directory</h2>
      <div className="mt-3 text-right"><button onClick={() => window.print()} className="text-[14px] text-vc-link-strong">Download Directory (PDF)</button></div>
      <div className="mt-4 space-y-4 px-3">{rosterFor(c.id).map((s) => <StudentCard key={s.id} s={s} />)}</div>
    </>
  );
  return <p className="py-16 text-center text-[13px] text-muted-foreground">Nothing has been posted to {TABS.find((x) => x.id === tab)?.label} yet.</p>;
}
