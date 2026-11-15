import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { differenceInCalendarDays, format } from "date-fns";
import { ArrowLeft, Mail, MailOpen } from "lucide-react";
import { z } from "zod";
import { PortalShell } from "@/components/portal/PortalShell";
import { today } from "@/lib/sis-data";
import { usePortal } from "@/lib/portal-store";
import { useInbox } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/messages")({
  validateSearch: z.object({ id: z.string().optional(), view: z.enum(["recent", "people", "categories"]).optional() }),
  head: () => pageHead("Messages", "Messages from teachers and school offices."),
  component: Messages,
});

const bucket = (d: Date) => { const n = differenceInCalendarDays(today(), d); return n <= 0 ? "Today" : n === 1 ? "Yesterday" : n <= 7 ? "Last Week" : "Earlier"; };

function Messages() {
  const { id, view = "recent" } = Route.useSearch();
  const nav = useNavigate({ from: "/messages" });
  const { read, markRead } = usePortal();
  const inbox = useInbox();
  const m = inbox.find((x) => x.id === id);
  if (m) {
    return (
      <PortalShell>
        <div className="flex items-center gap-3 border-b border-vc-line px-4 py-3">
          <Link to="/messages" className="flex items-center gap-1 text-[13px] text-vc-link-strong hover:underline"><ArrowLeft className="size-4" /> Messages</Link>
        </div>
        <div className="px-8 py-6">
          <div className="flex items-start justify-between border-b border-vc-line pb-3">
            <div><div className="text-[15px] font-semibold">{m.from}</div><div className="text-[12px] text-muted-foreground">{m.list}</div></div>
            <div className="text-[12px] text-muted-foreground">{format(m.date, "EEEE, MMMM d, yyyy")}</div>
          </div>
          <h2 className="mt-4 text-[20px]">{m.subject}</h2>
          <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed">{m.body}</p>
          <p className="mt-4 text-[14px]">{m.from}</p>
        </div>
      </PortalShell>
    );
  }
  const groups: { label: string; items: typeof inbox }[] = [];
  const keyOf = (x: (typeof inbox)[number]) => (view === "people" ? x.from : view === "categories" ? x.list : bucket(x.date));
  for (const x of inbox) { const k = keyOf(x); const g = groups.find((y) => y.label === k); if (g) g.items.push(x); else groups.push({ label: k, items: [x] }); }
  return (
    <PortalShell>
      <div className="flex items-center justify-between border-b border-vc-line px-4 py-2.5">
        <span className="text-[18px]">Messages</span>
        <div className="flex items-center gap-4 text-[13px]">
          <div className="flex">{(["recent", "people", "categories"] as const).map((v) => (
            <button key={v} onClick={() => nav({ search: { view: v } })} className={`border border-vc-line px-3 py-1 capitalize first:rounded-l-sm last:rounded-r-sm ${view === v ? "bg-vc-link text-primary-foreground" : ""}`}>{v}</button>))}</div>
          <button onClick={() => inbox.forEach((x) => markRead(x.id))} className="text-vc-link-strong hover:underline">Mark All Read</button>
        </div>
      </div>
      <div className="px-4 pb-6">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="mt-4 border-b border-foreground/50 pb-1 text-[13px] font-semibold text-foreground/70">{g.label}</div>
            {g.items.map((x) => { const isRead = read.includes(x.id); return (
              <button key={x.id} onClick={() => { markRead(x.id); nav({ search: { id: x.id } }); }} className="grid w-full grid-cols-[22px_200px_minmax(0,1fr)_90px] items-center gap-3 border-b border-vc-line px-1 py-2 text-left text-[13px] hover:bg-vc-panel">
                {isRead ? <MailOpen className="size-4 text-muted-foreground" /> : <Mail className="size-4 text-vc-link-strong" />}
                <span className={`truncate ${isRead ? "" : "font-semibold"}`}>{x.from}<span className="block text-[11px] font-normal text-muted-foreground">{x.list}</span></span>
                <span className={`truncate ${isRead ? "text-foreground/80" : "font-semibold text-vc-link-strong"}`}>{x.subject}</span>
                <span className="text-right text-[12px] text-muted-foreground">{format(x.date, "MMM d")}</span>
              </button>); })}
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
