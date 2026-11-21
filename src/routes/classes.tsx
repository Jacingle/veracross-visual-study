import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Check, Clock } from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { toast } from "sonner";
import { PortalShell, StudentTabs } from "@/components/portal/PortalShell";
import { ClassRow } from "@/components/portal/ClassRow";
import { SproutLine } from "@/components/portal/icons";
import { teacher, today } from "@/lib/sis-data";
import { splitClasses } from "@/lib/course-types";
import { useMySections } from "@/lib/school-store";
import { Button } from "@/components/ui/button";
import { termById } from "@/lib/terms";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/classes")({
  head: () => pageHead("Classes & Reports", "Reports, attendance and current classes with grades."),
  component: Overview,
});

type Glyph = ComponentType<{ className?: string; strokeWidth?: number }>;

/** One report entry: a tall outlined icon box (or a bare icon), a small caps label and the report links. */
function Report({ icon: Icon, label, boxed = true, children }: { icon: Glyph; label: string; boxed?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3.5">
      {boxed
        ? <div className="grid h-10 w-[33px] shrink-0 place-items-center border-2 border-vc-gray-light/70 text-vc-gray-light"><Icon className="size-6" strokeWidth={1.5} /></div>
        : <Icon className="-ml-1 h-10 w-[38px] shrink-0 text-vc-gray-light" />}
      <div>
        <div className="text-[14px] font-light uppercase leading-[21px] text-vc-gray">{label}</div>
        <div className="mt-[5px] text-[16px] leading-6 text-vc-link">{children}</div>
      </div>
    </div>
  );
}

const reportLink = "hover:underline";

function Overview() {
  const [tab, setTab] = useState<"Active" | "Future" | "Past">("Active");
  const allClasses = useMySections();
  // Attendance reports are only offered for the two semesters (for now).
  // One Semester 1 and one Semester 2 report, for the current school year only (no repeats).
  const sem = [...new Set(allClasses.flatMap((c) => c.terms))].filter((id) => /-S[12]$/.test(id));
  const nowTerm = sem.map(termById).find((t) => t && +t.start <= +today() && +today() <= +t.end);
  const year = nowTerm?.yearId ?? sem.map(termById).flatMap((t) => (t ? [t.yearId] : [])).sort().pop();
  const terms = sem.filter((id) => termById(id)?.yearId === year).sort();
  const mine = allClasses.filter((c) => c.status === ({ Active: "current", Future: "future", Past: "past" } as const)[tab]);
  const grouped = splitClasses(mine, (id) => teacher(id).last);
  const started = (id: string) => { const t = termById(id); return !t || +t.start <= +today(); };
  return (
    <PortalShell portal="student">
      <StudentTabs />
      <div className="px-5 pt-5">
        <h2 className="text-[24px] font-light leading-9 text-foreground/90">Reports</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-[30px] px-[12.5px] pb-16 pt-6 sm:grid-cols-2">
          <Report icon={BarChart3} label="Progress Report"><Link to="/report-card" target="_blank" rel="noopener noreferrer" className={reportLink}>Mid-Semester 1</Link></Report>
          <Report icon={Clock} label="Schedule"><Link to="/schedule-report" className={reportLink}>Current Class Schedule</Link></Report>
          <Report icon={SproutLine} label="NWEA MAP Growth" boxed={false}>
            <button type="button" className={reportLink} onClick={() => toast.info("NWEA MAP Growth reports are not available in this demo.")}>NWEA MAP Growth Fall 2026</button>
          </Report>
          <Report icon={Check} label="Attendance">
            {terms.map((id, i) => (
              <span key={id}>
                {i > 0 && <span className="mx-[13px] text-[9px] text-vc-gray-light">•</span>}
                {started(id)
                  ? <Link to="/attendance" search={{ term: id }} target="_blank" rel="noopener noreferrer" className={reportLink}>{termById(id)?.label ?? id}</Link>
                  : <span className="text-vc-gray-light">{termById(id)?.label ?? id}</span>}
              </span>
            ))}
            {!terms.length && <span className="text-vc-gray-light">-</span>}
          </Report>
        </div>
      </div>
      <div className="flex items-end">
        <h2 className="h-[39px] flex-1 border-b border-vc-line pb-[3px] pl-5 text-[24px] font-light leading-9 text-foreground/90">Classes</h2>
        {(["Active", "Future", "Past"] as const).map((t) => (
          <Button variant="ghost" key={t} onClick={() => setTab(t)} aria-pressed={tab === t} className={`h-[39px] w-[89px] rounded-none p-0 text-[14px] font-normal ${tab === t ? "rounded-t-[3px] border-x border-t border-vc-line bg-background text-vc-navbar hover:bg-background hover:text-vc-navbar" : "border-b border-vc-line text-vc-gray hover:bg-transparent hover:text-vc-gray"}`}>{t}</Button>
        ))}
        <div aria-hidden className="h-[39px] w-[22px] border-b border-vc-line" />
      </div>
      <div className="px-6 pb-8 pt-[21px]">
        {mine.length ? <>
          {grouped.academic.map((c) => <ClassRow key={c.id} c={c} variant="overview" />)}
          {grouped.other.length > 0 && <h3 className="mt-6 border-b border-vc-line pb-1 text-[18px] font-light text-foreground/90">Other Classes</h3>}
          {grouped.other.map((c) => <ClassRow key={c.id} c={c} variant="overview" />)}
        </>
          :<p className="py-12 text-center text-[14px] text-muted-foreground">No {tab.toLowerCase()} classes to display.</p>}
      </div>
    </PortalShell>
  );
}
