import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { BookOpen, ClipboardList, Image, Mail, Palette, Receipt, UserPlus, Users } from "lucide-react";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { ALL_SECTIONS, STUDENTS, TEACHERS } from "@/lib/sis-data";
import { ROLE_LABEL } from "@/lib/auth-rules";
import { useSchool } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/")({
  head: () => pageHead("Axiom · System Administrator", "Administration homepage for users, courses, portals and communications."),
  component: AdminHome,
});

const TILES = [
  { group: "Users & Security", items: [{ to: "/admin/users", label: "Users", icon: Users }, { to: "/admin/users", label: "Add a User", icon: UserPlus }] },
  { group: "Academics", items: [{ to: "/admin/courses", label: "Course Setup", icon: BookOpen }, { to: "/admin/courses", label: "Class Enrollments", icon: ClipboardList }] },
  { group: "Portals", items: [{ to: "/admin/settings", label: "Portal Settings", icon: Palette }, { to: "/admin/settings", label: "Backgrounds", icon: Image }] },
  { group: "Communications & Business", items: [{ to: "/admin/messages", label: "Send a Message", icon: Mail }, { to: "/admin/purchases", label: "Purchase Approvals", icon: Receipt }] },
] as const;

function AdminHome() {
  const { users, purchases, sent } = useSchool();
  const pending = purchases.filter((p) => p.status === "Pending").length;
  return (
    <AxiomShell title="System Administrator Homepage">
      <div className="grid grid-cols-4 gap-3">
        {[["Portal Accounts", users.length], ["Students", STUDENTS.length + 1], ["Faculty & Staff", TEACHERS.length], ["Class Sections", ALL_SECTIONS.length]].map(([l, n]) => (
          <div key={l} className="border border-vc-line bg-background px-3 py-2.5"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div><div className="text-[26px] font-light text-ax-top">{n}</div></div>))}
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_340px] gap-3">
        <div className="grid grid-cols-2 gap-3">
          {TILES.map((g) => (
            <Panel key={g.group} title={g.group}>
              <div className="grid grid-cols-2 gap-2">{g.items.map(({ to, label, icon: Icon }) => (
                <Link key={label} to={to} className="flex h-[70px] flex-col items-center justify-center gap-1.5 border border-vc-line bg-vc-sky text-ax-top hover:bg-vc-select"><Icon className="size-5" />{label}</Link>))}</div>
            </Panel>))}
        </div>
        <div className="space-y-3">
          <Panel title="Accounts by Role" right={<Link to="/admin/users" className="font-normal text-vc-link-strong">View all</Link>}>
            {(["admin", "teacher", "student"] as const).map((r) => <div key={r} className="flex justify-between border-b border-vc-line py-1 last:border-0"><span>{ROLE_LABEL[r]}</span><b>{users.filter((u) => u.role === r).length}</b></div>)}
          </Panel>
          <Panel title="Needs Attention">
            <Link to="/admin/purchases" className="flex justify-between py-1 hover:underline"><span>Pending purchase requests</span><b className={pending ? "text-destructive" : ""}>{pending}</b></Link>
            <div className="flex justify-between py-1"><span>Inactive accounts</span><b>{users.filter((u) => !u.active).length}</b></div>
          </Panel>
          <Panel title="Recent Messages Sent" right={<Link to="/admin/messages" className="font-normal text-vc-link-strong">Compose</Link>}>
            {sent.length === 0 ? <p className="text-muted-foreground">No messages sent yet.</p> : sent.slice(0, 4).map((m) => <div key={m.id} className="border-b border-vc-line py-1 last:border-0"><div className="truncate">{m.subject}</div><div className="text-[11px] text-muted-foreground">{format(parseISO(m.date), "MMM d")} · to {m.audience}</div></div>)}
          </Panel>
        </div>
      </div>
    </AxiomShell>
  );
}
