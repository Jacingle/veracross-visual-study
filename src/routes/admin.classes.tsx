import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { AxAdd, AxFooter, axTd, axTh } from "@/components/admin/AxiomDetail";
import { teacherFull } from "@/lib/sis-data";
import { useSchool, yearLabel } from "@/lib/school-store";
import { classStatus } from "@/lib/terms";
import { useRecordWindow } from "@/lib/record-window";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/classes")({
  head: () => pageHead("Axiom · Classes", "Every class, grouped by school year and course. Add a class in its own window."),
  component: Classes,
});

const STATUS = { current: "Current", future: "Future", past: "Past" } as const;

function Classes() {
  const { sections, courses } = useSchool();
  const openRecord = useRecordWindow();
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<string[]>([]);
  const rank = (no: string) => { const i = courses.findIndex((c) => c.id === no); return i < 0 ? 1e6 : i; };
  const rows = useMemo(() => sections
    .filter((c) => `${c.code} ${c.name} ${teacherFull(c.teacherIds[0] ?? "")}`.toLowerCase().includes(q.toLowerCase()))
    .map((c) => ({ c, year: c.terms[0]?.split("-")[0] ?? "" })), [sections, q]);
  const years = [...new Set(rows.map((r) => r.year))].sort().reverse();
  const toggle = (k: string) => setClosed((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const Caret = ({ k }: { k: string }) => (closed.includes(k) ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />);
  return (
    <AxiomShell title="Classes (Academic Hierarchy)" crumbs={[{ label: "Academic Configuration" }]}>
      <div className="border border-vc-line bg-background">
        <div className="flex flex-wrap items-center gap-3 border-b border-vc-line px-3 py-2">
          <AxAdd onClick={() => openRecord("/admin/class/new")}>Add Record...</AxAdd>
          <input aria-label="Search results" value={q} onChange={(e) => setQ(e.target.value)} placeholder="search results..." className="ml-auto h-8 w-60 border border-vc-line bg-background px-2 text-[13px] outline-none focus:border-vc-link" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead><tr><th className={axTh}>School Year</th><th className={axTh}>Subject</th><th className={axTh}>Class ID</th><th className={axTh}>Description</th><th className={axTh}>Teacher</th><th className={axTh}>Status</th><th className={`${axTh} text-right`}># of Students</th></tr></thead>
            <tbody>
              {years.map((y) => {
                const inYear = rows.filter((r) => r.year === y);
                const yk = `y:${y}`;
                const courseNos = [...new Set(inYear.map((r) => r.c.courseNo))].sort((a, b) => rank(a) - rank(b));
                return [
                  <tr key={yk} className="bg-vc-panel"><td colSpan={7} className="border-b border-vc-line px-2 py-2"><button type="button" onClick={() => toggle(yk)} aria-expanded={!closed.includes(yk)} className="flex items-center gap-2 text-[16px] font-semibold"><Caret k={yk} />{yearLabel(y)} <span className="text-[13px] font-normal text-vc-gray">({inYear.length} {inYear.length === 1 ? "record" : "records"})</span></button></td></tr>,
                  ...(closed.includes(yk) ? [] : courseNos.flatMap((no) => {
                    const list = inYear.filter((r) => r.c.courseNo === no);
                    const def = courses.find((c) => c.id === no);
                    const ck = `${yk}:${no}`;
                    return [
                      <tr key={ck} className="bg-[#f3f3f3]"><td colSpan={7} className="border-b border-vc-line py-1.5 pl-7 pr-2"><button type="button" onClick={() => toggle(ck)} aria-expanded={!closed.includes(ck)} className="flex items-center gap-2 text-[15px] font-semibold text-vc-link-strong"><Caret k={ck} />{def?.name ?? no} <span className="text-[13px] font-normal text-vc-gray">({list.length} {list.length === 1 ? "record" : "records"})</span></button></td></tr>,
                      ...(closed.includes(ck) ? [] : list.map(({ c }) => (
                        <tr key={c.id} className="bg-[#fafafa] hover:bg-vc-panel">
                          <td className={axTd}>{yearLabel(y)}</td><td className={axTd}>{def?.dept || "—"}</td>
                          <td className={axTd}><Link to="/admin/courses/$courseId" params={{ courseId: c.id }} className="text-vc-link-strong underline">{c.code}</Link></td>
                          <td className={axTd}>{c.name}</td>
                          <td className={axTd}>{c.teacherIds[0] ? teacherFull(c.teacherIds[0]) : <span className="text-vc-gray">None</span>}</td>
                          <td className={axTd}>{STATUS[classStatus(c.terms)]}</td>
                          <td className={`${axTd} text-right`}>{c.studentIds.length || ""}</td>
                        </tr>))),
                    ];
                  })),
                ];
              })}
            </tbody>
          </table>
          {!rows.length && <p className="py-16 text-center text-[20px] font-light text-vc-gray">No classes yet. Choose Add Record... to create one.</p>}
        </div>
        <AxFooter count={rows.length} />
      </div>
    </AxiomShell>
  );
}
