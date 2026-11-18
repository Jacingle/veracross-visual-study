import { PersonPhoto } from "@/components/common/PersonPhoto";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { isAfter } from "date-fns";
import { ArrowRight } from "lucide-react";
import { useState, type ComponentType, type CSSProperties } from "react";
import { z } from "zod";
import { RoleGate } from "@/components/auth/RoleGate";
import { AssignmentDialog } from "@/components/portal/AssignmentDialog";
import { CalendarIcon, DirectoryIcon, DiscussionsIcon, FolderIcon, HomeIcon, PhotosIcon, PostsIcon, TimelineIcon } from "@/components/site/SiteIcons";
import { CalendarView, ClassPicker, DirectoryView, HomeView, InfoView, PageListView, PagesPlaceholder, PageView, PostsView, ResourcesView, TimelineView } from "@/components/site/SiteViews";
import { courseTitle, teacher, today, type Assignment } from "@/lib/sis-data";
import { useMySections, useSchool, useSectionAssignments, useStudentAssignments, type Section } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

const TABS: { id: Tab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "home", label: "Home", icon: HomeIcon }, { id: "posts", label: "Posts", icon: PostsIcon }, { id: "timeline", label: "Timeline", icon: TimelineIcon },
  { id: "calendar", label: "Calendar", icon: CalendarIcon }, { id: "resources", label: "Resources", icon: FolderIcon }, { id: "photos", label: "Photos", icon: PhotosIcon },
  { id: "discussions", label: "Discussions", icon: DiscussionsIcon }, { id: "directory", label: "Directory", icon: DirectoryIcon },
];
const TAB_IDS = ["home", "posts", "timeline", "calendar", "resources", "photos", "discussions", "directory", "info", "pages"] as const;
type Tab = (typeof TAB_IDS)[number];

export const Route = createFileRoute("/class/$classId")({
  validateSearch: z.object({ tab: z.enum(TAB_IDS).optional(), page: z.string().optional() }),
  head: ({ params }) => pageHead(`Class Website · ${params.classId}`, "Class website with assignments, resources and directory."),
  component: () => <RoleGate area="shared"><ClassSite /></RoleGate>,
});

function ClassSite() {
  const { classId } = Route.useParams();
  const options = useMySections();
  const c = options.find((x) => x.id === classId);
  if (!c) return <div className="p-10 text-[14px]">This class website isn't available to you. <Link to="/" className="text-vc-site-blue">Go home</Link></div>;
  return <Site c={c} options={options} />;
}

