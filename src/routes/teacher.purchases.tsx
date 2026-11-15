import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PortalShell, PageTitle } from "@/components/portal/PortalShell";
import { isoDay, useSchool } from "@/lib/school-store";
import { today } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/teacher/purchases")({
  head: () => pageHead("Purchase Requests", "Submit and track classroom purchase requests."),
  component: Purchases,
});

const schema = z.object({ item: z.string().trim().min(1, "Item is required").max(120), vendor: z.string().trim().max(80), amount: z.number().positive("Amount must be more than $0").max(100000), reason: z.string().trim().min(1, "Add a reason").max(500) });
const inp = "h-8 w-full border border-vc-line px-2 text-[13px]";

function Purchases() {
  const { purchases, update, user } = useSchool();
  const [f, setF] = useState({ item: "", vendor: "", amount: "", reason: "" });
  const mine = purchases.filter((p) => p.by === user?.email);
  return (
    <PortalShell portal="teacher" area="teacher">
      <PageTitle>Purchase Requests</PageTitle>
      <div className="grid grid-cols-[320px_minmax(0,1fr)] gap-6 px-4 py-4">
        <form className="space-y-2.5 bg-vc-panel p-3 text-[12px] text-muted-foreground" onSubmit={(e) => {
          e.preventDefault();
          const r = schema.safeParse({ ...f, amount: Number(f.amount) });
          if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Check the form"); return; }
          update((s) => ({ ...s, purchases: [{ id: crypto.randomUUID(), ...r.data, status: "Pending", date: isoDay(today()), by: user?.email ?? "" }, ...s.purchases] }));
          setF({ item: "", vendor: "", amount: "", reason: "" }); toast.success("Request sent to the Business Office");
        }}>
          <div className="text-[15px] text-foreground">New Request</div>
          <label className="block">ITEM<input className={inp} value={f.item} onChange={(e) => setF({ ...f, item: e.target.value })} /></label>
          <label className="block">VENDOR<input className={inp} value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} /></label>
          <label className="block">AMOUNT ($)<input className={inp} inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></label>
          <label className="block">REASON<textarea className="h-20 w-full border border-vc-line p-2 text-[13px]" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></label>
          <button className="h-8 w-full bg-vc-success text-[13px] font-semibold text-primary-foreground">Submit Request</button>
        </form>
        <table className="h-fit w-full text-[13px]">
          <thead><tr className="border-b-2 border-foreground/70 text-left text-[11px] uppercase text-muted-foreground"><th className="py-1.5">Date</th><th>Item</th><th>Vendor</th><th className="text-right">Amount</th><th className="pl-4">Status</th></tr></thead>
          <tbody>{mine.map((p) => <tr key={p.id} className="border-b border-vc-line"><td className="py-2">{format(parseISO(p.date), "MMM d")}</td><td>{p.item}</td><td>{p.vendor}</td><td className="text-right">${p.amount.toFixed(2)}</td>
            <td className={`pl-4 font-semibold ${p.status === "Approved" ? "text-vc-success" : p.status === "Denied" ? "text-destructive" : "text-vc-tile-warm-fg"}`}>{p.status}</td></tr>)}
            {mine.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No requests yet.</td></tr>}</tbody>
        </table>
      </div>
    </PortalShell>
  );
}
