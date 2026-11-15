import { createFileRoute, Link } from "@tanstack/react-router";
import { format, isSameWeek, startOfWeek } from "date-fns";
import { useMemo, useState } from "react";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { CATEGORY_CHIP, courseTitle, teacherFull, today, type Assignment } from "@/lib/sis-data";
import { categoryStats, defaultWeights, letterFor, weightedAverage } from "@/lib/grading";
import { usePortal } from "@/lib/portal-store";
import { useMySections, useSchool, useStudentAssignments } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/grades/$classId")({
  validateSearch: (s: Record<string, unknown>): { tab?: "detail" } => (s["tab"] === "detail" ? { tab: "detail" } : {}),
  head: ({ params }) => pageHead(`Class ${params.classId} · Grades`, "Grade detail and all assignments for this class."),
  component: Grades,
});

const pct = (a: Assignment) => (a.score !== undefined ? (a.score / a.points) * 100 : null);

function Grades() {
  const { classId } = Route.useParams();
  const { tab } = Route.useSearch();
  const all = useStudentAssignments();
  const c = useMySections().find((x) => x.id === classId);
  const list = useMemo(() => all.filter((a) => a.courseId === classId).sort((a, b) => +b.due - +a.due), [all, classId]);
  if (!c) return <PortalShell portal="student"><StudentTabs /><p className="p-8 text-[14px]">You're not enrolled in this class. <Link to="/classes" className="text-vc-link-strong">See your classes</Link></p></PortalShell>;
  return (
    <PortalShell portal="student">
      <StudentTabs />
      <div className="px-6 py-5">
        <div className="flex items-end justify-between border-b border-vc-line pb-3">
          <div><h2 className="text-[24px] font-light">{courseTitle(c)}</h2><div className="text-[13px] text-muted-foreground">{teacherFull(c.teacherId)} · {c.block} · {c.room}</div></div>
          <div className="flex text-[13px]">
            <Link to="/grades/$classId" params={{ classId: c.id }} className={`border border-vc-line px-3 py-1.5 ${!tab ? "bg-vc-link text-primary-foreground" : ""}`}>All Assignments</Link>
            <Link to="/grades/$classId" params={{ classId: c.id }} search={{ tab: "detail" }} className={`border border-l-0 border-vc-line px-3 py-1.5 ${tab ? "bg-vc-link text-primary-foreground" : ""}`}>Grade Detail</Link>
          </div>
        </div>
        {tab === "detail" ? <Detail list={list} courseId={c.id} /> : <AllAssignments list={list} />}
      </div>
    </PortalShell>
  );
}

function AllAssignments({ list }: { list: Assignment[] }) {
  const { done } = usePortal();
  const [filter, setFilter] = useState<"all" | "upcoming" | "graded">("all");
  const shown = list.filter((a) => filter === "all" || (filter === "upcoming" ? a.due >= today() : a.score !== undefined));
  const weeks: { start: Date; items: Assignment[] }[] = [];
  for (const a of shown) { const w = weeks.find((x) => isSameWeek(x.start, a.due)); if (w) w.items.push(a); else weeks.push({ start: startOfWeek(a.due), items: [a] }); }
  return (
    <>
      <div className="mt-3 flex gap-1 text-[13px]">{(["all", "upcoming", "graded"] as const).map((f) => (
        <button key={f} onClick={() => setFilter(f)} className={`border px-2.5 py-1 capitalize ${filter === f ? "border-vc-link bg-vc-sky text-vc-link-strong" : "border-vc-line"}`}>{f}</button>))}</div>
      {weeks.map((w) => (
        <div key={+w.start} className="mt-4">
          <div className="border-b border-foreground/60 pb-1 text-[13px] font-semibold text-foreground/70">Week of {format(w.start, "MMM d")}</div>
          {w.items.map((a) => {
            const p = pct(a);
            return (
              <div key={a.id} className="grid grid-cols-[150px_minmax(0,1fr)_110px_110px_90px] items-center border-b border-vc-line py-2 text-[13px]">
                <span><span className={`inline-block px-1.5 py-px text-[10px] font-semibold text-primary-foreground ${CATEGORY_CHIP[a.category]}`}>{a.category}</span></span>
                <span className="truncate text-[14px] text-vc-link-strong">{a.title}</span>
                <span className="text-muted-foreground">Due {format(a.due, "M/d")}</span>
                <span className={a.score !== undefined ? "text-vc-success" : a.due < today() && !done.includes(a.id) ? "text-destructive" : "text-muted-foreground"}>
                  {a.score !== undefined ? "Graded" : done.includes(a.id) ? "Completed" : a.due < today() ? "Missing" : "Not Due Yet"}</span>
                <span className="text-right font-semibold">{p !== null ? `${a.score}/${a.points}` : "—"}</span>
              </div>
            );
          })}
        </div>
      ))}
      {weeks.length === 0 && <p className="py-10 text-center text-[13px] text-muted-foreground">No assignments.</p>}
      <Link to="/classes" className="mt-5 inline-block text-[13px] text-vc-link-strong hover:underline">← Back to Classes & Reports</Link>
    </>
  );
}

function Detail({ list, courseId }: { list: Assignment[]; courseId: string }) {
  const { weights } = useSchool();
  const w = weights[courseId] ?? defaultWeights(list.map((a) => a.category));
  const avg = weightedAverage(list, w);
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between bg-vc-panel px-4 py-3">
        <div className="text-[18px]">Semester 1</div>
        <div className="text-right"><div className="text-[11px] text-muted-foreground">GRADE AVERAGE</div>
          <div className="text-[24px] font-light">{avg !== null ? <>{letterFor(avg)} <span className="ml-2">{avg.toFixed(2)}%</span></> : "—"}</div></div>
      </div>
      <table className="mt-4 w-full text-[13px]">
        <thead><tr className="border-b-2 border-foreground/70 text-left text-[11px] uppercase tracking-wide text-muted-foreground"><th className="py-1.5">Category</th><th className="text-right">Weight</th><th className="text-right">Assignments</th><th className="text-right">Points</th><th className="text-right">Average</th></tr></thead>
        <tbody>{w.map((x) => { const st = categoryStats(list.filter((a) => a.category === x.cat), x.drop); return (
          <tr key={x.cat} className="border-b border-vc-line"><td className="py-2">{x.cat}{x.drop && <span className="ml-1 text-muted-foreground">(drop lowest)</span>}</td><td className="text-right">{x.weight}%</td><td className="text-right">{st.count}</td><td className="text-right">{st.earned} / {st.possible}</td><td className="text-right font-semibold">{st.pct !== null ? `${st.pct.toFixed(2)}%` : "—"}</td></tr>); })}</tbody>
      </table>
      <table className="mt-6 w-full text-[13px]">
        <thead><tr className="border-b-2 border-foreground/70 text-left text-[11px] uppercase tracking-wide text-muted-foreground"><th className="py-1.5">Due</th><th>Assignment</th><th>Type</th><th className="text-right">Score</th><th className="text-right">%</th></tr></thead>
        <tbody>{list.map((a) => { const p = pct(a); return (
          <tr key={a.id} className="border-b border-vc-line"><td className="py-2">{format(a.due, "EEE, MMM d")}</td><td>{a.title}</td><td className="text-[11px]">{a.category}</td>
            <td className="text-right">{a.score !== undefined ? `${a.score} / ${a.points}` : <span className="text-muted-foreground">—</span>}</td>
            <td className="text-right font-semibold">{p !== null ? `${p.toFixed(1)}%` : ""}</td></tr>); })}</tbody>
      </table>
    </div>
  );
}
