import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { differenceInCalendarDays, format } from "date-fns";
import { ArrowLeft, Clock, Tag, Undo2, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { MailEditor } from "@/components/common/MailEditor";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { PortalShell } from "@/components/portal/PortalShell";
import { usePortal } from "@/lib/portal-store";
import { rosterOf, useInbox, useSchool, useSection } from "@/lib/school-store";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { pageHead } from "@/lib/head";
import { today } from "@/lib/sis-data";

export const Route = createFileRoute("/messages")({
  validateSearch: z.object({
    id: z.string().optional(),
    view: z.enum(["recent", "people", "categories"]).optional(),
    person: z.string().optional(),
    cat: z.string().optional(),
    compose: z.string().optional(),
    cls: z.string().optional(),
    aud: z.enum(["parents", "students", "all"]).optional(),
  }),
  head: () => pageHead("Messages", "Messages from teachers and school offices."),
  component: Messages,
});

type Item = ReturnType<typeof useInbox>[number];
const GENERAL = "Group Distribution List";
const bucket = (d: Date) => { const n = differenceInCalendarDays(today(), d); return n <= 0 ? "Today" : n <= 7 ? "Last week" : n <= 30 ? "Over a week ago" : "Over a month ago"; };
const groupOf = (list: string) => (list === GENERAL || /^[A-Za-z0-9-]+:\s/.test(list) ? "General" : "School News & Announcements");
const PAGE = 12;

const outlineBtn = "inline-flex h-[24px] items-center gap-1.5 rounded-[3px] border border-[#d4d4d4] bg-white px-[9px] text-[11px] font-semibold text-[#444] shadow-[0_1px_1px_rgba(0,0,0,.18)] hover:bg-[#fafafa]";

function Avatar({ id, size }: { id: string; size: number }) {
  return id
    ? <PersonPhoto personId={id} fit={{ w: size, h: size }} squareIfMissing alt="" className="border border-[#d9d9d9] shadow-sm" />
    : <img src="/default-avatar.png" alt="" width={size} height={size} style={{ width: size, height: size }} className="border border-[#d9d9d9] object-cover shadow-sm" />;
}

function Header({ title, view, onView }: { title: string; view?: string; onView: (v: "recent" | "people" | "categories") => void }) {
  const tabs = [["recent", "Recent", Clock], ["people", "People", Users], ["categories", "Categories", Tag]] as const;
  return (
    <div className="flex h-[58px] items-stretch border-b border-[#dcdcdc] bg-[#f5f5f5]">
      <h1 className="flex-1 self-center pl-[18px] text-[21px] font-normal text-black">{title}</h1>
      {tabs.map(([v, label, Icon]) => (
        <button key={v} type="button" onClick={() => onView(v)} className={`flex w-[109px] flex-col items-center justify-center gap-[3px] border-l border-[#dcdcdc] text-[12px] ${view === v ? "-mb-px bg-white text-vc-link" : "text-[#555] hover:bg-[#efefef]"}`}>
          <Icon className={`size-[19px] ${v === "recent" ? "" : "fill-current"}`} strokeWidth={v === "recent" ? 1.5 : 2} />{label}
        </button>
      ))}
    </div>
  );
}

function Rows({ items, open }: { items: Item[]; open: (m: Item) => void }) {
  const { read } = usePortal();
  const [page, setPage] = useState(0);
  const slice = items.slice(page * PAGE, page * PAGE + PAGE);
  const groups: { label: string; items: Item[] }[] = [];
  for (const x of slice) { const k = bucket(x.date); const g = groups.find((y) => y.label === k); if (g) g.items.push(x); else groups.push({ label: k, items: [x] }); }
  return (
    <>
      {groups.map((g) => (
        <div key={g.label}>
          <div className="mx-[21px] mt-[10px] border-b border-[#dcdcdc] pb-[13px] pt-[4px] text-center text-[18px] font-semibold text-[#444]">{g.label}</div>
          {g.items.map((x) => (
            <button key={x.id} type="button" onClick={() => open(x)} className="mx-[21px] grid h-[59px] w-[calc(100%-42px)] grid-cols-[190px_minmax(0,1fr)_110px] items-start gap-x-3 border-b border-[#dcdcdc] pl-[17px] pt-[9px] text-left hover:bg-[#fafafa]">
              <span className="min-w-0"><span className="block text-[9.5px] leading-[13px] text-black">From</span><span className="block truncate text-[14px] leading-[19px] text-black">{x.from}</span></span>
              <span className={`min-w-0 ${read.includes(x.id) ? "" : ""}`}><span className="block truncate text-[12px] font-light leading-[13px] text-[#555]">{x.list}</span><span className={`block truncate text-[14px] leading-[19px] text-black ${read.includes(x.id) ? "" : "font-semibold"}`}>{x.subject}</span></span>
              <span className="text-right text-[10px] font-semibold leading-[13px] text-[#999]">{format(x.date, "EEE, MMM dd")}</span>
            </button>
          ))}
        </div>
      ))}
      {(page > 0 || items.length > (page + 1) * PAGE) && (
        <div className="flex justify-center gap-3 pb-8 pt-6">
          {page > 0 && <button type="button" onClick={() => setPage(page - 1)} className={outlineBtn}><ArrowLeft className="size-3.5" />Previous</button>}
          {items.length > (page + 1) * PAGE && <button type="button" onClick={() => setPage(page + 1)} className={outlineBtn}>Next</button>}
        </div>
      )}
    </>
  );
}

function Messages() {
  const s = Route.useSearch();
  const { id, view = "recent", person, cat } = s;
  const nav = useNavigate({ from: "/messages" });
  const { markRead } = usePortal();
  const inbox = useInbox();
  const { user } = useSchool();
  const m = inbox.find((x) => x.id === id);
  const open = (x: Item) => { markRead(x.id); nav({ search: { ...s, id: x.id } }); };
  const goView = (v: "recent" | "people" | "categories") => nav({ search: { view: v } });

  if (s.compose && user?.role === "teacher") return <Compose cls={s.cls} aud={s.aud ?? "all"} />;

  if (m) {
    return (
      <PortalShell maxWidth={561}>
        <div className="flex h-[48px] items-center justify-between border-b border-[#dcdcdc] bg-[#f5f5f5] px-[17px]">
          <button type="button" onClick={() => nav({ search: { view, ...(person ? { person } : {}), ...(cat ? { cat } : {}) } })} className={outlineBtn}><Undo2 className="size-3.5" />Back to {person ? "People" : cat ? "Categories" : "Messages"}</button>
          <span className="text-[12px] font-semibold uppercase text-[#444]">Email</span>
        </div>
        <div className="px-[17px] pb-8 pt-[16px]">
          <div className="text-[10px] font-semibold uppercase leading-[14px] text-vc-link">{m.list}</div>
          <h2 className="mt-[2px] text-[20px] font-semibold leading-[26px] text-[#444]">{m.subject}</h2>
          <div className="mt-[6px] grid grid-cols-2 gap-4 border-b border-[#dcdcdc] pb-[13px] text-[12px] leading-[16px]">
            <div><div className="text-[#777]">From:</div><div className="text-black">{m.from}</div></div>
            <div><div className="text-[#777]">Date Sent:</div><div className="text-black">{format(m.date, "EEEE, MMM d 'at' h:mm a")}</div></div>
          </div>
          {m.html
            ? <div className="mt-[16px] text-[12.5px] leading-[16px] text-black [&_a]:text-vc-link [&_a]:underline [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.body) }} />
            : <p className="mt-[16px] whitespace-pre-line text-[12.5px] leading-[16px] text-black">{m.body}</p>}
        </div>
      </PortalShell>
    );
  }

  const title = view === "people" ? (person ? "Messages" : "Messages - People") : view === "categories" ? (cat ? "Messages" : "Messages - Categories") : "Messages";
  let body: ReactNode;
  if (view === "recent") {
    body = <div className="pb-6 pt-[17px]"><div className="px-[21px]"><button type="button" onClick={() => inbox.forEach((x) => markRead(x.id))} className={outlineBtn}>Mark All Read</button></div>
      {inbox.length ? <Rows items={inbox} open={open} /> : <p className="py-12 text-center text-[13px] text-[#777]">No messages.</p>}</div>;
  } else if (view === "people") {
    if (person) {
      const list = inbox.filter((x) => x.from === person);
      body = <div className="pb-6 pt-[17px]"><div className="px-[21px]"><button type="button" onClick={() => nav({ search: { view: "people" } })} className={outlineBtn}><Undo2 className="size-3.5" />Back to People</button></div>
        <div className="-mt-1 flex flex-col items-center pb-3"><Avatar id={list[0]?.fromId ?? ""} size={52} /><div className="mt-1 text-[20px] font-light text-black"><span className="text-[#777]">From:</span> {person}</div></div>
        <Rows items={list} open={open} /></div>;
    } else {
      const names = [...new Set(inbox.map((x) => x.from))].map((n) => { const l = inbox.filter((x) => x.from === n); return { n, last: l[0]!.date, fromId: l[0]!.fromId }; });
      body = <div className="px-[21px] pb-14 pt-[22px]"><div className="border-b border-[#dcdcdc] pb-[13px] text-center text-[18px] font-semibold text-[#444]">General</div>
        <div className="mt-[13px] grid grid-cols-3 gap-y-[18px] pl-[17px]">{names.map((p) => (
          <button key={p.n} type="button" onClick={() => nav({ search: { view: "people", person: p.n } })} className="flex items-center gap-[9px] text-left"><Avatar id={p.fromId} size={43} /><span><span className="block text-[15px] leading-[19px] text-black">{p.n}</span><span className="block text-[12px] font-light leading-[17px] text-[#666]">Last Message: {format(p.last, "MMM dd")}</span></span></button>))}
        </div>{!names.length && <p className="py-10 text-center text-[13px] text-[#777]">No messages.</p>}</div>;
    }
  } else if (cat) {
    body = <div className="pb-6 pt-[17px]"><div className="px-[21px]"><button type="button" onClick={() => nav({ search: { view: "categories" } })} className={outlineBtn}><Undo2 className="size-3.5" />Back to Categories</button></div>
      <Rows items={inbox.filter((x) => x.list === cat)} open={open} /></div>;
  } else {
    const lists = [...new Set(inbox.map((x) => x.list))];
    const groups = ["General", "School News & Announcements"].map((g) => ({ g, lists: lists.filter((l) => groupOf(l) === g) })).filter((x) => x.lists.length);
    body = <div className="px-[21px] pb-14 pt-[22px]">{groups.map((g) => (
      <div key={g.g} className="mb-[22px]"><div className="border-b border-[#dcdcdc] pb-[13px] text-center text-[18px] font-semibold text-[#444]">{g.g}</div>
        <div className="mt-[10px] grid grid-cols-2 gap-y-3 pl-[17px]">{g.lists.map((l) => (
          <button key={l} type="button" onClick={() => nav({ search: { view: "categories", cat: l } })} className="text-left"><span className="block text-[15px] leading-[19px] text-black">{l}</span><span className="block text-[12px] font-light leading-[17px] text-[#666]">Last Message: {format(inbox.find((x) => x.list === l)!.date, "MMM dd")}</span></button>))}
        </div></div>))}{!groups.length && <p className="py-10 text-center text-[13px] text-[#777]">No messages.</p>}</div>;
  }
  return (
    <PortalShell maxWidth={876}>
      <Header title={title} view={view} onView={goView} />
      {body}
    </PortalShell>
  );
}

/** Teachers write school mail here: a full page (not a pop-up) in the same frame as a message. Delivered inside the portal only. */
function Compose({ cls, aud }: { cls?: string | undefined; aud: "parents" | "students" | "all" }) {
  const nav = useNavigate({ from: "/messages" });
  const { user, update } = useSchool();
  const section = useSection(cls ?? "");
  const roster = rosterOf(section);
  const [audience, setAudience] = useState(aud);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const label = section ? `${section.id}: ${section.name}` : "your class";
  const who = audience === "parents" ? "Parents" : audience === "students" ? "Students" : "Parents & Students";
  const send = () => {
    if (!user) return;
    if (!section || !roster.length) { toast.error("There are no students enrolled in this class."); return; }
    if (!subject.trim()) { toast.error("Add a subject first."); return; }
    if (!text.trim()) { toast.error("Write a message first."); return; }
    const name = `${user.prefix ? `${user.prefix} ` : ""}${user.preferred || user.first} ${user.last}`.trim();
    update((x) => ({ ...x, sent: [{
      id: `m-${crypto.randomUUID().slice(0, 8)}`, from: name, fromId: user.personId, list: label, subject: subject.trim(), body: sanitizeHtml(html), html: true,
      audience: "direct", date: new Date().toISOString(), to: audience === "parents" ? [] : roster.map((r) => r.id), parentsOf: audience === "students" ? [] : roster.map((r) => r.id),
    }, ...x.sent] }));
    toast.success(`Email sent to ${who.toLowerCase()} of ${label}`);
    nav({ search: { view: "recent" } });
  };
  const seg = (v: "parents" | "students" | "all", t: string) => <button key={v} type="button" aria-pressed={audience === v} onClick={() => setAudience(v)} className={`h-[26px] border border-[#d4d4d4] px-3 text-[12px] ${audience === v ? "bg-vc-link text-white" : "bg-white text-[#444]"}`}>{t}</button>;
  return (
    <PortalShell maxWidth={640}>
      <div className="flex h-[48px] items-center justify-between border-b border-[#dcdcdc] bg-[#f5f5f5] px-[17px]">
        <button type="button" onClick={() => nav({ search: { view: "recent" } })} className={outlineBtn}><Undo2 className="size-3.5" />Back to Messages</button>
        <span className="text-[12px] font-semibold uppercase text-[#444]">Email</span>
      </div>
      <div className="px-[17px] pb-8 pt-[16px]">
        <div className="text-[10px] font-semibold uppercase leading-[14px] text-vc-link">New message</div>
        <div className="mt-[8px] text-[12px] text-[#777]">To:</div>
        <div className="mt-[2px] flex flex-wrap items-center gap-3"><div className="flex">{seg("parents", "Parents")}{seg("students", "Students")}{seg("all", "Parents & Students")}</div>
          <span className="text-[12.5px] text-black">of {label}{section ? ` (${roster.length} student${roster.length === 1 ? "" : "s"})` : ""}</span></div>
        <label className="mt-[12px] block text-[12px] text-[#777]" htmlFor="mail-subject">Subject:</label>
        <input id="mail-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} className="mt-[2px] h-[32px] w-full border border-[#d6d6d6] px-2.5 text-[14px] text-black outline-none focus:border-vc-link" />
        <div className="mt-[12px]"><MailEditor onChange={(h, t) => { setHtml(h); setText(t); }} /></div>
        <p className="mt-2 text-[11px] text-[#777]">Sent inside the portal only — nothing is emailed outside the school system.</p>
        <div className="mt-4 flex gap-2.5">
          <button type="button" onClick={send} className="h-[34px] rounded-[3px] border-b-[3px] border-b-vc-success-edge bg-vc-success px-6 text-[14px] font-semibold text-primary-foreground">Send</button>
          <button type="button" onClick={() => nav({ search: { view: "recent" } })} className="h-[34px] rounded-[3px] border border-[#d4d4d4] bg-white px-5 text-[13px] text-[#444]">Cancel</button>
        </div>
      </div>
    </PortalShell>
  );
}
