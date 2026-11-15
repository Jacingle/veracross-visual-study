import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useState } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { MESSAGES } from "@/lib/sis-data";
import { usePortal } from "@/lib/portal-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/messages")({
  head: () => pageHead("Messages", "Messages from teachers and school offices."),
  component: Messages,
});

function Messages() {
  const { read, markRead } = usePortal();
  const [sel, setSel] = useState<string | null>(null);
  const m = MESSAGES.find((x) => x.id === sel);
  return (
    <PortalShell>
      <div className="border-b border-vc-line px-5 py-5 text-[22px]">Messages</div>
      <div className="grid min-h-[480px] grid-cols-[380px_1fr]">
        <ul className="border-r border-vc-line">{MESSAGES.map((x) => (
          <li key={x.id}><button onClick={() => { setSel(x.id); markRead(x.id); }} className={`w-full border-b border-vc-line px-4 py-3 text-left ${sel === x.id ? "bg-vc-tile" : "hover:bg-vc-panel"}`}>
            <div className="flex justify-between text-sm"><span className={read.includes(x.id) ? "" : "font-bold"}>{x.from}</span><span className="text-muted-foreground">{format(x.date, "MMM d")}</span></div>
            <div className={`truncate ${read.includes(x.id) ? "text-muted-foreground" : "font-semibold text-vc-link-strong"}`}>{x.subject}</div>
          </button></li>))}</ul>
        <div className="p-8">{m ? <><h2 className="text-[24px]">{m.subject}</h2><div className="mb-6 text-sm text-muted-foreground">From {m.from} · {format(m.date, "EEEE, MMM d")}</div><p className="text-[17px]">{m.body}</p></>
          : <p className="pt-20 text-center text-muted-foreground">Select a message to read it.</p>}</div>
      </div>
    </PortalShell>
  );
}
