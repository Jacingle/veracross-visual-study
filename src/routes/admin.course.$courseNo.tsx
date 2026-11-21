import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { RecordActions } from "@/components/admin/AdminTools";
import { AxAdd, AxBanner, AxDetail, AxEmpty, AxField, AxFooter, AxToggle, axInput, axTd, axTh, type AxGroup } from "@/components/admin/AxiomDetail";
import { CourseTypeSelect } from "@/components/admin/CourseTypeSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { makeCourseId, validateCourse } from "@/lib/course-records";
import { teacherFull } from "@/lib/sis-data";
import { useSchool, yearLabel, type CourseDef, type Section } from "@/lib/school-store";
import { classStatus, yearStartFor } from "@/lib/terms";
import { useRecordWindow } from "@/lib/record-window";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/course/$courseNo")({
  head: ({ params }) => pageHead(`Axiom · Course ${params.courseNo}`, "Course record: type, subject, report card settings and its classes."),
  component: CourseRecord,
});

const STATUS = { current: "Current", future: "Future", past: "Past" } as const;
const GROUPS: AxGroup[] = [{ items: [
  { id: "general", label: "General" }, { id: "other", label: "Other" }, { id: "prior", label: "Prior Year Classes" }, { id: "next", label: "Next Year's Classes" },
  { id: "description", label: "Description" }, { id: "classifications", label: "Classifications" },
] }];
const TITLES: Record<string, string> = { general: "General", other: "Other", prior: "Prior Year Classes", next: "Next Year's Classes", description: "Description", classifications: "Classifications" };

function CourseRecord() {
  const { courseNo } = Route.useParams();
  const { courses } = useSchool();
  const c = courses.find((x) => x.id === courseNo);
  if (!c) return <AxiomShell title="Course not found" crumbs={[{ label: "Courses & Enrollment", to: "/admin/courses" }]}><p>No course {courseNo}. <Link to="/admin/courses" className="text-vc-link-strong">Back to courses</Link></p></AxiomShell>;
  return <Editor key={c.id} c={c} />;
}

function ClassGrid({ list }: { list: Section[] }) {
  return (
    <>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse">
        <thead><tr>{["School Year", "Class ID", "Description", "Teacher", "# of Students", "Status"].map((h) => <th key={h} className={axTh}>{h}</th>)}</tr></thead>
        <tbody>{list.map((s) => <tr key={s.id} className="bg-[#fafafa] hover:bg-vc-panel">
          <td className={axTd}>{yearLabel(s.terms[0]?.split("-")[0] ?? "")}</td>
          <td className={axTd}><Link to="/admin/courses/$courseId" params={{ courseId: s.id }} className="text-vc-link-strong underline">{s.code}</Link></td>
          <td className={axTd}>{s.name}</td><td className={axTd}>{s.teacherIds[0] ? teacherFull(s.teacherIds[0]) : "None"}</td>
          <td className={axTd}>{s.studentIds.length || ""}</td><td className={axTd}>{STATUS[classStatus(s.terms)]}</td>
        </tr>)}</tbody>
      </table>{!list.length && <AxEmpty />}</div>
      <AxFooter count={list.length} />
    </>
  );
}

