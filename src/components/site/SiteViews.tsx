import { BlocksView } from "@/components/site/PageBlocks";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { Link } from "@tanstack/react-router";
import { addMonths, format, parseISO } from "date-fns";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Clock, FileText, Link2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { StudentCard } from "@/components/portal/StudentCard";
import { buildTimeline, canComment, categoryLabel, dayChips, discussionState, monthGrid, padTime12, scheduleLines, visibleDiscussions, withComment, withoutComment, type Discussion, type DiscussionComment, type DiscussionState, type SiteLink } from "@/lib/class-site";
import { rosterOf, staffIds, useSchool, type Section, type Website } from "@/lib/school-store";
import { courseTitle, teacher, today, type Assignment } from "@/lib/sis-data";
import type { SchedulingSet } from "@/lib/scheduling";

const BLUE = "text-vc-site-blue";
const NAME = (id: string) => { const f = teacher(id); return f.prefix ? `${f.prefix} ${f.last}` : f.last; };
const Empty = ({ what }: { what: string }) => <p className="py-24 text-center text-[15px] text-muted-foreground">Nothing has been posted to {what} yet.</p>;

/** "Change Class" box: type to filter, pick from My Classes. */
export function ClassPicker({ current, options, onPick }: { current: string; options: Section[]; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) { setOpen(false); setQ(""); } };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);
  const shown = options.filter((x) => `${x.id}: ${courseTitle(x)}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div ref={box} className="relative w-[320px] max-w-[62vw] text-foreground">
      <div className="relative">
        <input aria-label="Change Class" placeholder="Change Class" value={q} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          className="h-[26px] w-full rounded-[3px] bg-background px-2 pr-6 text-[14px] outline-none placeholder:text-foreground/70" />
        <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 fill-current ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <div role="listbox" className="absolute left-0 top-[27px] z-30 max-h-[70vh] w-full overflow-y-auto rounded-b-[3px] border border-vc-line bg-background pb-1 shadow-md">
          <div className="px-3 pb-1 pt-3 text-[13px] font-bold">My Classes</div>
          {shown.map((x) => (
            <button key={x.id} role="option" aria-selected={x.id === current} onClick={() => { setOpen(false); setQ(""); onPick(x.id); }}
              className={`block w-full px-3 py-[7px] text-left text-[14px] hover:bg-vc-panel ${x.id === current ? "bg-vc-panel" : ""}`}>{x.id}: {courseTitle(x)}</button>))}
          {!shown.length && <div className="px-3 py-2 text-[13px] text-muted-foreground">No classes found.</div>}
        </div>)}
    </div>
  );
}

/** Home: upcoming assignments (open the assignment pop-up) then the teacher's home sections. */
export function HomeView({ c, upcoming, onOpen }: { c: Section; upcoming: Assignment[]; onOpen: (a: Assignment) => void }) {
  return (
    <div className="px-[19px] pb-10 pt-[26px]">
      {upcoming.length > 0 && <div className="w-[420px] max-w-full border-b-2 border-vc-gray-light pb-px text-[17px] font-semibold text-vc-gray-dark">Assignments</div>}
      {upcoming.length > 0 && <div className="mt-2 space-y-1">{upcoming.map((a) => (
        <button key={a.id} onClick={() => onOpen(a)} className={`flex gap-4 text-left text-[18px] leading-[30px] hover:underline ${BLUE}`}>
          <span className="w-9">{format(a.due, "EEE").toUpperCase()}</span><span className="w-[70px]">{format(a.due, "MMM dd")}</span><span>{a.title.length > 30 ? categoryLabel(a.category) : a.title}</span></button>))}</div>}
      {c.website.sections.map((sec, i) => (
        <section key={i} className="mx-auto mt-[22px] w-[89%] font-[Arial,sans-serif]">
          <h3 className="bg-[#37465f] px-[38px] py-[17px] text-[28px] font-bold leading-[1.1] text-[#ee4b2b]">{sec.title}</h3>
          <p className="whitespace-pre-line px-[38px] py-[18px] text-justify text-[16px] leading-[28px]">{sec.body}</p>
        </section>))}
    </div>
  );
}

/** "More class information": teacher, weekly schedule and course description. */
export function InfoView({ c, sets, description }: { c: Section; sets: SchedulingSet[]; description: string }) {
  const lines = scheduleLines(c, sets);
  return (
    <div className="px-[19px] pb-10 pt-[24px]">
      <h2 className="text-[30px] font-semibold leading-9">Teacher</h2>
      {staffIds(c).map((id) => (
        <div key={id} className="mt-1.5 flex items-start gap-[14px]">
          <PersonPhoto personId={id} full plainBg res={0.8} fit={{ w: 254, h: 380 }} squareIfMissing alt={NAME(id)} className="max-w-[45%]" />
          <div className="pt-[18px]"><div className="text-[15px] font-semibold text-vc-gray-dark">{NAME(id)}</div>
            <a href={`mailto:${teacher(id).email}`} className={`text-[19px] ${BLUE}`}>{teacher(id).email}</a></div>
        </div>))}
      <h2 className="mt-[42px] text-[30px] font-semibold leading-9">Schedule</h2>
      {lines.length ? <ul className="mt-5 list-disc space-y-1 pl-[38px] text-[18px] leading-[26px]">{lines.map((l, i) => (
        <li key={i}><strong>{l.dayName}</strong>: {padTime12(l.start)}{l.end ? `-${padTime12(l.end)}` : ""}</li>))}</ul>
        : <p className="mt-3 text-[16px] text-muted-foreground">This class has no meeting times yet.</p>}
      <h2 className="mt-[34px] text-[30px] font-semibold leading-9">Course Description</h2>
      <p className="mt-4 whitespace-pre-line text-[18px] leading-[26px]">{description || "No course description has been added."}</p>
    </div>
  );
}

const AttachLink = ({ l }: { l: SiteLink }) => (
  <div className="flex items-center gap-3 py-1.5"><FileText className="size-[22px] shrink-0" strokeWidth={1.5} /><a href={l.url} target="_blank" rel="noreferrer" className={`text-[16px] ${BLUE}`}>{l.label || l.url}</a></div>);

export function PostsView({ ws, student }: { ws: Website; student: boolean }) {
  const posts = (ws.posts ?? []).filter((p) => !student || p.published).sort((a, b) => b.date.localeCompare(a.date));
  if (!posts.length) return <Empty what="Posts" />;
  return (
    <div className="space-y-9 px-[19px] pb-10 pt-[26px]">{posts.map((p) => { const d = parseISO(p.date); return (
      <article key={p.id}>
        <div className="flex items-center gap-[18px] border-b border-vc-line pb-3">
          <div className={`grid size-[84px] shrink-0 place-items-center rounded-full border border-vc-line bg-vc-panel text-center leading-tight ${BLUE}`}>
            <div><div className="text-[24px] font-semibold">{format(d, "EEE")}</div><div className="text-[15px] font-semibold">{format(d, "MMM d")}</div></div></div>
          <h3 className="min-w-0 text-[26px] leading-8">{p.title}{student || p.published ? "" : " (draft)"}</h3>
        </div>
        {p.body && (p.html ? <div className="mt-4 px-[18px] text-[16px] leading-6 [&_a]:text-vc-site-blue [&_a]:underline [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.body) }} /> : <p className="mt-4 whitespace-pre-wrap px-[18px] text-[16px] leading-6">{p.body}</p>)}
        <div className="mt-3 px-[34px]">{p.links.map((l, i) => <AttachLink key={i} l={l} />)}</div>
      </article>); })}</div>
  );
}

const Cut = ({ kind }: { kind: "assigned" | "due" }) => (
  <span className="relative z-10 grid size-[40px] place-items-center rounded-full text-primary-foreground" style={{ background: kind === "due" ? "#2d6eb4" : "#4a5b73" }}>
    <BookOpen className="size-[19px]" strokeWidth={2} />
    {kind === "due" && <span className="absolute -right-[3px] -top-[3px] grid size-[17px] place-items-center rounded-full border border-destructive bg-background text-destructive"><Clock className="size-[11px]" strokeWidth={3} /></span>}
  </span>);

export function TimelineView({ list, onOpen }: { list: Assignment[]; onOpen: (a: Assignment) => void }) {
  const [filter, setFilter] = useState<"recent" | "all">("recent");
  const weeks = useMemo(() => buildTimeline(list, today(), filter), [list, filter]);
  return (
    <div className="px-[19px] pb-10 pt-[26px]">
      <div className="mb-1 flex items-center justify-end gap-2 text-[13px]">Filter:
        <div className="flex overflow-hidden rounded-[3px] text-[14px]">{(["recent", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-[15px] py-[5px] ${filter === f ? "bg-[#3a5189] text-primary-foreground" : "bg-vc-tile text-vc-site-blue"}`}>{f === "recent" ? "Recent" : "All Year"}</button>))}</div></div>
      {!weeks.length ? <Empty what="the Timeline" /> : (
        <div className="relative ml-[2px]"><div className="absolute bottom-0 left-[203px] top-5 w-[2px] bg-vc-gray-light" />
          {weeks.map((w) => (
            <section key={w.key}>
              <div className="relative z-10 grid h-[47px] grid-cols-[165px_76px_1fr]"><span /><span className="relative"><span className="absolute left-1/2 top-0 w-[170px] -translate-x-1/2 border border-vc-line bg-background py-[7px] text-center text-[20px] font-semibold text-[#2b5c93]">{w.label}</span></span></div>
              {w.events.map((e) => (
                <button key={e.key} onClick={() => onOpen(e.assignment)} className="grid w-full grid-cols-[165px_76px_1fr] items-center py-[17px] text-left">
                  <span className="pr-3 text-right leading-[27px]"><span className="block text-[17px]">{format(e.date, "EEEE")}</span><span className="block text-[19px] font-semibold">{format(e.date, "MMM dd")}</span></span>
                  <span className="grid justify-items-center"><Cut kind={e.kind} /></span>
                  <span className="min-w-0 pl-1"><span className="block text-[17px] leading-6 text-[#3a5a85]">{e.kind === "due" ? "Assignment Due" : "Assignment Assigned"}</span><span className="block text-[20px] leading-6">{e.assignment.title}</span></span>
                </button>))}
            </section>))}
        </div>)}
    </div>
  );
}

