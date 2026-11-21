import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { Detail } from "@/components/portal/GradeDetail";
import { scoreOf } from "@/lib/gradebook";
import { rosterOf, useMySections, useSchool, useSectionAssignments } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/teacher/grade-detail/$classId/$studentId")({
  head: ({ params }) => pageHead(`Grade Detail · ${params.classId}`, "A student's grade detail for one class, as the student sees it."),
  component: TeacherGradeDetail,
});

/** Opened in a new tab from the gradebook: the same Grade Detail paper the student sees. */
function TeacherGradeDetail() {
  const { classId, studentId } = Route.useParams();
  const mine = useMySections();
  const c = mine.find((x) => x.id === classId);
  const { scores } = useSchool();
  const all = useSectionAssignments(classId);
  const student = c ? rosterOf(c).find((s) => s.id === studentId) : undefined;
  const list = useMemo(() => all.map((a) => ({ ...a, score: scoreOf(scores, a, studentId) })), [all, scores, studentId]);
  if (!c || !student) return <PortalShell portal="teacher" area="teacher"><p className="p-8 text-[14px]">That class or student isn't available. <Link to="/teacher" className="text-vc-link-strong">Back to faculty home</Link></p></PortalShell>;
  return <PortalShell portal="teacher" area="teacher"><Detail list={list} c={c} student={{ personId: student.id, first: student.first, last: student.last, grade: student.grade }} /></PortalShell>;
}
