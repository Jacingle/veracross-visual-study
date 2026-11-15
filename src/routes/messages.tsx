import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { differenceInCalendarDays, format } from "date-fns";
import { ArrowLeft, Mail, MailOpen, Clock, Users, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center justify-between border-b border-vc-line bg-vc-panel pl-5">
        <span className="text-[18px]">Messages</span>
        <div className="flex items-center gap-4 text-[13px]">
          <div className="flex">{(["recent", "people", "categories"] as const).map((v) => (
            <Button variant="ghost" key={v} onClick={() => nav({ search: { view: v } })} className={`h-16 w-24 flex-col gap-1 rounded-none border-l border-vc-line text-[12px] capitalize ${view === v ? "bg-background text-vc-link" : "text-muted-foreground"}`}>{v === "recent" ? <Clock /> : v === "people" ? <Users /> : <Tag />}{v}</Button>))}</div>
        </div>
      </div>
      <div className="px-7 pb-6 pt-4 sm:px-12">
        <Button variant="outline" size="sm" onClick={() => inbox.forEach((x) => markRead(x.id))}><MailOpen />Mark All Read</Button>
        {!inbox.length && <p className="py-12 text-center text-muted-foreground">No messages.</p>}
        {groups.map((g) => (
          <div key={g.label}>
            <div className="mt-5 border-b border-vc-line pb-3 text-center text-[18px] font-semibold text-foreground/70">{g.label}</div>
            {g.items.map((x) => { const isRead = read.includes(x.id); return (
              <button key={x.id} onClick={() => { markRead(x.id); nav({ search: { id: x.id } }); }} className="grid w-full grid-cols-[8px_24%_minmax(0,1fr)_80px] items-center gap-3 border-b border-vc-line px-1 py-3 text-left text-[13px] hover:bg-vc-panel">
                <span className={`size-2 rounded-full ${isRead ? "" : "bg-vc-link"}`} />
                <span className="truncate"><span className="block text-[10px]">From</span>{x.from}</span>
                <span className={`min-w-0 ${isRead ? "text-foreground/80" : "font-semibold"}`}><span className="block text-[12px] font-normal text-muted-foreground">{x.list}</span>{x.subject}</span>
                <span className="text-right text-[12px] text-muted-foreground">{format(x.date, "MMM d")}</span>
              </button>); })}
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
