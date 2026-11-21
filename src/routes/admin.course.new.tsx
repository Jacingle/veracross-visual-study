import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AxAction, AxBanner, AxEmpty, AxField, AxFooter, AxToggle, axInput, axTh } from "@/components/admin/AxiomDetail";
import { CourseTypeSelect } from "@/components/admin/CourseTypeSelect";
import { RecordWindow } from "@/components/admin/RecordWindow";
import { DEFAULT_COURSE_TYPE, isOtherClass, type CourseType } from "@/lib/course-types";
import { defaultCourseFlags, makeCourseId, validateCourse } from "@/lib/course-records";
import { useSchool, type CourseDef } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/course/new")({
  head: () => pageHead("Axiom · New Course", "Create a course: type, subject, name and report card settings."),
  component: NewCourse,
});

function NewCourse() {
  const { courses, update } = useSchool();
  const nav = useNavigate();
  const [type, setType] = useState<CourseType>(DEFAULT_COURSE_TYPE);
  const [dept, setDept] = useState("");
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [flags, setFlags] = useState(defaultCourseFlags());
  const subjects = [...new Set(courses.map((c) => c.dept).filter(Boolean))].sort();
  const flag = (k: string, label: string) => <AxField label={label}><AxToggle label={label} on={flags[k] ?? false} onChange={(v) => setFlags({ ...flags, [k]: v })} /></AxField>;
  const add = () => {
    const taken = courses.map((c) => c.id);
    const def: CourseDef = { id: id.trim(), name: name.trim(), type, dept: dept.trim(), credits: isOtherClass(type) ? 0 : 1, description: "" };
    const error = validateCourse(def, taken);
    if (error) { toast.error(error); return; }
    const final = { ...def, id: def.id || makeCourseId(def.name, taken) };
    update((s) => ({ ...s, courses: [...s.courses, final], courseFlags: { ...s.courseFlags, [`course:${final.id}`]: flags } }));
    toast.success(`Course ${final.id} created`);
    nav({ to: "/admin/course/$courseNo", params: { courseNo: final.id }, replace: true });
  };
  return (
    <RecordWindow title="Course" action={<AxAction onClick={add}>Add Course</AxAction>}>
      <h2 className="px-5 py-3 text-[22px] font-light uppercase">General</h2>
      <AxBanner />
      <div className="grid grid-cols-1 gap-x-8 px-6 py-4 md:grid-cols-3 [&>div]:border-l [&>div]:border-vc-line [&>div]:pl-5">
        <div>
          <AxField label="Course Type" required><CourseTypeSelect value={type} onChange={setType} /></AxField>
          <AxField label="Subject" required><><input aria-label="Subject" list="course-subjects" className={axInput} value={dept} maxLength={40} placeholder="<None Specified>" onChange={(e) => setDept(e.target.value)} /><datalist id="course-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist></></AxField>
          <AxField label="Course ID"><input aria-label="Course ID" className={axInput} value={id} maxLength={20} placeholder="Made from the name if blank" onChange={(e) => setId(e.target.value)} /></AxField>
          <AxField label="Course Name" required><input aria-label="Course name" className={axInput} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></AxField>
        </div>
        <div>{flag("report", "Include on Report Card")}{flag("transcript", "Include on Transcript")}{flag("gpa", "Include in GPA")}{flag("archive", "Archive")}</div>
        <div>{flag("request", "Available for Request")}{flag("scheduler", "Include in Scheduler")}{flag("conferences", "Include in Parent/Teacher Conferences")}{flag("reviews", "Allow Reviews")}</div>
      </div>
      <div className="border-t border-vc-line">
        <table className="w-full border-collapse"><thead><tr>{["School Year", "Class ID", "Description", "Teacher", "# of Students", "Status"].map((h) => <th key={h} className={axTh}>{h}</th>)}</tr></thead></table>
        <AxEmpty />
        <AxFooter count={0} />
      </div>
    </RecordWindow>
  );
}
