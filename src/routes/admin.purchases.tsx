import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { useSchool, type Purchase } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/purchases")({
  head: () => pageHead("Axiom · Purchase Approvals", "Review and approve faculty purchase requests."),
  component: Approvals,
});

function Approvals() {
  const { purchases, update } = useSchool();
  const set = (id: string, status: Purchase["status"]) => { update((s) => ({ ...s, purchases: s.purchases.map((p) => (p.id === id ? { ...p, status } : p)) })); toast.success(`Request ${status.toLowerCase()}`); };
  return (
    <AxiomShell title="Purchase Approvals">
      <div className="border border-vc-line bg-background">
        <table className="w-full">
          <thead><tr className="border-b border-vc-line bg-ax-head text-left text-[11px] uppercase text-muted-foreground"><th className="px-3 py-1.5">Date</th><th>Requested By</th><th>Item</th><th>Vendor</th><th>Reason</th><th className="text-right">Amount</th><th className="pl-4">Status</th><th className="pr-3" /></tr></thead>
          <tbody>{purchases.map((p) => (
            <tr key={p.id} className="border-b border-vc-line">
              <td className="px-3 py-1.5">{format(parseISO(p.date), "MMM d")}</td><td>{p.by}</td><td>{p.item}</td><td>{p.vendor}</td><td className="max-w-[240px] truncate" title={p.reason}>{p.reason}</td>
              <td className="text-right">${p.amount.toFixed(2)}</td>
              <td className={`pl-4 font-semibold ${p.status === "Approved" ? "text-vc-success" : p.status === "Denied" ? "text-destructive" : "text-vc-tile-warm-fg"}`}>{p.status}</td>
              <td className="space-x-1 pr-3 text-right">{p.status === "Pending" ? <><button onClick={() => set(p.id, "Approved")} className="h-6 bg-ax-go px-2 text-primary-foreground">Approve</button><button onClick={() => set(p.id, "Denied")} className="h-6 border border-vc-line px-2">Deny</button></> : <button onClick={() => set(p.id, "Pending")} className="text-[11px] text-vc-link-strong">Reopen</button>}</td>
            </tr>))}
            {purchases.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">No purchase requests yet. Faculty submit them from the Faculty Portal.</td></tr>}</tbody>
        </table>
      </div>
    </AxiomShell>
  );
}