const CHIP = { green: "text-[#3a8f1c]", red: "text-[#c0291a]", block: "" } as const;
export function CalendarView({ c, sets, list, onOpen }: { c: Section; sets: SchedulingSet[]; list: Assignment[]; onOpen: (a: Assignment) => void }) {
  const [month, setMonth] = useState(() => today());
  const grid = useMemo(() => monthGrid(month), [month]);
  return (
    <div className="px-[19px] pb-10 pt-[30px]">
      <div className="relative flex items-center">
        <button aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))} className="p-2"><ChevronLeft className="size-6" strokeWidth={3.5} /></button>
        <button aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))} className="ml-[34px] p-2"><ChevronRight className="size-6" strokeWidth={3.5} /></button>
        <button onClick={() => setMonth(today())} className="ml-[30px] text-[18px] text-muted-foreground">today</button>
        <h2 className="absolute inset-x-0 text-center text-[29px] leading-9">{format(month, "MMMM yyyy")}</h2>
      </div>
      <div className="mt-[26px] overflow-x-auto"><table className="w-full min-w-[640px] table-fixed border-collapse text-[14px]">
        <thead><tr>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => <th key={d} className="border-b border-vc-line pb-2 pr-2 text-right text-[16px] font-normal">{d}</th>)}</tr></thead>
        <tbody>{grid.map((row, i) => <tr key={i}>{row.map(({ date, inMonth }) => (
          <td key={+date} className="h-[100px] border border-l-0 border-vc-line p-0 align-top">
            <div className={`pr-2 pt-1 text-right text-[16px] ${inMonth ? "" : "text-vc-gray-light"}`}>{date.getDate()}</div>
            <div className="space-y-[3px] px-[5px] pb-1">{dayChips(date, c, sets, list).map((ch) => ch.tone === "block"
              ? <div key={ch.key} className="truncate rounded-[3px] bg-[#dce9f8] px-1 py-px text-[13px] leading-[17px]"><b>{ch.time}</b> <span className={BLUE}>{ch.text}</span></div>
              : <button key={ch.key} onClick={() => { const a = list.find((x) => x.id === ch.key); if (a) onOpen(a); }} className={`block max-w-full truncate text-left text-[12px] leading-4 hover:underline ${CHIP[ch.tone]}`}>{ch.text}</button>)}</div>
          </td>))}</tr>)}</tbody>
      </table></div>
    </div>
  );
}

