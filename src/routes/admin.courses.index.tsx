import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { teacherFull, type Course } from "@/lib/sis-data";
import { BLANK_SITE, useSchool, yearLabel, type CourseDef } from "@/lib/school-store";
import { classStatus, schoolYears, termLabel } from "@/lib/terms";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/courses/")({
  head: () => pageHead("Axiom · Courses & Enrollment", "Create courses, schedule class sections by term and publish them to portals."),
  component: Courses,
});

const inp = "h-8 w-full border border-vc-line bg-background px-2 text-[13px] outline-none focus:border-vc-link";
const STATUS = { current: "Current", future: "Future", past: "Past" } as const;

function Courses() {
  const { courses, sections, update } = useSchool();
  const nav = useNavigate();
  const years = schoolYears();
  const [year, setYear] = useState(years[1]!.id);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [draft, setDraft] = useState<CourseDef | null>(null);
  const shownCourses = courses.filter((c) => `${c.id} ${c.name}`.toLowerCase().includes(q.toLowerCase()));
  const yearSections = sections.filter((s) => s.terms.some((t) => t.startsWith(year)) && (!sel || s.courseNo === sel));

  const saveCourse = (e: React.FormEvent) => {
    e.preventDefault(); if (!draft) return;
    const d = { ...draft, id: draft.id.trim(), name: draft.name.trim() };
    if (!/^[A-Za-z0-9]{1,8}$/.test(d.id)) { toast.error("Course number: 1–8 letters or digits."); return; }
    if (!d.name) { toast.error("Course name is required."); return; }
    if (courses.some((c) => c.id === d.id)) { toast.error("That course number already exists."); return; }
    update((s) => ({ ...s, courses: [...s.courses, d] })); setDraft(null); setSel(d.id); toast.success(`Course ${d.id} created`);
  };
  const newClass = (c: CourseDef) => {
    const n = sections.filter((s) => s.courseNo === c.id).length + 1;
    let id = `${c.id}-${n}`; let k = n; while (sections.some((s) => s.id === id)) id = `${c.id}-${++k}`;
    const base: Course = { id, code: id, name: c.name, section: String(k), teacherId: "", block: "", room: "", letter: "", pct: 0, type: c.type, days: [], time: "" };
    update((s) => ({ ...s, sections: [...s.sections, { ...base, courseNo: c.id, teacherIds: [], terms: [`${year}-S1`, `${year}-S2`], published: false, studentIds: [], website: { ...BLANK_SITE } }] }));
    nav({ to: "/admin/courses/$courseId", params: { courseId: id } });
  };

  return (
    <AxiomShell title="Courses & Enrollment" actions={<button onClick={() => setDraft({ id: "", name: "", type: "ACADEMIC", dept: "", credits: 1, description: "" })} className="flex h-7 items-center gap-1 bg-ax-go px-3 font-semibold text-primary-foreground"><Plus className="size-4" />New Course</button>}>
      <div className="grid grid-cols-[340px_minmax(0,1fr)] gap-3">
        <Panel title={`Courses (${courses.length})`}>
          <input aria-label="Filter courses" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter courses" className={`${inp} mb-2`} />
          <ul className="max-h-[560px] overflow-y-auto">
            <li><button onClick={() => setSel(null)} className={`w-full px-2 py-1.5 text-left ${!sel ? "bg-vc-select" : "hover:bg-vc-panel"}`}>All courses</button></li>
            {shownCourses.map((c) => (
              <li key={c.id} className={`flex items-center justify-between px-2 py-1.5 ${sel === c.id ? "bg-vc-select" : "hover:bg-vc-panel"}`}>
                <button onClick={() => setSel(c.id)} className="min-w-0 flex-1 truncate text-left"><span className="font-mono text-[12px]">{c.id}</span> · {c.name}</button>
                <button onClick={() => newClass(c)} className="ml-2 shrink-0 text-[12px] text-vc-link-strong hover:underline">+ Class</button></li>))}
          </ul>
        </Panel>
        <div className="border border-vc-line bg-background">
          <div className="flex items-center gap-3 border-b border-vc-line bg-ax-head px-3 py-2">
            <span className="font-semibold">Class Sections</span>
            <label className="ml-auto flex items-center gap-2">School Year
              <select aria-label="School year" value={year} onChange={(e) => setYear(e.target.value)} className="h-7 border border-vc-line bg-background px-2">{years.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}</select></label>
          </div>
          <table className="w-full">
            <thead><tr className="border-b border-vc-line text-left text-[11px] uppercase text-muted-foreground"><th className="px-3 py-1.5">Class ID</th><th>Description</th><th>Teacher(s)</th><th>Block</th><th>Room</th><th>Terms</th><th>Status</th><th>Portals</th><th className="pr-3 text-right">Enrolled</th></tr></thead>
            <tbody>{yearSections.map((c) => (
              <tr key={c.id} className="border-b border-vc-line hover:bg-vc-panel">
                <td className="px-3 py-1.5 font-mono text-[12px]">{c.id}</td>
                <td><Link to="/admin/courses/$courseId" params={{ courseId: c.id }} className="text-vc-link-strong hover:underline">{c.name}</Link></td>
                <td>{c.teacherIds.length ? c.teacherIds.map(teacherFull).join(", ") : <span className="text-destructive">None</span>}</td>
                <td>{c.block || "—"}</td><td>{c.room || "—"}</td>
                <td className="text-[12px]">{c.terms.length === 2 ? `${yearLabel(year)} Full Year` : c.terms.map(termLabel).join(", ")}</td>
                <td className="text-[12px]">{STATUS[classStatus(c.terms)]}</td>
                <td>{c.published ? <span className="bg-vc-success px-1.5 py-px text-[10px] font-semibold text-primary-foreground">PUBLISHED</span> : <span className="border border-vc-line px-1.5 py-px text-[10px] text-muted-foreground">DRAFT</span>}</td>
                <td className="pr-3 text-right">{c.studentIds.length}</td>
              </tr>))}
              {!yearSections.length && <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No classes scheduled for {yearLabel(year)}{sel ? ` in course ${sel}` : ""}. Use "+ Class" next to a course.</td></tr>}</tbody>
          </table>
        </div>
      </div>
      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-[460px] text-[13px]">
          <DialogHeader><DialogTitle className="text-[17px]">New Course</DialogTitle></DialogHeader>
          {draft && <form onSubmit={saveCourse} className="space-y-2.5 text-[12px] text-muted-foreground">
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <label>COURSE #<input className={inp} value={draft.id} maxLength={8} onChange={(e) => setDraft({ ...draft, id: e.target.value })} /></label>
              <label>COURSE NAME<input className={inp} value={draft.name} maxLength={80} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label></div>
            <div className="grid grid-cols-3 gap-3">
              <label>TYPE<select className={inp} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as CourseDef["type"] })}>{(["ACADEMIC", "ARTS", "ADVISORY"] as const).map((t) => <option key={t}>{t}</option>)}</select></label>
              <label>DEPARTMENT<input className={inp} value={draft.dept} maxLength={40} onChange={(e) => setDraft({ ...draft, dept: e.target.value })} /></label>
              <label>CREDITS<input type="number" min={0} max={5} step={0.25} className={inp} value={draft.credits} onChange={(e) => setDraft({ ...draft, credits: Number(e.target.value) })} /></label></div>
            <label className="block">DESCRIPTION<textarea className="h-20 w-full border border-vc-line p-2 text-[13px]" maxLength={1000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setDraft(null)} className="h-8 border border-vc-line px-3 text-foreground">Cancel</button><button className="h-8 bg-ax-go px-4 font-semibold text-primary-foreground">Create Course</button></div>
          </form>}
        </DialogContent>
      </Dialog>
    </AxiomShell>
  );
}
