import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { AxField, AxGroup, AxScreenTitle, AxToggle, axInput, axSelect } from "@/components/admin/ax";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { DEFAULT_DOC_LAYOUT, PAGE_SIZES, isHex, type DocLayout } from "@/lib/axiom";
import { pageHead } from "@/lib/head";
import { useSchool } from "@/lib/school-store";
import { SCHOOL, courseTitle, teacherShort, today } from "@/lib/sis-data";

export const Route = createFileRoute("/admin/report-layouts")({
  head: () => pageHead("Axiom · Report Card Layouts", "Configure the school Academic Document: accent colors, page layout, header and footer, with a live preview."),
  component: Layouts,
});

const SCALE = [["A+", "98 - 100"], ["A", "93 - 97"], ["A-", "90 - 92"], ["B+", "88 - 89"], ["B", "85 - 87"], ["B-", "82 - 84"], ["C", "80 - 81"], ["C-", "78 - 78"], ["D+", "76 - 76"], ["D", "72 - 74"], ["D-", "70 - 70"], ["F", "0 - 68"]] as const;
const SAMPLE_COURSES = [["Course One", "Ms. Teacher", "A-"], ["Course Two", "Dr. Teacher", "A"], ["Course Three", "Mr. Teacher", "B+"]] as const;

