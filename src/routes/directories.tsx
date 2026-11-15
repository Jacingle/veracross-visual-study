import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PortalShell } from "@/components/portal/PortalShell";
import { StudentCard } from "@/components/portal/StudentCard";
import { EXTRA, STUDENTS, TEACHERS } from "@/lib/sis-data";
import { useSchool } from "@/lib/school-store";
import { BookUser, Home, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/head";

const PAGE = 10;
const S = z.object({ type: z.enum(["students", "households", "faculty"]).optional(), first: z.string().optional(), last: z.string().optional(), grade: z.coerce.number().optional(), city: z.string().optional(), page: z.coerce.number().optional() });
export const Route = createFileRoute("/directories")({
  validateSearch: S,
  head: () => pageHead("Directories", "Search the student, household and faculty/staff directories."),
  component: Dir,
});

const inp = "h-8 w-full border border-vc-line px-2 text-[13px] outline-none focus:border-vc-link";

function Dir() {
  const { users, photos } = useSchool();
  const sp = Route.useSearch();
  const { type = "students", first = "", last = "", grade, city = "", page = 1 } = sp;
  const nav = useNavigate({ from: "/directories" });
  const [f, setF] = useState({ first, last, grade: grade ? String(grade) : "", city });
  const has = (v: string, q: string) => v.toLowerCase().includes(q.toLowerCase());
  const students = [...STUDENTS, ...EXTRA.students].filter((s) => users.some((u) => u.personId === s.id && u.active) && has(s.first, first) && has(s.last, last) && (!grade || s.grade === grade) && has(s.address, city));
  const households = students.filter((s, i, arr) => arr.findIndex((x) => x.last === s.last && x.address === s.address) === i);
  const faculty = [...TEACHERS, ...EXTRA.teachers].filter((t) => users.some((u) => u.personId === t.id && u.active) && has(t.first, first) && has(t.last, last));
  const browsing = !first && !last && !grade && !city && !sp.page;
  const total = type === "faculty" ? faculty.length : type === "households" ? households.length : students.length;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const slice = <T,>(a: T[]) => a.slice((page - 1) * PAGE, page * PAGE);
  const search = (e: React.FormEvent) => { e.preventDefault(); nav({ search: { type, ...(f.first && { first: f.first }), ...(f.last && { last: f.last }), ...(f.grade && { grade: Number(f.grade) }), ...(f.city && { city: f.city }) } }); };
  return (
    <PortalShell>
      <div className="flex items-center justify-between border-b border-vc-line bg-vc-panel pl-7">
        <span className="py-3.5 text-[18px]"><span className="block text-[11px] uppercase text-muted-foreground">Directory Homepage</span>{type === "students" ? "Student Directories" : type === "households" ? "Household Directories" : "Faculty & Staff"}</span>
        <div className="flex self-stretch">{(["students", "households", "faculty"] as const).map((t) => (
          <Button variant="ghost" key={t} onClick={() => nav({ search: { type: t } })} className={`h-auto flex-col gap-1 rounded-none border-l border-vc-line px-5 py-3 text-[12px] ${type === t ? "bg-background text-vc-link" : "text-muted-foreground"}`}>{t === "students" ? <BookUser /> : t === "households" ? <Home /> : <Users />}{t === "students" ? "Students" : t === "households" ? "Households" : "Faculty & Staff"}</Button>
        ))}</div>
      </div>
      <form onSubmit={search} className="grid grid-cols-2 items-end gap-2 border-b border-vc-line bg-background px-7 py-5 text-[12px] text-muted-foreground sm:grid-cols-4">
        <label>FIRST NAME<input className={inp} value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })} maxLength={40} /></label>
        <label>LAST NAME<input className={inp} value={f.last} onChange={(e) => setF({ ...f, last: e.target.value })} maxLength={40} /></label>
        <label>GRADE<select className={inp} value={f.grade} disabled={type === "faculty"} onChange={(e) => setF({ ...f, grade: e.target.value })}><option value="">All</option>{[9, 10, 11, 12].map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>CITY<input className={inp} value={f.city} disabled={type === "faculty"} onChange={(e) => setF({ ...f, city: e.target.value })} maxLength={40} /></label>
        <div className="col-span-full flex gap-2"><Button className="h-8 flex-1 bg-vc-link-strong text-[13px]">Search</Button>
          <Button variant="outline" type="button" onClick={() => { setF({ first: "", last: "", grade: "", city: "" }); nav({ search: { type } }); }} className="h-8 text-[13px]">Clear</Button></div>
      </form>
      {browsing ? <div className="px-7 pb-12 pt-4"><h2 className="mb-3 text-center text-[22px] text-muted-foreground">General Directories</h2><Button variant="outline" onClick={() => nav({ search: { type, page: 1 } })} className="h-16 w-full justify-between border-l-4 border-l-vc-link px-6"><span className="text-vc-link-strong">All {type === "faculty" ? "Faculty & Staff" : type === "households" ? "Households" : "Students"}</span><span className="text-muted-foreground">{total} records</span></Button>{type === "students" && <><h2 className="mb-4 mt-8 text-center text-[22px] text-muted-foreground">Browse Categories</h2><div className="flex justify-center gap-2">{[9, 10, 11, 12].map((g) => <Button key={g} variant="secondary" onClick={() => nav({ search: { type, grade: g } })}>Grade {g}</Button>)}</div></>}</div> : <>
      <div className="px-4 pt-3 text-[12px] text-muted-foreground">{total} results</div>
      <div className="space-y-4 px-4 py-3">
        {type === "students" && slice(students).map((s) => <StudentCard key={s.id} s={s} />)}
        {type === "households" && slice(households).map((s) => (
          <div key={s.id} className="border border-vc-line px-5 py-3 shadow-sm">
            <div className="text-[17px] font-semibold text-foreground/85">The {s.last} Family</div>
            <div className="text-[13px] text-muted-foreground">{s.address} · {s.homePhone}</div>
            <div className="mt-2 grid grid-cols-3 gap-3 text-[13px]">{s.parents.map((p) => <div key={p.name}>{p.name}<div className="text-vc-link-strong">{p.email}</div></div>)}<div>Student: {s.first} {s.last} <span className="ml-1 bg-vc-badge px-1 text-[10px] text-primary-foreground">GRADE {s.grade}</span></div></div>
          </div>))}
        {type === "faculty" && slice(faculty).map((t) => (
          <div key={t.id} className="flex items-center gap-5 border border-vc-line px-5 py-4 shadow-sm">
            {photos[t.id] ? <img src={photos[t.id]} alt="" className="h-16 w-12 object-cover" /> : <div className="grid size-[64px] place-items-center bg-vc-tile text-xl text-vc-link-strong">{t.first[0]}{t.last[0]}</div>}
            <div className="flex-1"><div className="text-[19px]">{t.prefix} {t.first} {t.last}</div><div className="text-[13px] text-muted-foreground">{t.title} · {t.dept}</div></div>
            <div className="text-[14px]"><span className="mr-3 text-[11px] font-semibold tracking-wider text-muted-foreground">EMAIL</span><a href={`mailto:${t.email}`} className="text-vc-link-strong">{t.email}</a></div>
          </div>))}
        {total === 0 && <p className="py-8 text-center text-[13px] text-muted-foreground">No matches.</p>}
      </div>
      {pages > 1 && <div className="flex justify-center gap-1 pb-6">{Array.from({ length: pages }, (_, i) => (
        <button key={i} onClick={() => nav({ search: (p) => ({ ...p, page: i + 1 }) })} className={`size-7 border border-vc-line text-[12px] ${page === i + 1 ? "bg-vc-link-strong text-primary-foreground" : ""}`}>{i + 1}</button>))}</div>}
      </>}
    </PortalShell>
  );
}
