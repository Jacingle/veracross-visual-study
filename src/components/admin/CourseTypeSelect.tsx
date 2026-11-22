import { axInput } from "@/components/admin/AxiomDetail";
import { MAIN_TYPES, OTHER_TYPES, TYPE_LABEL, normalizeCourseType, type CourseType } from "@/lib/course-types";

/** Course type dropdown. Advisory, Group and Homeroom are listed under "Other Classes". */
export function CourseTypeSelect({ value, onChange, label = "Course type" }: { value: CourseType; onChange: (t: CourseType) => void; label?: string }) {
  return (
    <select aria-label={label} className={axInput} value={value} onChange={(e) => onChange(normalizeCourseType(e.target.value))}>
      <optgroup label="Classes">{MAIN_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</optgroup>
      <optgroup label="Other Classes">{OTHER_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</optgroup>
    </select>
  );
}
