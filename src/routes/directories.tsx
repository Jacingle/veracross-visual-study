import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { PortalShell } from "@/components/portal/PortalShell";
import { StudentCard } from "@/components/portal/StudentCard";
import { STUDENTS, TEACHERS } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

const PAGE = 10;
export const Route = createFileRoute("/directories")({
  validateSearch: z.object({ type: z.enum(["students", "faculty"]).optional(), q: z.string().optional(), grade: z.coerce.number().optional(), page: z.coerce.number().optional() }),
  head: () => pageHead("Directories", "Search the student and faculty/staff directories."),
  component: Dir,
});

function Dir() {
  const { type = "students", q = "", grade, page = 1 } = Route.useSearch();
  const nav = useNavigate({ from: "/directories" });
  const ql = q.toLowerCase();
  const students = STUDENTS.filter((s) => (!grade || s.grade === grade) && `${s.first} ${s.last}`.toLowerCase().includes(ql));
  const faculty = TEACHERS.filter((t) => `${t.first} ${t.last} ${t.dept}`.toLowerCase().includes(ql));
  const total = type === "students" ? students.length : faculty.length;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <PortalShell>
      <div className="flex border-b border-vc-line">
        {(["students", "faculty"] as const).map((t) => (
          <button key={t} onClick={() => nav({ search: { type: t } })} className={`px-8 py-4 text-[17px] ${type === t ? "border-b-2 border-vc-link text-vc-link-strong" : "text-foreground/70"}`}>{t === "students" ? "Student Directory" : "Faculty/Staff Directory"}</button>
        ))}
      </div>
      <div className="flex gap-3 px-8 pt-6">
        <input value={q} onChange={(e) => nav({ search: (p) => ({ ...p, q: e.target.value || undefined, page: undefined }), replace: true })} placeholder="Search by name…" className="w-80 border border-vc-line px-3 py-2" maxLength={80} />
        {type === "students" && <select value={grade ?? ""} onChange={(e) => nav({ search: (p) => ({ ...p, grade: e.target.value ? Number(e.target.value) : undefined, page: undefined }) })} className="border border-vc-line px-3">
          <option value="">All grades</option>{[9, 10, 11, 12].map((g) => <option key={g} value={g}>Grade {g}</option>)}</select>}
        <span className="ml-auto self-center text-sm text-muted-foreground">{total} results</span>
      </div>
      <div className="space-y-6 px-8 py-6">
        {type === "students" ? students.slice((page - 1) * PAGE, page * PAGE).map((s) => <StudentCard key={s.id} s={s} />)
          : faculty.slice((page - 1) * PAGE, page * PAGE).map((t) => (
            <div key={t.id} className="flex items-center gap-6 border border-vc-line p-6 shadow-sm">
              <div className="grid size-20 place-items-center bg-vc-tile text-2xl text-vc-link-strong">{t.first[0]}{t.last[0]}</div>
              <div className="flex-1"><div className="text-[24px]">{t.prefix} {t.first} {t.last}</div><div className="text-muted-foreground">{t.title} · {t.dept}</div></div>
              <div><span className="mr-4 text-xs font-semibold tracking-wider text-muted-foreground">EMAIL</span><a href={`mailto:${t.email}`} className="text-vc-link-strong">{t.email}</a></div>
            </div>))}
        {total === 0 && <p className="py-10 text-center text-muted-foreground">No matches.</p>}
      </div>
      {pages > 1 && <div className="flex justify-center gap-1 pb-8">{Array.from({ length: pages }, (_, i) => (
        <button key={i} onClick={() => nav({ search: (p) => ({ ...p, page: i + 1 }) })} className={`size-9 border border-vc-line ${page === i + 1 ? "bg-vc-link-strong text-primary-foreground" : ""}`}>{i + 1}</button>))}</div>}
    </PortalShell>
  );
}