function Site({ c, options }: { c: Section; options: Section[] }) {
  const { tab = "home", page } = Route.useSearch();
  const nav = useNavigate();
  const { user, logout, users, courses, schedulingSets } = useSchool();
  const student = user?.role === "student";
  const sect = useSectionAssignments(c.id);
  const mine = useStudentAssignments();
  const all = student ? mine.filter((a) => a.courseId === c.id) : sect;
  const upcoming = all.filter((a) => !isAfter(today(), a.due)).sort((a, b) => +a.due - +b.due).slice(0, 5);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const ws = c.website;
  const styled = ws.bg !== "none";
  const pageName = page && ws.pages.includes(page) && (!student || ws.pageContent?.[page]?.published) ? page : undefined;
  const active: Tab | undefined = pageName ? "posts" : tab === "info" || tab === "pages" ? undefined : tab;
  const description = courses.find((x) => x.id === c.courseNo)?.description || ws.sections.find((s) => s.title === "Course Description")?.body || "";
  const shownPages = ws.pages.filter((p) => !student || ws.pageContent?.[p]?.published);
  const vars = { ...(ws.barColor ? { "--vc-classbar": ws.barColor } : {}), ...(ws.linkColor ? { "--vc-site-blue": ws.linkColor } : {}) } as CSSProperties;
  const go = (search: { tab?: Tab; page?: string }) => nav({ to: "/class/$classId", params: { classId: c.id }, search });

  let body;
  if (pageName) body = <PageView name={pageName} ws={ws} />;
  else if (tab === "info") body = <InfoView c={c} sets={schedulingSets} description={description} />;
  else if (tab === "pages") body = <PageListView c={c} student={student} />;
  else if (tab === "home") body = <HomeView c={c} upcoming={upcoming} onOpen={setSelected} />;
  else if (tab === "posts") body = <PostsView ws={ws} student={student} />;
  else if (tab === "timeline") body = <TimelineView list={all} onOpen={setSelected} />;
  else if (tab === "calendar") body = <CalendarView c={c} sets={schedulingSets} list={all} onOpen={setSelected} />;
  else if (tab === "resources") body = <ResourcesView ws={ws} />;
  else if (tab === "directory") body = <DirectoryView c={c} />;
  else body = <PagesPlaceholder what={TABS.find((x) => x.id === tab)?.label ?? "this page"} />;

  return (
    <div className="relative min-h-screen" style={{ ...vars, zoom: 0.9 }}>
      {ws.bg === "photo" && ws.photo ? <img src={ws.photo} alt="" width={1600} height={900} className="fixed inset-0 h-full w-full object-cover" />
        : <div className="fixed inset-0 bg-[#eeeeee]" style={ws.bg === "color" ? { background: ws.color } : undefined} />}
      {/* A color or photo gets a soft dark shadow across the top, like the original. */}
      {styled && <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-[430px]" style={{ background: "linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.28) 45%, rgba(0,0,0,0))" }} />}
      <div className="relative z-20 flex h-10 items-center justify-between border-b border-white/25 bg-vc-classbar px-6 text-[14px] text-primary-foreground shadow-sm">
        <ClassPicker current={c.id} options={options} onPick={(id) => nav({ to: "/class/$classId", params: { classId: id } })} />
        <div className="whitespace-nowrap">{user?.email} <button onClick={() => { logout(); nav({ to: "/", replace: true }); }} className="ml-1.5 underline">log out</button></div>
      </div>
      <div className="relative mx-auto w-[calc(100%-2rem)] max-w-[1070px] pb-12">
        <h1 className={`pb-[8px] pt-[22px] text-[30px] font-light leading-[38px] ${styled ? "text-primary-foreground [text-shadow:0_1px_4px_rgba(0,0,0,.65)]" : "text-foreground"}`}>{c.code}: {courseTitle(c)}</h1>
        <div className="grid grid-cols-1 items-start gap-[11px] md:grid-cols-[minmax(0,1fr)_256px]">
          <div className="min-h-[680px] min-w-0 rounded-[3px] bg-background shadow-[0_1px_3px_rgba(0,0,0,.18)]">
            <div role="tablist" className={`grid grid-cols-4 border-b border-vc-line px-6 sm:grid-cols-8 ${styled ? "bg-vc-panel" : "bg-background"}`}>{TABS.map(({ id, label, icon: Icon }) => (
              <Link key={id} role="tab" aria-selected={active === id} to="/class/$classId" params={{ classId: c.id }} search={{ tab: id === "home" ? undefined : id }}
                className={`-mb-px flex h-[67px] flex-col items-center justify-center gap-[4px] border-b-[3px] text-[15px] leading-5 ${active === id ? `border-vc-site-blue ${styled ? "bg-background" : "bg-vc-panel"} text-vc-site-blue` : "border-transparent text-foreground hover:bg-background"}`}>
                <Icon className="size-[23px]" />{label}</Link>))}</div>
            {body}
          </div>
          <aside className="space-y-[11px] text-[15px]">
            <div className="rounded-[3px] bg-background px-3 pb-[9px] pt-[9px] shadow-[0_1px_3px_rgba(0,0,0,.18)]">
              <div className="text-[18px] leading-6">Teacher</div>
              {c.teacherIds.map((id) => { const phone = users.find((u) => u.personId === id)?.phone; const f = teacher(id); return (
                <div key={id} className="mt-1.5 flex items-start gap-3">
                  <PersonPhoto personId={id} full fit={{ w: 55, h: 83 }} squareIfMissing alt={`${f.prefix} ${f.last}`.trim()} />
                  <div className="min-w-0 text-[15px] leading-[20px]"><div className="font-semibold">{f.prefix ? `${f.prefix} ${f.last}` : f.last}</div>
                    {phone && <div>{phone}</div>}<a href={`mailto:${f.email}`} className="text-vc-site-blue">Email</a></div>
                </div>); })}
              <button onClick={() => go({ tab: "info" })} className="mt-[9px] flex items-center gap-1 text-[15px] text-vc-site-blue">More class information <ArrowRight className="size-3.5" strokeWidth={3} /></button>
            </div>
            <div className="rounded-[3px] bg-background px-3 pb-[22px] pt-[16px] shadow-[0_1px_3px_rgba(0,0,0,.18)]">
              <button onClick={() => go({ tab: "pages" })} className="flex items-center gap-1.5 text-[18px] leading-6">All Pages <ArrowRight className="size-4 text-vc-site-blue" strokeWidth={3} /></button>
              {shownPages.length ? <div className="mt-[10px] space-y-[17px] pt-1">{shownPages.map((pg) => <button key={pg} onClick={() => go({ page: pg })} className="block text-left text-[16px] leading-5 text-vc-site-blue">{pg}</button>)}</div>
                : <p className="mt-2 text-muted-foreground">No pages yet.</p>}
            </div>
          </aside>
        </div>
      </div>
      <AssignmentDialog assignment={selected} onClose={() => setSelected(null)} detailed={false} />
    </div>
  );
}
