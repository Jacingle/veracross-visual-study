import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Clock, SquareCheck, Sprout } from "lucide-react";
import { useState } from "react";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { ClassRow } from "@/components/portal/ClassRow";
import { useMySections } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/classes")({
  head: () => pageHead("Classes & Reports", "Reports, attendance and current classes with grades."),
  component: Overview,
});

function Report({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="grid size-10 place-items-center border-2 border-muted-foreground/40 text-muted-foreground/70"><Icon className="size-5" strokeWidth={1.25} /></div>
      <div><div className="text-[13px] text-foreground/70">{label}</div><div className="mt-1.5 text-[14px] text-vc-link">{children}</div></div>
    </div>
  );
}

function Overview() {
  const [tab, setTab] = useState<"Active" | "Future" | "Past">("Active");
  const mine = useMySections().filter((c) => c.status === ({ Active: "current", Future: "future", Past: "past" } as const)[tab]);
  return (
    <PortalShell portal="student">
      <StudentTabs />
      <div className="px-6 pt-6">
        <h2 className="text-[24px] font-light text-foreground/80">Reports</h2>
        <div className="grid grid-cols-2 gap-y-8 px-3 py-6">
          <Report icon={BarChart3} label="PROGRESS REPORT"><Link to="/report-card" className="hover:underline">Grades & Comments</Link></Report>
          <Report icon={Clock} label="SCHEDULE"><Link to="/schedule-report" className="hover:underline">Current Class Schedule</Link></Report>
          <Report icon={Sprout} label="REPORT CARD"><Link to="/report-card" className="hover:underline">Term Report Card</Link></Report>
          <Report icon={SquareCheck} label="ATTENDANCE"><Link to="/attendance" className="hover:underline">Semester 1</Link><span className="mx-2.5 text-muted-foreground/60">•</span><span className="text-muted-foreground/60">Semester 2</span></Report>
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between border-b border-vc-line pl-6">
        <h2 className="pb-2 text-[24px] font-light text-foreground/80">Classes</h2>
        <div className="flex">{(["Active", "Future", "Past"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`w-[96px] py-3 text-[14px] ${tab === t ? "-mb-px border border-vc-line border-b-background text-vc-link-strong" : "text-foreground/75"}`}>{t}</button>
        ))}</div>
      </div>
      <div className="px-6 pb-8">
        {mine.length ? mine.map((c) => <ClassRow key={c.id} c={c} variant="overview" />)
          : <p className="py-12 text-center text-[14px] text-muted-foreground">No {tab.toLowerCase()} classes to display.</p>}
      </div>
    </PortalShell>
  );
}