function Layouts() {
  const { docLayout, update, sections } = useSchool();
  const [d, setD] = useState<DocLayout>(docLayout);
  const set = <K extends keyof DocLayout>(k: K, v: DocLayout[K]) => setD({ ...d, [k]: v });
  const save = () => {
    if (!isHex(d.accentBg) || !isHex(d.accentText)) { toast.error("Accent colors must be hex codes like #5B96D0"); return; }
    if (!d.name.trim() || !d.title.trim()) { toast.error("Enter a layout name and a report title"); return; }
    update((s) => ({ ...s, docLayout: d })); toast.success("Report card layout saved");
  };
  const color = (k: "accentBg" | "accentText", label: string) => (
    <AxField label={label}><div className="flex"><input aria-label={label} value={d[k]} onChange={(e) => set(k, e.target.value)} className={axInput} /><input type="color" aria-label={`${label} picker`} value={isHex(d[k]) && d[k].length === 7 ? d[k] : "#5b96d0"} onChange={(e) => set(k, e.target.value)} className="h-7 w-10 shrink-0 cursor-pointer border border-l-0 border-vc-line p-0.5" /></div></AxField>);
  const rows = sections.length ? sections.slice(0, 6).map((c, i) => [courseTitle(c), c.teacherIds[0] ? teacherShort(c.teacherIds[0]) : "-", SAMPLE_COURSES[i % 3]![2]] as const) : SAMPLE_COURSES;
  const sep = d.labelSeparator;
  const bar: CSSProperties = { background: d.accentBg, color: d.accentText };
  const landscape = d.pageLayout.includes("Landscape");
  return (
    <AxiomShell title="Report Card Layouts" onUpdate={save}>
      <div className="bg-background shadow-sm">
        <AxScreenTitle title={`Academic Document: ${d.name || "Layout"}`} modified="Preview uses sample grades" />
        <div className="grid gap-6 p-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <AxGroup title="General">
              <AxField label="Layout Name"><input aria-label="Layout Name" value={d.name} onChange={(e) => set("name", e.target.value)} maxLength={60} className={axInput} /></AxField>
              <AxField label="Report Title"><input aria-label="Report Title" value={d.title} onChange={(e) => set("title", e.target.value)} maxLength={80} className={axInput} /></AxField>
              {color("accentBg", "Accent Color: Background")}{color("accentText", "Accent Color: Text")}
              <AxField label="Page Layout"><select aria-label="Page Layout" value={d.pageLayout} onChange={(e) => set("pageLayout", e.target.value as DocLayout["pageLayout"])} className={axSelect}>{Object.entries(PAGE_SIZES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></AxField>
              <AxField label="Label Separator"><input aria-label="Label Separator" value={d.labelSeparator} onChange={(e) => set("labelSeparator", e.target.value.slice(0, 3))} className={axInput} /></AxField>
              <AxField label="Show PDF Header?"><AxToggle label="Show PDF Header" checked={d.showHeader} onChange={(v) => set("showHeader", v)} /></AxField>
              <AxField label="Show PDF Footer?"><AxToggle label="Show PDF Footer" checked={d.showFooter} onChange={(v) => set("showFooter", v)} /></AxField>
              <AxField label="Show Grade Scale?"><AxToggle label="Show Grade Scale" checked={d.showGradeScale} onChange={(v) => set("showGradeScale", v)} /></AxField>
              <AxField label="Show GPA Table?"><AxToggle label="Show GPA Table" checked={d.showGpa} onChange={(v) => set("showGpa", v)} /></AxField>
              <AxField label="Show Comments?"><AxToggle label="Show Comments" checked={d.showComments} onChange={(v) => set("showComments", v)} /></AxField>
            </AxGroup>
            <button onClick={() => { setD(DEFAULT_DOC_LAYOUT); }} className="text-vc-link-strong hover:underline">Reset to default layout</button>
          </div>
          <div className="overflow-x-auto bg-vc-panel p-4">
            <div data-testid="report-preview" className={`mx-auto bg-background p-8 font-serif text-[12px] shadow-md ${landscape ? "w-[880px]" : "w-[680px]"}`}>
              <div className="flex justify-between">
                <div className="size-[72px] rounded-full border-4 border-ax-top" aria-hidden />
                <div className="text-right leading-snug">{SCHOOL.name}<br />Print Date: {format(today(), "MM/dd/yyyy")}</div>
              </div>
              <h3 className="my-6 text-center text-[26px] font-normal">{d.title}</h3>
              <div className="flex justify-between gap-6">
                <div><div className="text-[18px]">Sample Student</div>
                  {["Current Grade", "Student ID", "Reporting Period", "Advisor", "Homeroom"].map((l) => <div key={l}><b>{l}{sep}</b></div>)}</div>
                {d.showGradeScale && <div className="w-[260px]"><div className="px-2 py-1 font-bold" style={bar}>Grade Scale</div>
                  <div className="grid grid-cols-2 gap-x-4 px-2 py-1">{SCALE.map(([l, r]) => <div key={l} className="flex justify-between"><span>{l}</span><span>{r}</span></div>)}</div>
                  {d.showGpa && <><div className="mt-2 flex justify-between px-2 py-1 font-bold" style={bar}><span>Grade Point Averages</span><span>Q2</span></div><div className="flex justify-between border-b border-vc-line px-2 py-1"><span>Grading Period</span><span>—</span></div></>}</div>}
              </div>
              <table className="mt-5 w-full border-collapse"><thead><tr style={bar}><th className="px-2 py-1 text-left">Course</th><th className="px-2 py-1 text-left">Teacher</th><th className="px-2 py-1 text-center">Q2</th></tr></thead>
                <tbody>{rows.map(([c, t, g]) => <tr key={c} className="border-b border-foreground/30"><td className="px-2 py-1">{c}</td><td className="px-2 py-1">{t}</td><td className="px-2 py-1 text-center">{g}</td></tr>)}</tbody></table>
              {d.showComments && rows.slice(0, 1).map(([c, t]) => <div key={c} className="mt-5"><div className="border-b border-foreground/40 text-[16px]">{c} - {t}</div><div className="mt-1 font-bold">Student Comment{sep}</div><p className="mt-1 text-justify">Teacher comments for the reporting period appear here.</p></div>)}
              {d.showFooter && <div className="mt-8 text-center text-[11px] text-muted-foreground">Page 1</div>}
              <div className="mt-2 text-right text-[10px] text-muted-foreground">{PAGE_SIZES[d.pageLayout]}{d.showHeader ? " · header on page 2+" : ""}</div>
            </div>
          </div>
        </div>
      </div>
    </AxiomShell>
  );
}