export function ResourcesView({ ws }: { ws: Website }) {
  const topics = ws.resources ?? [];
  if (!topics.length) return <Empty what="Resources" />;
  return (
    <div className="px-[19px] pb-10 pt-[24px]">
      <h2 className="text-[34px] font-extrabold leading-10">Class Resources</h2>
      <div className="mt-1 grid gap-x-12 gap-y-10 sm:grid-cols-2">{topics.map((t) => (
        <section key={t.id} className="min-w-0"><h3 className="text-[27px] leading-9">{t.title}</h3>
          {t.links.map((l, i) => <div key={i} className="mt-[7px] flex items-start gap-2"><Link2 className={`mt-1.5 size-4 shrink-0 ${BLUE}`} /><a href={l.url} target="_blank" rel="noreferrer" className={`text-[18px] leading-[22px] ${BLUE}`}>{l.label || l.url}</a></div>)}</section>))}</div>
    </div>
  );
}

export function DirectoryView({ c }: { c: Section }) {
  return (
    <div className="px-[19px] pb-10 pt-[26px]">
      <h2 className="text-[32px] font-extrabold leading-10">Student Directory</h2>
      <div className="mt-5 text-right"><button onClick={() => window.print()} className={`text-[18px] ${BLUE}`}>Download Directory (PDF)</button></div>
      <div className="mt-5 space-y-5">{rosterOf(c).map((s) => <StudentCard key={s.id} s={s} />)}</div>
    </div>
  );
}

