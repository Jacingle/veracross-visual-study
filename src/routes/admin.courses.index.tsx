import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GripVertical, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { teacherFull, type Course } from "@/lib/sis-data";
import { BLANK_SITE, useSchool, yearLabel, type CourseDef } from "@/lib/school-store";
import { classStatus, schoolYears, termLabel } from "@/lib/terms";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/courses/")({
  head: () => pageHead("Axiom · Courses & Enrollment", "Create courses, schedule class sections by term and publish them to portals."),
  component: Courses,
});

const inp = "h-8 w-full border border-vc-line bg-background px-2 text-[13px] outline-none focus:border-vc-link";
const STATUS = { current: "Current", future: "Future", past: "Past" } as const;

function Courses() {
  const { courses, sections, courseFlags, update } = useSchool();
  const nav = useNavigate();
  const years = schoolYears();
  const [year, setYear] = useState(years[1]?.id ?? years[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CourseDef | null>(null);
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
    .filter(({ s }) => s.terms.some((t) => t.startsWith(year)) && (!sel || s.courseNo === sel))
    .sort((a, b) => courseRank(a.s.courseNo) - courseRank(b.s.courseNo) || a.position - b.position)
    .map(({ s }) => s);

  const saveCourse = (e: React.FormEvent) => {
    e.preventDefault(); if (!draft) return;
    const d = { ...draft, id: draft.id.trim(), name: draft.name.trim() };
    if (!/^[A-Za-z0-9_-]{1,20}$/.test(d.id)) { toast.error("Course ID: up to 20 letters, digits, hyphens or underscores."); return; }
    if (!d.name) { toast.error("Course name is required."); return; }
    if (!Number.isFinite(d.credits) || d.credits < 0) { toast.error("Credits must be a nonnegative number."); return; }
    if (!editing && courses.some((c) => c.id === d.id)) { toast.error("That course number already exists."); return; }
    update((s) => ({ ...s, courses: editing ? s.courses.map((c) => c.id === d.id ? d : c) : [...s.courses, d] })); setDraft(null); setSel(d.id); toast.success(editing ? "Course updated" : `Course ${d.id} created`);
  };
  const newClass = (c: CourseDef) => {
    const n = sections.filter((s) => s.courseNo === c.id).length + 1;
    let id = `${c.id}-${n}`; let k = n; while (sections.some((s) => s.id === id)) id = `${c.id}-${++k}`;
    const base: Course = { id, code: id, name: c.name, section: String(k), teacherId: "", block: "", room: "", letter: "", pct: 0, type: c.type, days: [], time: "" };
    update((s) => ({ ...s, sections: [...s.sections, { ...base, courseNo: c.id, teacherIds: [], terms: [`${year}-S1`, `${year}-S2`], published: false, studentIds: [], website: { ...BLANK_SITE } }], courseFlags: { ...s.courseFlags, [id]: { ...s.courseFlags[`course:${c.id}`] } } }));
    nav({ to: "/admin/courses/$courseId", params: { courseId: id } });
  };

  return (
    <AxiomShell title="Courses & Enrollment" actions={<button onClick={() => { setEditing(false); setDraft({ id: "", name: "", type: "ACADEMIC", dept: "", credits: 1, description: "" }); }} className="flex h-7 items-center gap-1 bg-ax-go px-3 font-semibold text-primary-foreground"><Plus className="size-4" />New Course</button>}>
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
                <button onClick={() => newClass(c)} className="ml-2 shrink-0 text-[12px] text-vc-link-strong hover:underline">+ Class</button></li>))}
          </ul>
        </Panel>
        <div className="min-w-0 border border-vc-line bg-background">
          {sel && courses.filter((c) => c.id === sel).map((c) => <div key={c.id} className="border-b border-vc-line"><div className="flex items-center justify-between bg-ax-head px-3 py-2 font-semibold">GENERAL<Button variant="ghost" size="sm" onClick={() => { setEditing(true); setDraft({ ...c }); }}>Edit Course</Button></div><div className="grid gap-4 p-4 md:grid-cols-2"><dl className="grid grid-cols-[110px_1fr] gap-2"><dt className="text-muted-foreground">COURSE TYPE</dt><dd>{c.type}</dd><dt className="text-muted-foreground">DEPARTMENT</dt><dd>{c.dept || "-"}</dd><dt className="text-muted-foreground">COURSE ID</dt><dd>{c.id}</dd><dt className="text-muted-foreground">COURSE NAME</dt><dd>{c.name}</dd><dt className="text-muted-foreground">CREDITS</dt><dd>{c.credits}</dd></dl><div className="space-y-2">{([["report", "Include on Report Card"], ["transcript", "Include on Transcript"], ["gpa", "Include in GPA"]] as const).map(([key, label]) => <label key={key} className="flex items-center justify-between gap-3">{label}<Switch aria-label={`Course ${label}`} checked={courseFlags[`course:${c.id}`]?.[key] ?? true} onCheckedChange={(value) => update((s) => ({ ...s, courseFlags: { ...s.courseFlags, [`course:${c.id}`]: { ...s.courseFlags[`course:${c.id}`], [key]: value } } }))} /></label>)}</div></div>{c.description && <p className="px-4 pb-4 whitespace-pre-wrap">{c.description}</p>}</div>)}
          <div className="flex items-center gap-3 border-b border-vc-line bg-ax-head px-3 py-2">
            <span className="font-semibold">Class Sections</span>
            <label className="ml-auto flex items-center gap-2">School Year
              <select aria-label="School year" value={year} onChange={(e) => setYear(e.target.value)} className="h-7 border border-vc-line bg-background px-2">{years.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}</select></label>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px]">
            <thead><tr className="border-b border-vc-line text-left text-[11px] uppercase text-muted-foreground"><th className="px-3 py-1.5">Class ID</th><th>Description</th><th>Teacher(s)</th><th>Block</th><th>Room</th><th>Terms</th><th>Status</th><th>Portals</th><th className="pr-3 text-right">Enrolled</th></tr></thead>
            <tbody>{yearSections.map((c) => (
              <tr key={c.id} className="border-b border-vc-line hover:bg-vc-panel">
                <td className="px-3 py-1.5 font-mono text-[12px]">{c.code}</td>
                <td><Link to="/admin/courses/$courseId" params={{ courseId: c.id }} className="text-vc-link-strong hover:underline">{c.name}</Link></td>
                <td>{c.teacherIds.length ? c.teacherIds.map(teacherFull).join(", ") : <span className="text-destructive">None</span>}</td>
                <td>{c.block || "—"}</td><td>{c.room || "—"}</td>
                <td className="text-[12px]">{c.terms.length === 2 ? `${yearLabel(year)} Full Year` : c.terms.map(termLabel).join(", ")}</td>
                <td className="text-[12px]">{STATUS[classStatus(c.terms)]}</td>
                <td>{c.published ? <span className="bg-vc-success px-1.5 py-px text-[10px] font-semibold text-primary-foreground">PUBLISHED</span> : <span className="border border-vc-line px-1.5 py-px text-[10px] text-muted-foreground">DRAFT</span>}</td>
                <td className="pr-3 text-right">{c.studentIds.length}</td>
              </tr>))}
              {!yearSections.length && <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No classes scheduled for {yearLabel(year)}{sel ? ` in course ${sel}` : ""}. Use "+ Class" next to a course.</td></tr>}</tbody>
          </table></div>
        </div>
      </div>
      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-[460px] text-[13px]">
          <DialogHeader><DialogTitle className="text-[17px]">{editing ? "Edit Course" : "New Course"}</DialogTitle></DialogHeader>
          {draft && <form onSubmit={saveCourse} className="space-y-2.5 text-[12px] text-muted-foreground">
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <label>COURSE #<input className={inp} value={draft.id} disabled={editing} maxLength={20} onChange={(e) => setDraft({ ...draft, id: e.target.value })} /></label>
              <label>COURSE NAME<input className={inp} value={draft.name} maxLength={80} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label></div>
            <div className="grid grid-cols-3 gap-3">
              <label>TYPE<select className={inp} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as CourseDef["type"] })}>{(["ACADEMIC", "ARTS", "ADVISORY"] as const).map((t) => <option key={t}>{t}</option>)}</select></label>
              <label>DEPARTMENT<input className={inp} value={draft.dept} maxLength={40} onChange={(e) => setDraft({ ...draft, dept: e.target.value })} /></label>
              <label>CREDITS<input type="number" min={0} max={5} step={0.25} className={inp} value={draft.credits} onChange={(e) => setDraft({ ...draft, credits: Number(e.target.value) })} /></label></div>
            <label className="block">DESCRIPTION<textarea className="h-20 w-full border border-vc-line p-2 text-[13px]" maxLength={1000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setDraft(null)} className="h-8 border border-vc-line px-3 text-foreground">Cancel</button><button className="h-8 bg-ax-go px-4 font-semibold text-primary-foreground">{editing ? "Save Course" : "Create Course"}</button></div>
          </form>}
        </DialogContent>
      </Dialog>
    </AxiomShell>
  );
}