function Editor({ c }: { c: CourseDef }) {
  const { courses, sections, courseFlags, update } = useSchool();
  const nav = useNavigate();
  const openRecord = useRecordWindow();
  const [d, setD] = useState<CourseDef>(c);
  const [flags, setFlags] = useState<Record<string, boolean>>({ ...(courseFlags[`course:${c.id}`] ?? {}) });
  const [tab, setTab] = useState("general");
  const [copy, setCopy] = useState<{ id: string; name: string } | null>(null);
  const mine = sections.filter((s) => s.courseNo === c.id);
  const cur = yearStartFor(new Date());
  const inYear = (y: number) => mine.filter((s) => s.terms.some((t) => t.startsWith(String(y))));
  const subjects = [...new Set(courses.map((x) => x.dept).filter(Boolean))].sort();
  const on = (k: string, def = true) => flags[k] ?? def;
  const flag = (k: string, label: string, def = true) => <AxField key={k} label={label}><AxToggle label={label} on={on(k, def)} onChange={(v) => setFlags({ ...flags, [k]: v })} /></AxField>;
  const save = () => {
    const error = validateCourse({ ...d, id: c.id }, [], true);
    if (error) { toast.error(error); return; }
    update((s) => ({
      ...s,
      courses: s.courses.map((x) => (x.id === c.id ? { ...d, name: d.name.trim(), dept: d.dept.trim() } : x)),
      sections: s.sections.map((x) => (x.courseNo === c.id ? { ...x, type: d.type } : x)),
      courseFlags: { ...s.courseFlags, [`course:${c.id}`]: flags },
    }));
    toast.success("Course updated");
  };
  const remove = () => {
    if (mine.length) { toast.error(`Course ${c.id} has ${mine.length} ${mine.length === 1 ? "class" : "classes"}. Delete those classes first.`); return; }
    if (!confirm(`Delete course ${c.id}: ${c.name}?`)) return;
    update((s) => { const { [`course:${c.id}`]: _gone, ...rest } = s.courseFlags; return { ...s, courses: s.courses.filter((x) => x.id !== c.id), courseFlags: rest }; });
    toast.success("Course deleted");
    nav({ to: "/admin/courses" });
  };
  const doCopy = () => {
    if (!copy) return;
    const taken = courses.map((x) => x.id);
    const next: CourseDef = { ...d, id: copy.id.trim(), name: copy.name.trim() };
    const error = validateCourse(next, taken);
    if (error) { toast.error(error); return; }
    const final = { ...next, id: next.id || makeCourseId(next.name, taken) };
    update((s) => ({ ...s, courses: [...s.courses, final], courseFlags: { ...s.courseFlags, [`course:${final.id}`]: { ...flags } } }));
    setCopy(null);
    toast.success(`Copied to course ${final.id}`);
    nav({ to: "/admin/course/$courseNo", params: { courseNo: final.id } });
  };
  return (
    <AxiomShell compactRail title={`Course: ${c.name}`} crumbs={[{ label: "Courses & Enrollment", to: "/admin/courses" }]} onUpdate={save}
      recordMenu={<RecordActions title={`Course: ${c.name}`} onCopy={() => setCopy({ id: "", name: `${c.name} (copy)` })} onDelete={remove} />}>
      <AxDetail groups={GROUPS} active={tab} onSelect={setTab} title={TITLES[tab] ?? "General"} meta={`Course ${c.id}`} banner={tab === "general" ? <AxBanner /> : undefined}>
        {tab === "general" && <>
          <div className="grid grid-cols-1 gap-x-8 px-6 py-4 xl:grid-cols-3 [&>div]:border-l [&>div]:border-vc-line [&>div]:pl-5">
            <div>
              <AxField label="Course Type" required><CourseTypeSelect value={d.type} onChange={(type) => setD({ ...d, type })} /></AxField>
              <AxField label="Subject" required><><input aria-label="Subject" list="course-record-subjects" className={axInput} value={d.dept} maxLength={40} placeholder="<None Specified>" onChange={(e) => setD({ ...d, dept: e.target.value })} /><datalist id="course-record-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist></></AxField>
              <AxField label="Course ID"><input aria-label="Course ID" className={axInput} value={c.id} disabled /></AxField>
              <AxField label="Course Name" required><input aria-label="Course name" className={axInput} value={d.name} maxLength={80} onChange={(e) => setD({ ...d, name: e.target.value })} /></AxField>
            </div>
            <div>{flag("report", "Include on Report Card")}{flag("transcript", "Include on Transcript")}{flag("gpa", "Include in GPA")}{flag("archive", "Archive", false)}</div>
            <div>{flag("request", "Available for Request")}{flag("scheduler", "Include in Scheduler")}{flag("conferences", "Include in Parent/Teacher Conferences")}{flag("reviews", "Allow Reviews")}</div>
          </div>
          <div className="flex items-center gap-3 border-y border-vc-line bg-vc-panel px-4 py-2"><AxAdd onClick={() => openRecord("/admin/class/new", { course: c.id })}>Add Record...</AxAdd><span className="text-[13px] text-vc-gray">Adds a class for this course in a new window.</span></div>
          <ClassGrid list={mine} />
        </>}
        {tab === "other" && <div className="px-6 py-4"><AxField label="Credits"><input aria-label="Credits" type="number" min={0} max={5} step={0.25} className={`${axInput} max-w-32 text-right`} value={d.credits} onChange={(e) => setD({ ...d, credits: Math.max(0, Number(e.target.value) || 0) })} /></AxField></div>}
        {tab === "prior" && <ClassGrid list={inYear(cur - 1)} />}
        {tab === "next" && <ClassGrid list={inYear(cur + 1)} />}
        {tab === "description" && <div className="px-6 py-4"><textarea aria-label="Course description" className="h-48 w-full max-w-3xl border border-vc-gray-light/80 bg-background p-2.5 text-[14px] outline-none focus:border-vc-link" maxLength={1000} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></div>}
        {tab === "classifications" && <div className="px-6 py-4">{flag("cls_ap", "Classification: AP", false)}{flag("cls_honors", "Classification: Honors", false)}</div>}
      </AxDetail>
      <Dialog open={!!copy} onOpenChange={(o) => { if (!o) setCopy(null); }}>
        <DialogContent className="max-w-[440px] rounded-none text-[13px]">
          <DialogHeader><DialogTitle className="text-[18px] font-normal">Copy Course</DialogTitle></DialogHeader>
          {copy && <div className="space-y-2">
            <AxField label="Course ID"><input aria-label="New course ID" className={axInput} value={copy.id} maxLength={20} placeholder="Made from the name if blank" onChange={(e) => setCopy({ ...copy, id: e.target.value })} /></AxField>
            <AxField label="Course Name" required><input aria-label="New course name" className={axInput} value={copy.name} maxLength={80} onChange={(e) => setCopy({ ...copy, name: e.target.value })} /></AxField>
            <p className="text-vc-gray">Copies the type, subject, settings and description. Classes are not copied.</p>
            <div className="flex justify-end gap-3 pt-1"><button type="button" className="text-vc-gray hover:underline" onClick={() => setCopy(null)}>Cancel</button><button type="button" onClick={doCopy} className="h-9 bg-ax-go px-4 font-semibold text-primary-foreground">Copy Course</button></div>
          </div>}
        </DialogContent>
      </Dialog>
    </AxiomShell>
  );
}
