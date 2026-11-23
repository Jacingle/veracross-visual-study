import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { HomepageView } from "@/components/admin/HomepageView";
import { SYSTEM_PAGE } from "@/lib/admin-homepages";
import { useSchool } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/")({
  head: () => pageHead("Axiom · System Administrator", "Administration homepage for users, courses, portals and communications."),
  component: AdminHome,
});

/** The Main homepage everyone lands on: counters, every area's links, and a Query Tile of the latest messages. */
function AdminHome() {
  const { sent } = useSchool();
  const recent = (
    <section aria-label="Recent Messages Sent" className="min-h-[200px] border border-vc-line border-t-2 border-t-ax-panel bg-background">
      <h3 className="flex items-center justify-between bg-vc-panel px-4 py-2 text-[17px] font-light">Recent Messages Sent<Link to="/admin/messages" className="text-[13px] text-vc-link-strong hover:underline">Compose</Link></h3>
      <div className="px-4 py-3">{sent.length === 0 ? <p className="text-muted-foreground">No messages sent yet.</p> : sent.slice(0, 4).map((m) => <div key={m.id} className="border-b border-vc-line py-1 last:border-0"><div className="truncate">{m.subject}</div><div className="text-[11px] text-muted-foreground">{format(parseISO(m.date), "MMM d")} · to {m.audience}</div></div>)}</div>
    </section>
  );
  return <AxiomShell title="System Administrator Homepage"><HomepageView page={SYSTEM_PAGE} extra={recent} /></AxiomShell>;
}
