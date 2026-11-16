import { createFileRoute } from "@tanstack/react-router";
import { Printer, X } from "lucide-react";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { PortalShell } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { courseTitle, ME } from "@/lib/sis-data";
import { useMySections, useSchool } from "@/lib/school-store";
import { classAttendance, dailyAttendance } from "@/lib/attendance";
import { z } from "zod";
import { termById, termLabel } from "@/lib/terms";
import { today } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/attendance")({
  validateSearch: z.object({ term: z.string().optional() }),
  head: () => pageHead("Attendance Detail", "Daily and class attendance totals, as taken by your teachers."),
  component: Att,
});

const th = "border border-vc-line bg-vc-panel px-1.5 py-1 text-left font-normal";
function Att() {
  const { attendance, attDone, attNotes, user } = useSchool();
  const allClasses = useMySections();
  const { term: requestedTerm } = Route.useSearch();
  const termIds = [...new Set(allClasses.flatMap((c) => c.terms))].sort();
  const termId = requestedTerm || termIds.find((id) => { const t = termById(id); return t && +today() >= +t.start && +today() <= +t.end + 86399999; }) || termIds.at(-1) || "";
  const term = termById(termId);
  const mine = allClasses.filter((c) => c.terms.includes(termId));
  const sid = user?.personId || "me";
  const [open, setOpen] = useState<string | null>(null);
  const rows = mine.map((c) => ({ c, ...classAttendance(attendance, attDone, c.id, sid, term) }));
  const daily = dailyAttendance(rows);
  const sum = (k: "AU" | "AE" | "AT" | "TU" | "TE" | "TT") => rows.reduce((s, r) => s + r[k], 0);
  const sel = rows.find((r) => r.c.id === open);
  return (
    <PortalShell portal="student" bare>
      <div className="mx-auto max-w-[1000px] rounded-sm bg-background font-[Arial,sans-serif] text-[15px] shadow-xl">
        <div className="flex h-10 items-center justify-end rounded-t-sm bg-foreground px-6 print:hidden"><Button variant="ghost" onClick={() => window.print()} className="text-background hover:bg-transparent hover:text-background"><Printer className="size-4" />Print to <span className="text-destructive">PDF</span></Button></div>
        <div className="px-8 py-8">
          <div className="flex flex-wrap justify-between gap-6">
            <div><h1 className="text-[34px] font-bold">Attendance Detail</h1><div className="text-[24px]">{user?.first ?? ME.first} {user?.last ?? ME.last} <span className="text-[18px] text-muted-foreground">- Grade {user?.grade ?? ME.grade}</span></div><select aria-label="Attendance term" className="mt-1 max-w-full border border-vc-line bg-background text-[18px] print:border-0" value={termId} onChange={(e) => { window.location.assign(`/attendance?term=${encodeURIComponent(e.target.value)}`); }}>{termIds.map((id) => <option key={id} value={id}>{termLabel(id)}</option>)}</select></div>
            <table className="h-fit text-center"><thead><tr>{["Days Enrolled", "Days Attended", "% Attended", "Today's Status"].map((h) => <th key={h} className={`${th} text-center`}>{h}</th>)}</tr></thead>
              <tbody><tr className="text-[30px]"><td className="border border-vc-line px-3">{daily.days}</td><td className="border border-vc-line px-3">{daily.attended}</td><td className="border border-vc-line px-3">{daily.days ? `${(daily.attended / daily.days * 100).toFixed(2)}%` : "N/A"}</td><td className="border border-vc-line px-3">N/A</td></tr></tbody></table>
          </div>
          <h2 className="mt-6 w-1/2 rounded-t-md bg-foreground px-2 py-0.5 font-bold text-background">Daily</h2>
          <table className="w-full table-fixed"><thead><tr>{["Absent (U)", "Absent (E)", "Absent (Total)", "Tardy (U)", "Tardy (E)", "Tardy (Total)"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody><tr className="text-[26px] font-bold">{[daily.AU, daily.AE, daily.AT, daily.TU, daily.TE, daily.TT].map((v, i) => <td key={i} className={`border border-vc-line px-1.5 ${i === 2 ? "bg-destructive/10" : i === 5 ? "bg-vc-sky" : ""}`}>{i < 3 ? v.toFixed(1) : v}</td>)}</tr></tbody></table>
          <p className="mt-6">{user?.first ?? ME.first} has missed {sum("AT")} classes and been tardy {sum("TT")} times in {term?.label ?? "this term"}.</p>
          <h2 className="mt-5 w-1/2 rounded-t-md bg-foreground px-2 py-0.5 font-bold text-background">Classes</h2>
          <table className="w-full"><thead><tr><th className={th}>Course</th>{["AU", "AE", "AT", "TU", "TE", "TT"].map((h) => <th key={h} className={`${th} w-14 text-center ${h === "AU" ? "text-destructive" : h === "AE" ? "text-cat-quiz" : h === "TU" ? "text-vc-link" : h === "TE" ? "text-vc-link/60" : ""}`}>{h}</th>)}<th className={th}>{term?.label ?? "Days"}</th><th className={th}>Today</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.c.id} onClick={() => setOpen(r.c.id)} className={`cursor-pointer ${r.AT ? "bg-vc-tile-warm" : ""} hover:bg-vc-select`}><td className="border border-vc-line px-1.5 py-1.5">{courseTitle(r.c)}</td>{[r.AU, r.AE, r.AT, r.TU, r.TE, r.TT].map((v, i) => <td key={i} className={`border border-vc-line text-center ${i === 2 ? "bg-destructive/10" : i === 5 ? "bg-vc-sky" : ""}`}>{v}</td>)}<td className="border border-vc-line px-1.5"><span className="flex items-end gap-px">{r.records.map((x) => <span key={x.date} title={`${x.date}: ${x.status}`} className={`w-[3px] ${x.status === "Present" ? "h-[3px] bg-vc-success" : x.status.startsWith("Absent") ? "h-4 bg-destructive" : "h-4 bg-cat-quiz"}`} />)}{!r.records.length && <span className="text-[14px] text-muted-foreground">No attendance taken</span>}</span></td><td className="border border-vc-line px-1.5">{r.records.find((x) => x.date === format(today(), "yyyy-MM-dd"))?.status ?? "N/A"}</td></tr>)}
              {!rows.length && <tr><td colSpan={9} className="border border-vc-line p-4 text-center text-muted-foreground">No current classes.</td></tr>}
              <tr><td className="pr-2 text-right text-[15px]">Total:</td>{(["AU", "AE", "AT", "TU", "TE", "TT"] as const).map((k) => <td key={k} className="text-center">{sum(k)}</td>)}<td /><td /></tr></tbody></table>
          {sel && <div className="mt-6"><div className="flex w-1/2 items-center justify-between rounded-t-md bg-foreground px-2 py-0.5 text-background">{courseTitle(sel.c)}<Button variant="ghost" size="icon" aria-label="Close class detail" className="size-6 text-destructive" onClick={() => setOpen(null)}><X className="size-5" /></Button></div>
            <table className="w-full"><thead><tr><th className={th}>Date</th><th className={th}>Status</th><th className={th}>Notes</th></tr></thead><tbody>{sel.records.filter((x) => x.status !== "Present").map((x) => <tr key={x.date}><td className="border border-vc-line px-1.5">{format(parseISO(x.date), "MMM dd")}</td><td className="border border-vc-line px-1.5"><span className={x.status.startsWith("Absent") ? "block bg-destructive/30 px-1" : "block bg-vc-tile-warm px-1"}>{x.status}</span></td><td className="border border-vc-line px-1.5">{attNotes[`${sel.c.id}|${x.date}|${sid}`] ?? ""}</td></tr>)}
              {!sel.records.some((x) => x.status !== "Present") && <tr><td colSpan={3} className="border border-vc-line px-1.5 text-muted-foreground">No absences or tardies.</td></tr>}</tbody></table></div>}
        </div>
      </div>
    </PortalShell>
  );
}