/** All Pages: every published page with its publish date. */
export function PageListView({ c, student }: { c: Section; student: boolean }) {
  const ws = c.website;
  const names = ws.pages.filter((p) => !student || ws.pageContent?.[p]?.published);
  if (!names.length) return <Empty what="Pages" />;
  return (
    <ul className="space-y-[26px] px-[19px] pb-10 pt-[30px]">{names.map((p) => { const d = ws.pageContent?.[p]?.date; return (
      <li key={p} className="ml-6 list-disc marker:text-[18px]">
        <Link to="/class/$classId" params={{ classId: c.id }} search={{ page: p }} className={`text-[30px] leading-9 ${BLUE}`}>{p}</Link>
        {d && <div className={`mt-[14px] text-[18px] font-semibold ${BLUE}`}>Published: {format(parseISO(d), "EEE, MMM dd")}</div>}
      </li>); })}</ul>
  );
}

/** One page: publish date, title, text and an optional full-width button. */
export function PageView({ name, ws }: { name: string; ws: Website }) {
  const p = ws.pageContent?.[name];
  return (
    <div className="px-[19px] pb-10 pt-[26px]">
      {p?.date && <div className="text-[16px] font-semibold text-vc-gray-dark">Published: {format(parseISO(p.date), "EEE, MMM dd")}</div>}
      <h2 className="text-[33px] leading-10">{name}</h2>
      {p?.blocks?.length ? <div className="mt-4 -mx-[19px]"><BlocksView blocks={p.blocks} /></div> : null}
      {p?.button?.url && <a href={p.button.url} target="_blank" rel="noreferrer" className="mx-auto mt-[22px] block w-[82%] bg-vc-site-blue py-[18px] text-center font-[Arial,sans-serif] text-[20px] text-primary-foreground shadow-sm">{p.button.label || name}</a>}
      {p?.body && <p className="mt-6 whitespace-pre-wrap text-[17px] leading-[27px]">{p.body}</p>}
    </div>
  );
}

