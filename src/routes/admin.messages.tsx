import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { SCHOOL } from "@/lib/sis-data";
import { useSchool, type SentMessage } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/messages")({
  head: () => pageHead("Axiom · Communications", "Send announcements to students, faculty or the whole school."),
  component: Compose,
});

const schema = z.object({ subject: z.string().trim().min(1, "Add a subject").max(150), body: z.string().trim().min(1, "Write a message").max(5000) });

function Compose() {
  const { sent, update } = useSchool();
  const [f, setF] = useState<{ subject: string; body: string; audience: SentMessage["audience"]; from: string }>({ subject: "", body: "", audience: "everyone", from: SCHOOL.name });
  return (
    <AxiomShell title="Communications">
      <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-3">
        <Panel title="New Message">
          <form className="space-y-2.5" onSubmit={(e) => {
            e.preventDefault();
            const r = schema.safeParse(f); if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Check the message"); return; }
            update((s) => ({ ...s, sent: [{ id: `x-${crypto.randomUUID().slice(0, 8)}`, from: f.from.trim() || SCHOOL.name, list: "Group Distribution List", subject: r.data.subject, body: r.data.body, audience: f.audience, date: new Date().toISOString() }, ...s.sent] }));
            setF({ ...f, subject: "", body: "" }); toast.success("Message sent — it now appears in portal inboxes");
          }}>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">To<select value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value as SentMessage["audience"] })} className="mt-1 h-8 w-full border border-vc-line px-2 text-[13px] font-normal normal-case text-foreground">
                <option value="everyone">Everyone (students & faculty)</option><option value="students">All Students</option><option value="faculty">All Faculty & Staff</option></select></label>
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">From<input value={f.from} maxLength={80} onChange={(e) => setF({ ...f, from: e.target.value })} className="mt-1 h-8 w-full border border-vc-line px-2 text-[13px] font-normal normal-case text-foreground" /></label>
            </div>
            <label className="block text-[11px] font-semibold uppercase text-muted-foreground">Subject<input value={f.subject} maxLength={150} onChange={(e) => setF({ ...f, subject: e.target.value })} className="mt-1 h-8 w-full border border-vc-line px-2 text-[13px] font-normal normal-case text-foreground" /></label>
            <label className="block text-[11px] font-semibold uppercase text-muted-foreground">Message<textarea value={f.body} maxLength={5000} onChange={(e) => setF({ ...f, body: e.target.value })} className="mt-1 h-48 w-full border border-vc-line p-2 text-[13px] font-normal normal-case text-foreground" /></label>
            <div className="flex justify-end"><button className="h-8 bg-ax-go px-5 font-semibold text-primary-foreground">Send</button></div>
          </form>
        </Panel>
        <Panel title={`Sent (${sent.length})`}>
          {sent.length === 0 ? <p className="text-muted-foreground">Nothing sent yet.</p> : sent.filter((m) => m.audience !== "direct").map((m) => (
            <div key={m.id} className="border-b border-vc-line py-1.5 last:border-0"><div className="flex justify-between"><b className="truncate font-semibold">{m.subject}</b><button onClick={() => update((s) => ({ ...s, sent: s.sent.filter((x) => x.id !== m.id) }))} className="text-[11px] text-destructive">Recall</button></div>
              <div className="text-[11px] text-muted-foreground">{format(parseISO(m.date), "MMM d, h:mm a")} · to {m.audience}</div></div>))}
        </Panel>
      </div>
    </AxiomShell>
  );
}
