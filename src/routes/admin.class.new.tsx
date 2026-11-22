import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AdvancedSearch, type SearchRow } from "@/components/admin/AdvancedSearch";
import { AxAction, AxBanner, AxEmpty, AxField, AxFooter, axInput, axTh } from "@/components/admin/AxiomDetail";
import { PersonField } from "@/components/admin/PersonField";
import { RecordWindow } from "@/components/admin/RecordWindow";
import { enrollmentPeople, validateClassRecord } from "@/lib/class-records";
import { makeSectionId } from "@/lib/course-records";
import { BLANK_SITE, useSchool, type Section } from "@/lib/school-store";
import { classStatus, schoolYears } from "@/lib/terms";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/class/new")({
  validateSearch: z.object({ course: z.string().optional() }),
  head: () => pageHead("Axiom · New Class", "Create a class: course, teacher, aides, room and terms."),
  component: NewClass,
});

const STATUS = { current: "Current", future: "Future", past: "Past" } as const;
type Pick = "course" | "teacher" | "aide" | null;

function NewClass() {
  const { courses, sections, users, courseFlags, update } = useSchool();
  const { course: courseParam } = Route.useSearch();
  const nav = useNavigate();
  const years = schoolYears();
  const [year, setYear] = useState(years[1]?.id ?? years[0]?.id ?? "");
  const [mode, setMode] = useState<"FY" | "S1" | "S2">("FY");
  const [courseNo, setCourseNo] = useState(courseParam && courses.some((c) => c.id === courseParam) ? courseParam : "");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [aideIds, setAideIds] = useState<string[]>([]);
  const [room, setRoom] = useState("");
  const [picking, setPicking] = useState<Pick>(null);
  const faculty = useMemo(() => enrollmentPeople(users, "teacher"), [users]);
  const facultyRows: SearchRow[] = faculty.map((u) => ({ id: u.personId, first: u.first, last: u.last, cells: [`${u.last}, ${u.preferred || u.first}`, "Faculty", u.email] }));
  const courseRows: SearchRow[] = courses.map((c) => ({ id: c.id, cells: [c.name, c.id, c.dept || "—"] }));
  const nameOf = (id: string) => { const u = users.find((x) => x.personId === id); return u ? `${u.last}, ${u.preferred || u.first}` : id; };
  const openPerson = (id: string) => { const u = users.find((x) => x.personId === id); if (u) nav({ to: "/admin/users", search: { q: u.email } }); };
  const course = courses.find((c) => c.id === courseNo);
  const terms = mode === "FY" ? [`${year}-S1`, `${year}-S2`] : [`${year}-${mode}`];
  const pickCourse = (ids: string[]) => { const id = ids[0] ?? ""; setCourseNo(id); const c = courses.find((x) => x.id === id); if (c && !description.trim()) setDescription(c.name); };
  const add = () => {
    if (!course) { toast.error("Choose a course."); return; }
    if (!code.trim()) { toast.error("Class ID is required."); return; }
    if (!description.trim()) { toast.error("Description is required."); return; }
    let n = sections.filter((s) => s.courseNo === course.id).length + 1;
    while (sections.some((s) => s.courseNo === course.id && s.section === String(n))) n += 1;
    const error = validateClassRecord({ name: description.trim(), section: String(n), terms, teacherIds, aideIds, studentIds: [], published: false }, users);
    if (error) { toast.error(error); return; }
    const id = makeSectionId(code, sections.map((s) => s.id));
    const section: Section = {
      id, code: code.trim(), name: description.trim(), section: String(n), teacherId: teacherIds[0] ?? "", block: "", room: room.trim(), letter: "", pct: 0, type: course.type, days: [], time: "",
      courseNo: course.id, teacherIds, aideIds, terms, published: false, studentIds: [], website: { ...BLANK_SITE },
    };
    update((s) => ({ ...s, sections: [...s.sections, section], courseFlags: { ...s.courseFlags, [id]: { ...courseFlags[`course:${course.id}`] } } }));
    toast.success(`Class ${section.code} created`);
    nav({ to: "/admin/courses/$courseId", params: { courseId: id }, replace: true });
  };
  const addPerson = () => window.open("/admin/users?add=user", "_blank", "popup=yes,width=1100,height=760");
  return (
    <RecordWindow title="Class" action={<AxAction onClick={add}>Add Class</AxAction>}>
      <h2 className="px-5 py-3 text-[22px] font-light uppercase">General</h2>
      <AxBanner />
      <div className="grid grid-cols-1 gap-x-8 px-6 py-4 md:grid-cols-2 [&>div]:border-l [&>div]:border-vc-line [&>div]:pl-5">
        <div>
          <AxField label="Course" required><PersonField label="Course" ids={courseNo ? [courseNo] : []} onChange={(ids) => setCourseNo(ids[0] ?? "")} nameOf={(id) => courses.find((c) => c.id === id)?.name ?? id} onSearch={() => setPicking("course")} /></AxField>
          <AxField label="Class ID" required><input aria-label="Class ID" className={axInput} value={code} maxLength={30} onChange={(e) => setCode(e.target.value)} /></AxField>
          <AxField label="Description" required><input aria-label="Description" className={axInput} value={description} maxLength={80} onChange={(e) => setDescription(e.target.value)} /></AxField>
          <AxField label="Teacher"><PersonField label="Teacher" ids={teacherIds} onChange={setTeacherIds} nameOf={nameOf} onSearch={() => setPicking("teacher")} onOpen={openPerson} /></AxField>
          <AxField label="Teacher's Aide"><PersonField label="Teacher's Aide" multi ids={aideIds} onChange={setAideIds} nameOf={nameOf} onSearch={() => setPicking("aide")} onOpen={openPerson} /></AxField>
          <p className="pl-[127px] text-[12px] text-vc-gray">One teacher. Add as many aides as you need. Click a name, then press Delete to remove it.</p>
        </div>
        <div>
          <AxField label="School Year" required><select aria-label="School year" className={axInput} value={year} onChange={(e) => setYear(e.target.value)}>{years.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}</select></AxField>
          <AxField label="Terms"><select aria-label="Terms" className={axInput} value={mode} onChange={(e) => setMode(e.target.value as "FY" | "S1" | "S2")}><option value="FY">Full Year (S1 + S2)</option><option value="S1">Semester 1 only</option><option value="S2">Semester 2 only</option></select></AxField>
          <AxField label="Room"><input aria-label="Room" className={axInput} value={room} maxLength={12} placeholder="<None Specified>" onChange={(e) => setRoom(e.target.value)} /></AxField>
          <AxField label="Status" required><div className={`${axInput} flex items-center bg-vc-panel`}>{STATUS[classStatus(terms)]}</div></AxField>
        </div>
      </div>
      <div className="border-t border-vc-line">
        <table className="w-full border-collapse"><thead><tr>{["Student", "Grade Level", "Roles", "Date Withdrawn"].map((h) => <th key={h} className={axTh}>{h}</th>)}</tr></thead></table>
        <AxEmpty />
        <AxFooter count={0} />
      </div>
      <AdvancedSearch open={picking === "course"} onClose={() => setPicking(null)} noun="Course" kind="course" heads={["Course", "Course ID", "Subject"]} rows={courseRows} onSelect={pickCourse} />
      <AdvancedSearch open={picking === "teacher"} onClose={() => setPicking(null)} noun="Person" kind="person" heads={["Full Name", "Roles", "Email"]} rows={facultyRows} exclude={aideIds} onSelect={(ids) => setTeacherIds(ids.slice(0, 1))} onAddNew={addPerson} />
      <AdvancedSearch open={picking === "aide"} onClose={() => setPicking(null)} noun="Person" kind="person" multi heads={["Full Name", "Roles", "Email"]} rows={facultyRows} exclude={[...aideIds, ...teacherIds]} onSelect={(ids) => setAideIds([...new Set([...aideIds, ...ids])])} onAddNew={addPerson} />
    </RecordWindow>
  );
}