export const PagesPlaceholder = ({ what }: { what: string }) => <Empty what={what} />;

/** Photos: the teacher and every classmate, as in the class directory but photos only. */
export function PhotosView({ c }: { c: Section }) {
  const roster = rosterOf(c);
  const tile = (id: string, first: string, last: string) => (
    <div key={id} className="text-center"><PersonPhoto personId={id} fit={{ w: 130, h: 130 }} squareIfMissing alt={`${first} ${last}`} className="mx-auto aspect-square w-full max-w-[130px]" /><div className="mt-1.5 text-[15px] font-semibold leading-tight">{first}</div><div className="text-[15px] leading-tight">{last}</div></div>);
  return (
    <div className="px-[19px] pb-10 pt-[26px]">
      <h2 className="text-[32px] font-extrabold leading-10">Photos</h2>
      <h3 className="mt-5 text-[18px]">Teacher</h3>
      <div className="mt-3 grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-5">{staffIds(c).map((id) => { const f = teacher(id); return tile(id, f.prefix || f.first, f.last); })}</div>
      <h3 className="mt-8 text-[18px]">Students <span className="text-[15px] text-muted-foreground">({roster.length})</span></h3>
      <div className="mt-3 grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-5">{roster.map((s) => tile(s.id, s.first, s.last))}</div>
      {!roster.length && <p className="py-10 text-center text-[15px] text-muted-foreground">No students are enrolled yet.</p>}
    </div>
  );
}

