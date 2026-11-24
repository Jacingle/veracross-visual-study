import { differenceInYears, parseISO } from "date-fns";
import { ExternalLink, Search } from "lucide-react";
import { useState } from "react";
import { AxBanner, AxDetail, AxEmpty, AxField, axInput, type AxGroup } from "@/components/admin/AxiomDetail";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { TEACHERS } from "@/lib/sis-data";
import { ROLE_LABEL, type Role, type User } from "@/lib/auth-rules";

export type PersonDraft = Omit<User, "id">;
const SIDE = ["General", "Daily Schedule", "Boarding", "Related People", "Emergency", "Attendance", "Cohort", "Schedule", "Schedule - ALL", "Communication", "Behavior/Comments", "Organizations", "Academic Reports"];
const GENDERS = ["", "Female", "Male", "Non-binary", "Other"];
const PRONOUNS = ["", "She/Her", "He/Him", "They/Them", "Other"];
const SUFFIXES = ["", "Jr.", "Sr.", "II", "III", "IV"];
const PREFIXES = ["", "Mr.", "Mrs.", "Ms.", "Miss", "Mx.", "Dr.", "Prof.", "Rev."];
const sel = `${axInput} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22><path d=%22M0 0h10L5 6z%22 fill=%22%23888%22/></svg>')] bg-[length:10px_6px] bg-[right_10px_center] bg-no-repeat pr-7`;
const readonly = "flex h-[30px] items-center justify-end bg-vc-panel px-2.5 text-[13px]";

