import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { ALL_SECTIONS, teacherFull, teacherRoster } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/courses/")({
  head: () => pageHead("Axiom · Courses", "Course setup and class section listing."),
  component: Courses,
});

function Courses() {
  const [q, setQ] = useState("");
  const shown = ALL_SECTIONS.filter((c) => `${c.id} ${c.name} ${teacherFull(c.teacherId)}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <AxiomShell title="Courses & Enrollment">
      <div className="border border-vc-line bg-background">
        <div className="flex items-center gap-3 border-b border-vc-line bg-ax-head px-3 py-2">
          <input aria-label="Filter classes" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by class, ID or teacher" className="h-7 w-72 border border-vc-line bg-background px-2" />
          <span className="ml-auto text-muted-foreground">{shown.length} classes · School Year 2026-27</span>
        </div>
        <table className="w-full">
          <thead><tr className="border-b border-vc-line text-left text-[11px] uppercase text-muted-foreground"><th className="px-3 py-1.5">Class ID</th><th>Description</th><th>Teacher</th><th>Block</th><th>Room</th><th>Type</th><th className="pr-3 text-right">Enrolled</th></tr></thead>
          <tbody>{shown.map((c) => (
            <tr key={c.id} className="border-b border-vc-line hover:bg-vc-panel">
              <td className="px-3 py-1.5 font-mono text-[12px]">{c.id}</td>
              <td><Link to="/admin/courses/$courseId" params={{ courseId: c.id }} className="text-vc-link-strong hover:underline">{c.name}</Link> <span className="text-muted-foreground">· Section {c.section}</span></td>
              <td>{teacherFull(c.teacherId)}</td><td>{c.block}</td><td>{c.room}</td><td className="text-[11px]">{c.type}</td>
              <td className="pr-3 text-right">{teacherRoster(c.id).length}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </AxiomShell>
  );
}
