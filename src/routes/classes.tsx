import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Clock, SquareCheck, Sprout } from "lucide-react";
import { useState } from "react";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { ClassRow } from "@/components/portal/ClassRow";
import { COURSES } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/classes")({
  head: () => pageHead("Classes & Reports", "Reports, attendance and current classes with grades."),
  component: Overview,
});

function Report({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-5">
      <div className="grid size-12 place-items-center border-2 border-muted-foreground/40 text-muted-foreground/70"><Icon className="size-6" strokeWidth={1.25} /></div>
      <div><div className="text-[16px] text-foreground/70">{label}</div><div className="mt-2 text-[17px] text-vc-link">{children}</div></div>
    </div>
  );
}

function Overview() {
  const [tab, setTab] = useState<"Active" | "Future" | "Past">("Active");
  return (
    <PortalShell>
      <StudentTabs />
      <div className="px-7 pt-8">
        <h2 className="text-[30px] font-light text-foreground/80">Reports</h2>
        <div className="grid grid-cols-2 gap-y-10 px-4 py-8">
          <Report icon={BarChart3} label="PROGRESS REPORT"><Link to="/report-card" className="hover:underline">Mid-Semester 1</Link></Report>
          <Report icon={Clock} label="SCHEDULE"><Link to="/schedule" className="hover:underline">Current Class Schedule</Link></Report>
          <Report icon={Sprout} label="NWEA MAP GROWTH"><Link to="/report-card" className="hover:underline">NWEA MAP Growth Fall 2026</Link></Report>
          <Report icon={SquareCheck} label="ATTENDANCE"><Link to="/attendance" className="hover:underline">Semester 1</Link><span className="mx-3 text-muted-foreground/60">•</span><span className="text-muted-foreground/60">Semester 2</span></Report>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between border-b border-vc-line pl-7">
        <h2 className="pb-2 text-[30px] font-light text-foreground/80">Classes</h2>
        <div className="flex">{(["Active", "Future", "Past"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`w-[118px] py-4 text-[17px] ${tab === t ? "-mb-px border border-b-background border-vc-line text-vc-link-strong" : "text-foreground/75"}`}>{t}</button>
        ))}</div>
      </div>
      <div className="px-8 pb-10">
        {tab === "Active" ? COURSES.map((c) => <ClassRow key={c.id} c={c} variant="overview" />)
          : <p className="py-16 text-center text-muted-foreground">No {tab.toLowerCase()} classes to display.</p>}
      </div>
    </PortalShell>
  );
}
