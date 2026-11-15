import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { format, isAfter } from "date-fns";
import { ArrowRight, CalendarDays, Clock, FolderOpen, Home, Image, Megaphone, MessagesSquare, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import bg from "@/assets/class-bg.jpg";
import { StudentCard } from "@/components/portal/StudentCard";
import { ASSIGNMENTS, COURSES, ME, courseTitle, rosterFor, teacher, today } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

const TABS = [
  { id: "home", label: "Home", icon: Home }, { id: "posts", label: "Posts", icon: Megaphone }, { id: "timeline", label: "Timeline", icon: Clock },
  { id: "calendar", label: "Calendar", icon: CalendarDays }, { id: "resources", label: "Resources", icon: FolderOpen }, { id: "photos", label: "Photos", icon: Image },
  { id: "discussions", label: "Discussions", icon: MessagesSquare }, { id: "directory", label: "Directory", icon: User },
] as const;
type Tab = (typeof TABS)[number]["id"];

export const Route = createFileRoute("/class/$classId")({
  validateSearch: z.object({ tab: z.enum(["home", "posts", "timeline", "calendar", "resources", "photos", "discussions", "directory"]).optional() }),
  loader: ({ params }) => { const c = COURSES.find((x) => x.id === params.classId); if (!c) throw notFound(); return { c }; },
  head: ({ loaderData }) => pageHead(loaderData ? `${loaderData.c.code}: ${courseTitle(loaderData.c)}` : "Class Website", "Class website with assignments, resources and directory."),
  component: ClassSite,
});

function ClassSite() {
  const { c } = Route.useLoaderData();
  const { tab = "home" } = Route.useSearch();
  const nav = useNavigate();
  const t = teacher(c.teacherId);
  const upcoming = ASSIGNMENTS.filter((a) => a.courseId === c.id && !isAfter(today(), a.due)).slice(0, 4);
  return (
    <div className="relative min-h-screen">
      <img src={bg} alt="" width={1920} height={1088} className="fixed inset-0 h-full w-full object-cover" />
      <div className="relative flex h-[38px] items-center justify-between border-b border-primary-foreground/20 bg-vc-classbar px-8 text-primary-foreground">
        <select value={c.id} onChange={(e) => nav({ to: "/class/$classId", params: { classId: e.target.value } })} className="h-[26px] w-[326px] rounded-sm bg-background px-2 text-sm text-muted-foreground">
          {COURSES.map((x) => <option key={x.id} value={x.id}>{courseTitle(x)}</option>)}
        </select>
        <div className="text-[17px]">{ME.email} <Link to="/" className="ml-2 underline">log out</Link></div>
      </div>
      <div className="relative mx-auto flex max-w-[1254px] gap-3.5 pb-16">
        <div className="w-[940px]">
          <h1 className="py-6 text-[38px] font-light text-primary-foreground [text-shadow:0_2px_8px_rgb(0_0_0_/0.6)]">{c.code}: {courseTitle(c)}</h1>
          <div className="min-h-[796px] bg-background">
            <div className="flex bg-vc-panel px-7">{TABS.map(({ id, label, icon: Icon }) => (
              <Link key={id} to="/class/$classId" params={{ classId: c.id }} search={{ tab: id === "home" ? undefined : id }}
                className={`flex w-[111px] flex-col items-center gap-1 border-b-2 pb-2 pt-3 text-[17px] ${tab === id ? "border-vc-link-strong bg-background text-vc-link-strong" : "border-transparent"}`}>
                <Icon className="size-7" strokeWidth={2} />{label}</Link>))}</div>
            <div className="px-5 py-5"><Body tab={tab} c={c} upcoming={upcoming} /></div>
          </div>
        </div>
        <aside className="mt-[118px] w-[300px] space-y-3.5">
          <div className="bg-background p-3.5">
            <div className="text-[20px]">Teacher</div>
            <div className="mt-1 flex gap-2.5"><div className="grid h-[98px] w-[66px] place-items-center bg-vc-tile text-xl text-vc-link-strong">{t.first[0]}{t.last[0]}</div>
              <div><div className="font-semibold">{t.prefix} {t.last}</div><a href={`mailto:${t.email}`} className="text-vc-link-strong">Email</a></div></div>
            <Link to="/grades/$classId" params={{ classId: c.id }} className="mt-4 flex items-center gap-1 text-vc-link-strong">More class information <ArrowRight className="size-3.5" /></Link>
          </div>
          <div className="bg-background p-3.5">
            <Link to="/class/$classId" params={{ classId: c.id }} search={{ tab: "resources" }} className="flex items-center gap-1 text-[20px]">All Pages <ArrowRight className="size-4 text-vc-link-strong" /></Link>
            <button onClick={() => toast("Everything Document", { description: "Opens the class's shared document." })} className="mt-5 block text-vc-link-strong">Everything Document</button>
            <button onClick={() => toast("Course Essay Guidelines")} className="mt-3 block text-vc-link-strong">Course Essay Guidelines</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Body({ tab, c, upcoming }: { tab: Tab; c: (typeof COURSES)[number]; upcoming: typeof ASSIGNMENTS }) {
  if (tab === "home") return (
    <>
      <div className="w-[360px] border-b border-muted-foreground/60 text-[17px] font-semibold text-muted-foreground">Assignments</div>
      <div className="mt-2 space-y-1.5">{upcoming.length ? upcoming.map((a) => (
        <Link key={a.id} to="/grades/$classId" params={{ classId: c.id }} className="flex gap-4 text-[19px] text-vc-link-strong hover:underline">
          <span className="w-9">{format(a.due, "EEE").toUpperCase()}</span><span className="w-14">{format(a.due, "MMM d")}</span><span>{a.title.length > 30 ? a.category[0] + a.category.slice(1).toLowerCase() : a.title}</span></Link>))
        : <p className="text-muted-foreground">No upcoming assignments.</p>}</div>
      <button onClick={() => toast("Everything Document")} className="mx-auto mt-9 block h-[58px] w-[770px] bg-vc-link text-[21px] text-primary-foreground hover:opacity-90">Everything Document</button>
    </>
  );
  if (tab === "directory") return (
    <>
      <h2 className="text-[38px] font-bold">Student Directory</h2>
      <div className="mt-3 text-right"><button onClick={() => window.print()} className="text-[19px] text-vc-link-strong">Download Directory (PDF)</button></div>
      <div className="mt-6 space-y-6 px-5">{rosterFor(c.id).map((s) => <StudentCard key={s.id} s={s} />)}</div>
    </>
  );
  return <p className="py-20 text-center text-muted-foreground">Nothing has been posted to {TABS.find((x) => x.id === tab)?.label} yet.</p>;
}