/** A person record like Axiom's Student screen: section menu on the left, three-column General form, photo on the right. */
export function PersonRecord({ d, set, photoUrl, onReplacePhoto }: { d: PersonDraft; set: (p: Partial<PersonDraft>) => void; photoUrl?: string | undefined; onReplacePhoto: () => void }) {
  const [tab, setTab] = useState("General");
  const groups: AxGroup[] = [{ heading: "General", items: (d.role === "student" ? SIDE : ["General"]).map((l) => ({ id: l, label: l })) }, { heading: "Account", items: [{ id: "Portal Access", label: "Portal Access" }] }];
  const age = d.birthday ? differenceInYears(new Date(), parseISO(d.birthday)) : "";
  const parents = d.parents ?? [];
  const setParent = (i: number, v: string) => { const p = [...parents]; while (p.length < 3) p.push(""); p[i] = v; set({ parents: p }); };
  const T = (k: keyof PersonDraft, label: string, o: { required?: boolean; max?: number } = {}) => (
    <AxField label={label} required={o.required ?? false}><input aria-label={label} className={axInput} maxLength={o.max ?? 60} value={String(d[k] ?? "")} onChange={(e) => set({ [k]: e.target.value } as Partial<PersonDraft>)} /></AxField>);
  const S = (k: "gender" | "pronouns" | "suffix" | "prefix", label: string, opts: string[]) => (
    <AxField label={label}><select aria-label={label} className={sel} value={d[k] ?? ""} onChange={(e) => set({ [k]: e.target.value })}>{opts.map((o) => <option key={o} value={o}>{o || "<None>"}</option>)}</select></AxField>);
  const E = (k: "email" | "email1", label: string) => (
    <AxField label={label}><div className="flex"><input type="email" aria-label={label} className={axInput} maxLength={120} value={d[k] ?? ""} onChange={(e) => set({ [k]: e.target.value } as Partial<PersonDraft>)} /><span className="grid h-[30px] w-[34px] shrink-0 place-items-center border border-l-0 border-vc-gray-light/80 bg-vc-panel text-[12px] text-vc-gray">@</span></div></AxField>);
  const col = "min-w-0 px-4 py-3";
  return (
    <AxDetail groups={groups} active={tab} onSelect={setTab} title={tab === "Portal Access" ? "Portal Access" : tab} banner={tab === "General" ? <AxBanner /> : undefined}>
      {tab === "General" && (
        <div className="grid gap-0 border-t border-vc-line lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className={`${col} border-r border-vc-line`}>
            {d.role !== "student" && S("prefix", "Prefix", PREFIXES)}
            {T("first", "First Name", { required: true, max: 40 })}{T("middle", "Middle Name", { max: 40 })}{T("last", "Last Name", { required: true, max: 40 })}
            {S("suffix", "Name Suffix", SUFFIXES)}{T("preferred", "Preferred Name", { max: 40 })}
            <div className="h-[38px]" />
            {S("gender", "Gender", GENDERS)}{S("pronouns", "Pronouns", PRONOUNS)}
            <AxField label="Birthday"><input type="date" aria-label="Birthday" className={axInput} value={d.birthday ?? ""} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set({ birthday: e.target.value })} /></AxField>
            <AxField label="Age"><div className={readonly}>{age}</div></AxField>
            {d.role === "student" && <AxField label="Grade Level"><select aria-label="Grade level" className={sel} value={d.grade ?? 9} onChange={(e) => set({ grade: Number(e.target.value) })}>{Array.from({ length: 13 }, (_, g) => <option key={g} value={g}>{g === 0 ? "Kindergarten" : g}</option>)}</select></AxField>}
          </div>
          <div className={`${col} border-r border-vc-line`}>
            <AxField label="Household"><div className="flex"><input aria-label="Household" className={axInput} value={d.household ?? ""} onChange={(e) => set({ household: e.target.value })} /><span className="grid h-[30px] w-[34px] shrink-0 place-items-center border border-l-0 border-vc-gray-light/80"><Search className="size-4" /></span><span className="grid h-[30px] w-[34px] shrink-0 place-items-center border border-l-0 border-vc-gray-light/80"><ExternalLink className="size-4" /></span></div></AxField>
            {T("address", "Address 1", { max: 80 })}{T("address2", "Address 2", { max: 80 })}
            <AxField label="City, State, Postal"><div className="grid grid-cols-[1fr_54px_80px] gap-1"><input aria-label="City" className={axInput} value={d.city ?? ""} onChange={(e) => set({ city: e.target.value })} /><input aria-label="State" className={axInput} maxLength={20} value={d.state ?? ""} onChange={(e) => set({ state: e.target.value })} /><input aria-label="Postal" className={axInput} maxLength={12} value={d.postal ?? ""} onChange={(e) => set({ postal: e.target.value })} /></div></AxField>
            {T("phone", "Home Phone", { max: 30 })}{T("mobile", "Mobile Phone", { max: 30 })}
            {E("email", "Email 1")}
            {E("email1", "Email 2")}
            <div className="h-[38px]" />
            {[0, 1, 2].map((i) => <AxField key={i} label={`Parent ${i + 1}`}><input aria-label={`Parent ${i + 1}`} className={axInput} maxLength={60} value={parents[i] ?? ""} onChange={(e) => setParent(i, e.target.value)} /></AxField>)}
          </div>
          <div className={col}>
            <div className="text-[13px] uppercase text-vc-gray-dark">Photo</div>
            <div className="mt-2 w-[200px] bg-vc-panel">{photoUrl ? <img src={photoUrl} alt="Person photo" className="aspect-square w-full object-cover" /> : <PersonPhoto personId={d.personId === "new" ? undefined : d.personId} className="aspect-square w-full object-cover" fit={{ w: 200, h: 200 }} squareIfMissing alt="Person photo" />}</div>
            <div className="mt-8 flex items-center gap-4"><span className="text-[13px] uppercase text-vc-gray-dark">Upload Person Photo</span><button type="button" onClick={onReplacePhoto} className="text-[14px] text-vc-link-strong hover:underline">Replace Photo...</button></div>
            <p className="mt-2 text-[12px] text-vc-gray">JPG, PNG or GIF. The photo is shown on the General tab and across the portals.</p>
          </div>
        </div>)}
      {tab === "Portal Access" && (
        <div className="max-w-[560px] border-t border-vc-line px-4 py-3">
          <AxField label="Username" required><input aria-label="Username" autoComplete="off" className={axInput} maxLength={60} placeholder="for example, jane.smith" value={d.username ?? ""} onChange={(e) => set({ username: e.target.value.replace(/\s/g, "") })} /></AxField>
          <p className="-mt-0.5 mb-1 text-[12px] text-vc-gray">The name used to sign in. It is separate from the email address on the General tab.</p>
          <AxField label="Password" required><div className="flex gap-2"><input aria-label="Password" className={axInput} value={d.password} maxLength={120} onChange={(e) => set({ password: e.target.value })} /><button type="button" onClick={() => set({ password: (d.username ?? "").trim().toLowerCase() })} className="h-[30px] shrink-0 border border-vc-line px-2 text-[12px]">Same as username</button></div></AxField>
          <AxField label="Role"><select aria-label="Role" className={sel} value={d.role} onChange={(e) => { set({ role: e.target.value as Role, personId: "new" }); if (e.target.value !== "student") setTab("Portal Access"); }}>{(["student", "teacher", "admin"] as const).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></AxField>
          {d.role === "teacher" && <AxField label="Faculty Record"><select aria-label="Faculty record" className={sel} value={d.personId} onChange={(e) => set({ personId: e.target.value })}><option value="new">+ New faculty record</option><option value="">— none —</option>{TEACHERS.map((t) => <option key={t.id} value={t.id}>{t.first} {t.last}</option>)}</select></AxField>}
          {d.role === "student" && <AxField label="Student Record"><select aria-label="Student record" className={sel} value={d.personId} onChange={(e) => set({ personId: e.target.value })}><option value="new">+ New student record</option><option value="">— none —</option>{d.personId.startsWith("p-") && <option value={d.personId}>{d.first} {d.last} (own record)</option>}</select></AxField>}
        </div>)}
      {tab !== "General" && tab !== "Portal Access" && <div className="border-t border-vc-line"><AxEmpty /><p className="pb-10 text-center text-[13px] text-vc-gray">Nothing recorded in {tab} yet.</p></div>}
    </AxDetail>
  );
}
