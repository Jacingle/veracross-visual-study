import { createFileRoute } from "@tanstack/react-router";
import { addDays, startOfWeek } from "date-fns";
import { Printer } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { courseTitle, ME, today } from "@/lib/sis-data";
import { useMySections, useSchool } from "@/lib/school-store";
import { meetingsOn } from "@/lib/scheduling";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/schedule-report")({
  head: () => pageHead("Class Schedule Report", "Printable weekly class schedule with blocks, times and rooms."),
  component: ScheduleReport,
});
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
function ScheduleReport() {
  const { schedulingSets, user } = useSchool();
  const mine = useMySections().filter((c) => c.status === "current");
  const mon = startOfWeek(today(), { weekStartsOn: 1 });
  const cols = DAYS.map((_, i) => mine.flatMap((c) => meetingsOn(c, schedulingSets, addDays(mon, i)).map((m) => ({ c, block: m.name || c.block, start: m.start, end: m.end || "" }))).sort((a, b) => a.start.localeCompare(b.start)));
  return (
    <PortalShell portal="student" bare>
      <div className="mx-auto max-w-[1500px] rounded-sm bg-background font-[Arial,sans-serif] shadow-xl">
        <div className="flex h-12 items-center justify-end rounded-t-sm bg-foreground px-6 print:hidden"><Button variant="ghost" onClick={() => window.print()} className="text-[18px] text-background hover:bg-transparent hover:text-background"><Printer className="size-5" />Print to <span className="text-destructive">PDF</span></Button></div>
        <div className="px-7 pb-7 pt-10">
          <h1 className="text-center text-[28px] font-bold">{user?.first ?? ME.first} {user?.last ?? ME.last} — Current Term</h1>
          <p className="ml-11 mt-4 text-[13px]">Grade {ME.grade}</p>
          <div className="mt-3 grid grid-cols-5 border border-vc-line">
            {DAYS.map((d) => <div key={d} className="bg-foreground py-0.5 text-center text-[19px] text-background">{d}</div>)}
            {cols.map((items, i) => <div key={i} className="min-h-[120px] border-r border-vc-line last:border-r-0">{items.map((m, j) => <div key={j} className={`border-b border-vc-line px-1 py-1 text-[17px] leading-tight ${j % 2 ? "bg-vc-panel" : ""}`}><div>{m.block} {m.start}{m.end && `–${m.end}`}</div><div className="font-bold">{courseTitle(m.c)}</div><div>{m.c.room}</div></div>)}
              {!items.length && <p className="p-2 text-[14px] text-muted-foreground">No classes</p>}</div>)}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