const STATE_BADGE: Record<DiscussionState, string> = { open: "bg-vc-success", closed: "bg-destructive", draft: "bg-vc-gray", scheduled: "bg-vc-badge" };
/** Discussions: open and closed topics with threaded comments. Students comment while a topic is open; the teacher also sees drafts, can always comment and can remove comments. */
export function DiscussionsView({ c, canManage }: { c: Section; canManage: boolean }) {
  const { user, update } = useSchool();
  const day = format(new Date(), "yyyy-MM-dd");
  const list = visibleDiscussions(c.website.discussions ?? [], canManage, day);
  const [sel, setSel] = useState<string | null>(null);
  const [txt, setTxt] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const cur = list.find((d) => d.id === sel) ?? list[0];
  const me = [user?.prefix, user?.preferred || user?.first, user?.last].filter(Boolean).join(" ");
  const set = (id: string, fn: (d: Discussion) => Discussion) => update((s) => ({ ...s, sections: s.sections.map((x) => (x.id === c.id ? { ...x, website: { ...x.website, discussions: (x.website.discussions ?? []).map((d) => (d.id === id ? fn(d) : d)) } } : x)) }));
  const post = (parent?: string) => {
    if (!cur || !txt.trim() || !user) return;
    set(cur.id, (d) => withComment(d, { id: crypto.randomUUID().slice(0, 8), by: me, byId: user.personId, date: new Date().toISOString(), text: txt.trim(), parent }));
    setTxt(""); setReply(null);
  };
  if (!list.length) return <Empty what="Discussions" />;
  const state = cur ? discussionState(cur, day) : "open";
  const allowed = cur ? canComment(cur, day, canManage) : false;
  const Card = ({ cm, depth }: { cm: DiscussionComment; depth: number }) => (
    <div className={`mt-4 flex gap-3 ${depth ? "ml-[56px]" : ""}`}>
      <PersonPhoto personId={cm.byId} fit={{ w: 56, h: 56 }} squareIfMissing alt="" className="size-[56px] shrink-0" />
      <div className="min-w-0 flex-1 border border-vc-line">
        <div className="flex items-center justify-between gap-2 bg-vc-site-blue px-3 py-1.5 text-[14px] text-white"><span><b>{cm.by}</b> {format(parseISO(cm.date), "MMM d")}</span>
          <span className="flex gap-3">{depth === 0 && allowed && <button type="button" onClick={() => { setReply(reply === cm.id ? null : cm.id); setTxt(""); }} className="underline">Reply</button>}
            {cur && (canManage || cm.byId === user?.personId) && <button type="button" aria-label={`Delete comment by ${cm.by}`} onClick={() => set(cur.id, (d) => withoutComment(d, cm.id))} className="underline">Delete</button>}</span></div>
        <p className="whitespace-pre-wrap p-3 text-[16px]">{cm.text}</p>
      </div>
    </div>);
  const group = (st: DiscussionState, label: string) => { const items = list.filter((d) => discussionState(d, day) === st); return items.length ? (
    <div key={st}><div className="bg-vc-panel px-4 py-1.5 text-[12px] font-bold uppercase tracking-wide">{label}</div>
      {items.map((d) => <button key={d.id} type="button" onClick={() => { setSel(d.id); setReply(null); setTxt(""); }} className={`flex w-full items-center justify-between gap-2 border-b border-vc-line px-4 py-3 text-left ${cur?.id === d.id ? "border-l-4 border-l-vc-site-blue bg-vc-panel" : "bg-background"}`}><span className="text-[16px] font-semibold">{d.title}</span><span className="grid min-w-[28px] place-items-center rounded-full bg-vc-site-blue px-1.5 text-[13px] font-bold text-white" aria-label={`${d.comments.length} comments`}>{d.comments.length}</span></button>)}</div>) : null; };
  return (
    <div className="grid min-h-[520px] md:grid-cols-[280px_minmax(0,1fr)]">
      <div className="border-r border-vc-line">{group("open", "Open")}{canManage && group("scheduled", "Scheduled")}{canManage && group("draft", "Drafts")}{group("closed", "Closed")}</div>
      {cur && <div className="px-6 pb-10 pt-5">
        <h2 className="text-[32px] font-light leading-10">{cur.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[14px] text-muted-foreground"><span className={`px-2.5 py-0.5 text-[12px] font-semibold uppercase text-white ${STATE_BADGE[state]}`}>{state}</span>{cur.opens && <span>Opens {format(parseISO(cur.opens), "MMM d")}</span>}{cur.closes && <span>Closes {format(parseISO(cur.closes), "MMM d")}</span>}</div>
        <div className="mt-4 border-b-[3px] border-b-vc-site-blue pb-3 text-[16px] [&_a]:text-vc-site-blue [&_a]:underline [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cur.body) }} />
        {cur.comments.filter((x) => !x.parent).map((cm) => (
          <div key={cm.id}><Card cm={cm} depth={0} />{cur.comments.filter((r) => r.parent === cm.id).map((r) => <Card key={r.id} cm={r} depth={1} />)}
            {reply === cm.id && <div className="ml-[56px] mt-3"><textarea aria-label="Reply" autoFocus value={txt} onChange={(e) => setTxt(e.target.value)} className="h-[70px] w-full border border-vc-line p-2 text-[15px]" /><button type="button" onClick={() => post(cm.id)} className="mt-2 h-[32px] border border-vc-line bg-vc-panel px-4 text-[14px] font-semibold">Post reply</button></div>}</div>))}
        {!cur.comments.length && <p className="mt-6 text-muted-foreground">No comments yet.</p>}
        {allowed ? <div className="mt-8"><textarea aria-label="Add a comment" placeholder="Add a comment" value={reply ? "" : txt} onChange={(e) => { setReply(null); setTxt(e.target.value); }} className="h-[90px] w-full border border-vc-line p-2 text-[15px]" /><button type="button" onClick={() => post()} className="mt-2 h-[34px] border border-vc-line bg-vc-panel px-4 text-[14px] font-semibold">Post comment</button></div>
          : <p className="mt-8 border border-vc-line bg-vc-panel px-3 py-2 text-[14px] text-muted-foreground">This discussion is {state === "closed" ? "closed" : "not open yet"}, so comments are turned off.</p>}
      </div>}
    </div>
  );
}
