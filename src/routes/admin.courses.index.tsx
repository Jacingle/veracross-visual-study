import { createFileRoute, Link } from "@tanstack/react-router";
import { GripVertical } from "lucide-react";
import { useState } from "react";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { AxAction, AxAdd, AxField, AxFooter, AxToggle, axInput } from "@/components/admin/AxiomDetail";
import { CourseTypeSelect } from "@/components/admin/CourseTypeSelect";
import { teacherFull } from "@/lib/sis-data";
import { useRecordWindow } from "@/lib/record-window";
import { useSchool, yearLabel, type CourseDef } from "@/lib/school-store";
import { classStatus, schoolYears, termLabel } from "@/lib/terms";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/courses/")({
  head: () => pageHead("Axiom · Courses & Enrollment", "Create courses, schedule class sections by term and publish them to portals."),
  component: Courses,
});

const inp = "h-8 w-full border border-vc-line bg-background px-2 text-[13px] outline-none focus:border-vc-link";
const STATUS = { current: "Current", future: "Future", past: "Past" } as const;

function Courses() {
  const { courses, sections, courseFlags, update } = useSchool();
  const openRecord = useRecordWindow();
  const years = schoolYears();
  const [year, setYear] = useState(years[1]?.id ?? years[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [classQuery, setClassQuery] = useState("");
  const [portalFilter, setPortalFilter] = useState("");
  const [termFilter, setTermFilter] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  // The order of this list is the order classes appear everywhere in the app (student, teacher and admin views).
  const moveCourse = (from: string, to: string) => {
    if (from === to) return;
    update((s) => {
      const moving = s.courses.find((c) => c.id === from);
      if (!moving) return s;
      const rest = s.courses.filter((c) => c.id !== from);
      const at = rest.findIndex((c) => c.id === to);
      rest.splice(at < 0 ? rest.length : at, 0, moving);
      return { ...s, courses: rest };
    });
  };
  const shownCourses = courses.filter((c) => `${c.id} ${c.name}`.toLowerCase().includes(q.toLowerCase()));
  const courseRank = (no: string) => { const i = courses.findIndex((x) => x.id === no); return i < 0 ? 1e6 : i; };
  const yearSections = sections
    .map((s, position) => ({ s, position }))
    .filter(({ s }) => s.terms.some((t) => t.startsWith(year)) && (!sel || s.courseNo === sel) && `${s.code} ${s.name} ${s.room} ${s.block}`.toLowerCase().includes(classQuery.toLowerCase()) && (!portalFilter || s.published === (portalFilter === "published")) && (!termFilter || s.terms.includes(`${year}-${termFilter}`)))
    .sort((a, b) => courseRank(a.s.courseNo) - courseRank(b.s.courseNo) || a.position - b.position)
    .map(({ s }) => s);

  return (
    <AxiomShell title="Courses & Enrollment" actions={<AxAction onClick={() => openRecord("/admin/course/new")}>Add Course</AxAction>}>
      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-3">
        <Panel title={`Courses (${courses.length})`}>
          <input aria-label="Filter courses" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter courses" className={`${inp} mb-1`} />
          <p className="mb-2 text-[11px] text-muted-foreground">Drag courses to set the order classes appear in across the app.</p>
          <ul className="max-h-[560px] overflow-y-auto">
            <li><button onClick={() => setSel(null)} className={`w-full px-2 py-1.5 text-left ${!sel ? "bg-vc-select" : "hover:bg-vc-panel"}`}>All courses</button></li>
            {shownCourses.map((c) => (
              <li key={c.id} draggable title="Drag to set the order classes appear in across the app"
                onDragStart={(e) => { setDragId(c.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", c.id); }}
                onDragOver={(e) => { e.preventDefault(); if (dragId && overId !== c.id) setOverId(c.id); }}
                onDrop={(e) => { e.preventDefault(); const from = e.dataTransfer.getData("text/plain") || dragId; if (from) moveCourse(from, c.id); setDragId(null); setOverId(null); }}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                className={`flex cursor-grab items-center justify-between px-2 py-1.5 active:cursor-grabbing ${dragId === c.id ? "opacity-40" : ""} ${overId === c.id && dragId !== c.id ? "border-t-2 border-vc-link" : "border-t-2 border-transparent"} ${sel === c.id ? "bg-vc-select" : "hover:bg-vc-panel"}`}>
                <GripVertical aria-hidden className="mr-1 size-4 shrink-0 text-muted-foreground/60" />
                <button onClick={() => setSel(c.id)} className="min-w-0 flex-1 truncate text-left"><span className="font-mono text-[12px]">{c.id}</span> · {c.name}</button>
                <button onClick={() => openRecord("/admin/class/new", { course: c.id })} className="ml-2 shrink-0 text-[12px] text-vc-link-strong hover:underline">+ Class</button></li>))}
          </ul>
        </Panel>
        <div className="min-w-0 border border-vc-line bg-background">
          {sel && courses.filter((c) => c.id === sel).map((c) => { const flagOn = (k: string) => courseFlags[`course:${c.id}`]?.[k] ?? true; const setFlag = (k: string, v: boolean) => update((st) => ({ ...st, courseFlags: { ...st.courseFlags, [`course:${c.id}`]: { ...st.courseFlags[`course:${c.id}`], [k]: v } } })); const patch = (p: Partial<CourseDef>) => update((st) => ({ ...st, courses: st.courses.map((x) => (x.id === c.id ? { ...x, ...p } : x)) })); return (
            <div key={c.id} className="border-b border-vc-line">
              <div className="flex items-baseline justify-between border-b border-vc-line px-6 py-2.5"><h1 className="text-[27px] font-light uppercase leading-9">General</h1><span className="text-[13px] text-vc-gray">Course {c.id} · <Link to="/admin/course/$courseNo" params={{ courseNo: c.id }} className="text-vc-link-strong hover:underline">Open course record</Link></span></div>
              <div className="grid grid-cols-1 gap-x-8 px-6 py-5 xl:grid-cols-3 [&>div]:border-l [&>div]:border-vc-line [&>div]:pl-5">
                <div>
                  <AxField label="Course Type" required><CourseTypeSelect value={c.type} onChange={(type) => patch({ type })} /></AxField>
                  <AxField label="Subject" required><input aria-label="Subject or department" className={axInput} value={c.dept} maxLength={40} placeholder="<None Specified>" onChange={(e) => patch({ dept: e.target.value })} /></AxField>
                  <AxField label="Course ID"><input aria-label="Course ID" className={axInput} value={c.id} disabled /></AxField>
                  <AxField label="Course Name" required><input aria-label="Course name" className={axInput} value={c.name} maxLength={80} onChange={(e) => patch({ name: e.target.value })} /></AxField>
                  <AxField label="Credits"><input aria-label="Credits" type="number" min={0} max={5} step={0.25} className={`${axInput} text-right`} value={c.credits} onChange={(e) => patch({ credits: Math.max(0, Number(e.target.value) || 0) })} /></AxField>
                </div>
                <div>
                  <AxField label="Include on Report Card"><AxToggle label="Include on report card" on={flagOn("report")} onChange={(v) => setFlag("report", v)} /></AxField>
                  <AxField label="Include on Transcript"><AxToggle label="Include on transcript" on={flagOn("transcript")} onChange={(v) => setFlag("transcript", v)} /></AxField>
                  <AxField label="Include in GPA"><AxToggle label="Include in GPA" on={flagOn("gpa")} onChange={(v) => setFlag("gpa", v)} /></AxField>
                  <AxField label="Include in Scheduler"><AxToggle label="Include in scheduler" on={flagOn("scheduler")} onChange={(v) => setFlag("scheduler", v)} /></AxField>
                  <AxField label="Include in Parent/Teacher Conferences"><AxToggle label="Include in parent/teacher conferences" on={flagOn("conferences")} onChange={(v) => setFlag("conferences", v)} /></AxField>
                  <AxField label="Available for Request"><AxToggle label="Available for request" on={flagOn("request")} onChange={(v) => setFlag("request", v)} /></AxField>
                  <AxField label="Classification: AP"><AxToggle label="Classification AP" on={courseFlags[`course:${c.id}`]?.["cls_ap"] ?? false} onChange={(v) => setFlag("cls_ap", v)} /></AxField>
                  <AxField label="Classification: Honors"><AxToggle label="Classification Honors" on={courseFlags[`course:${c.id}`]?.["cls_honors"] ?? false} onChange={(v) => setFlag("cls_honors", v)} /></AxField>
                </div>
                <div><AxField label="Description"><textarea aria-label="Course description" className="h-[118px] w-full border border-vc-gray-light/80 bg-background p-2.5 text-[15px] outline-none focus:border-vc-link" maxLength={1000} value={c.description} onChange={(e) => patch({ description: e.target.value })} /></AxField></div>
              </div>
              <div className="flex items-center gap-3 border-t border-vc-line bg-vc-panel px-4 py-2"><AxAdd onClick={() => openRecord("/admin/class/new", { course: c.id })}>Add Record</AxAdd><span className="text-[13px] text-vc-gray">Adds a class for this course in a new window.</span></div>
            </div>); })}
          <div className="flex flex-wrap items-center gap-3 border-b border-vc-line bg-vc-panel px-4 py-2">
            <span className="text-[15px] font-semibold">Classes</span>
            <label className="ml-auto flex items-center gap-2">School Year
              <select aria-label="School year" value={year} onChange={(e) => setYear(e.target.value)} className="h-7 border border-vc-line bg-background px-2">{years.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}</select></label>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-vc-line px-3 py-2"><input aria-label="Find classes" placeholder="Class, room or block" value={classQuery} onChange={(e) => setClassQuery(e.target.value)} className={`${inp} max-w-60`} /><select aria-label="Filter class publication" value={portalFilter} onChange={(e) => setPortalFilter(e.target.value)} className="h-8 border border-vc-line bg-background px-2"><option value="">All portal statuses</option><option value="published">Published</option><option value="draft">Draft</option></select><select aria-label="Filter class term" value={termFilter} onChange={(e) => setTermFilter(e.target.value)} className="h-8 border border-vc-line bg-background px-2"><option value="">All terms</option><option value="S1">Semester 1</option><option value="S2">Semester 2</option></select></div>
          <div className="overflow-x-auto"><table className="w-full [&_td]:border-r [&_td]:border-dotted [&_td]:border-vc-line [&_td]:px-2 [&_th]:border-r [&_th]:border-dotted [&_th]:border-vc-line [&_th]:px-2 [&_tbody_tr]:bg-background [&_tbody_tr]:h-[34px] min-w-[760px]">
            <thead><tr className="border-b border-vc-line text-left text-[11px] uppercase text-muted-foreground"><th className="px-3 py-1.5">Class ID</th><th>Description</th><th>Teacher</th><th>Block</th><th>Room</th><th>Terms</th><th>Status</th><th>Portals</th><th className="pr-3 text-right">Enrolled</th></tr></thead>
            <tbody>{yearSections.map((c) => (
              <tr key={c.id} className="border-b border-vc-line hover:bg-vc-panel">
                <td className="px-3 py-1.5 font-mono text-[12px]">{c.code}</td>
                <td><Link to="/admin/courses/$courseId" params={{ courseId: c.id }} className="text-vc-link-strong hover:underline">{c.name}</Link></td>
                <td>{c.teacherIds[0] ? teacherFull(c.teacherIds[0]) : <span className="text-destructive">None</span>}{(c.aideIds?.length ?? 0) > 0 && <span className="ml-1 text-[11px] text-vc-gray">+{c.aideIds?.length} {c.aideIds?.length === 1 ? "aide" : "aides"}</span>}</td>
                <td>{c.block || "—"}</td><td>{c.room || "—"}</td>
                <td className="text-[12px]">{c.terms.length === 2 ? `${yearLabel(year)} Full Year` : c.terms.map(termLabel).join(", ")}</td>
                <td className="text-[12px]">{STATUS[classStatus(c.terms)]}</td>
                <td>{c.published ? <span className="bg-vc-success px-1.5 py-px text-[10px] font-semibold text-primary-foreground">PUBLISHED</span> : <span className="border border-vc-line px-1.5 py-px text-[10px] text-muted-foreground">DRAFT</span>}</td>
                <td className="pr-3 text-right">{c.studentIds.length}</td>
              </tr>))}
              {!yearSections.length && <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No classes scheduled for {yearLabel(year)}{sel ? ` in course ${sel}` : ""}. Use "+ Class" next to a course.</td></tr>}</tbody>
          </table></div>
          <AxFooter count={yearSections.length} />
        </div>
      </div>
    </AxiomShell>
  );
}
