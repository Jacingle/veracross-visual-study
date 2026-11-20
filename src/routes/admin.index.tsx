import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ChevronDown, BookOpen, ClipboardList, Image, Clock, Search, Mail, Palette, Receipt, UserPlus, Users } from "lucide-react";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { STUDENTS, TEACHERS } from "@/lib/sis-data";
import { ROLE_LABEL } from "@/lib/auth-rules";
import { useSchool } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/")({
  head: () => pageHead("Axiom · System Administrator", "Administration homepage for users, courses, portals and communications."),
  component: AdminHome,
});

const TILES = [
  { group: "Users & Security", items: [{ to: "/admin/users", label: "Users", icon: Users }, { to: "/admin/queries", label: "Find People", icon: Search }] },
  { group: "Scheduling", items: [{ to: "/admin/terms", label: "School Years & Terms", icon: Clock }, { to: "/admin/scheduling", label: "Scheduling Sets", icon: Clock }, { to: "/admin/queries", label: "Find Classes", icon: Search }] },
  { group: "Academics", items: [{ to: "/admin/courses", label: "Course Setup", icon: BookOpen }, { to: "/admin/courses", label: "Class Enrollments", icon: ClipboardList }, { to: "/admin/assignment-types", label: "Assignment Types", icon: Palette }] },
  { group: "Portals", items: [{ to: "/admin/settings", label: "Portal Settings", icon: Palette }, { to: "/admin/settings", label: "Backgrounds", icon: Image }] },
  { group: "Communications & Business", items: [{ to: "/admin/messages", label: "Send a Message", icon: Mail }, { to: "/admin/purchases", label: "Purchase Approvals", icon: Receipt }] },
] as const;

/** The green ADD button on the System homepage: hover (or focus) to choose what to add. */
function AddMenu() {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button className="h-8 rounded-none bg-ax-go font-semibold uppercase text-primary-foreground">Add<ChevronDown className="size-3" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
    <DropdownMenuItem asChild><Link to="/admin/courses" search={{ add: 'course' }}>Course</Link></DropdownMenuItem>
    <DropdownMenuItem asChild><Link to="/admin/courses">Class / Registration</Link></DropdownMenuItem>
    <DropdownMenuItem asChild><Link to="/admin/users" search={{ add: 'user' }}>Person / Account</Link></DropdownMenuItem>
    <DropdownMenuItem asChild><Link to="/admin/scheduling">Scheduling Set</Link></DropdownMenuItem>
    <DropdownMenuItem asChild><Link to="/admin/assignment-types">Assignment Type</Link></DropdownMenuItem>
  </DropdownMenuContent></DropdownMenu>;
}

function AdminHome() {
  const { users, purchases, sent, sections } = useSchool();
  const [filter, setFilter] = useState("");
  const pending = purchases.filter((p) => p.status === "Pending").length;
  return (
    <AxiomShell title="System Administrator Homepage" actions={<AddMenu />}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><Input aria-label="Find a task" placeholder="Find a task…" value={filter} onChange={(e) => setFilter(e.target.value)} className="h-8 max-w-80 bg-background text-[13px]" /><Button asChild size="sm" className="h-8 bg-ax-go text-primary-foreground"><Link to="/admin/queries">Find Records</Link></Button></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Portal Accounts", users.length], ["Students", users.filter((u) => u.role === "student").length], ["Faculty & Staff", users.filter((u) => u.role === "teacher").length], ["Class Sections", sections.length]].map(([l, n]) => (
          <div key={l} className="border border-vc-line bg-background px-3 py-2.5"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div><div className="text-[26px] font-light text-ax-top">{n}</div></div>))}
      </div>
      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TILES.filter((g) => `${g.group} ${g.items.map((i) => i.label).join(" ")}`.toLowerCase().includes(filter.toLowerCase())).map((g) => (
            <Panel key={g.group} title={g.group}>
              <div className="space-y-0.5">{g.items.map(({ to, label, icon: Icon }) => (
                <Link key={label} to={to} className="flex min-h-8 items-center gap-2 border-b border-vc-line px-1 py-1 text-vc-link-strong last:border-0 hover:bg-vc-panel"><Icon className="size-4" />{label}</Link>))}</div>
            </Panel>))}
        </div>
        <div className="space-y-3">
          <Panel title="Accounts by Role" right={<Link to="/admin/users" className="font-normal text-vc-link-strong">View all</Link>}>
            {(["admin", "teacher", "student"] as const).map((r) => <div key={r} className="flex justify-between border-b border-vc-line py-1 last:border-0"><span>{ROLE_LABEL[r]}</span><b>{users.filter((u) => u.role === r).length}</b></div>)}
          </Panel>
          <Panel title="Needs Attention">
            <Link to="/admin/purchases" className="flex justify-between py-1 hover:underline"><span>Pending purchase requests</span><b className={pending ? "text-destructive" : ""}>{pending}</b></Link>
            <Link to="/admin/queries" search={{ source: "people", status: "inactive" }} className="flex justify-between py-1 hover:underline"><span>Inactive accounts</span><b>{users.filter((u) => !u.active).length}</b></Link><Link to="/admin/queries" search={{ source: "classes", status: "draft" }} className="flex justify-between py-1 hover:underline"><span>Unpublished classes</span><b>{sections.filter((c) => !c.published).length}</b></Link>
          </Panel>
          <Panel title="Recent Messages Sent" right={<Link to="/admin/messages" className="font-normal text-vc-link-strong">Compose</Link>}>
            {sent.length === 0 ? <p className="text-muted-foreground">No messages sent yet.</p> : sent.slice(0, 4).map((m) => <div key={m.id} className="border-b border-vc-line py-1 last:border-0"><div className="truncate">{m.subject}</div><div className="text-[11px] text-muted-foreground">{format(parseISO(m.date), "MMM d")} · to {m.audience}</div></div>)}
          </Panel>
        </div>
      </div>
    </AxiomShell>
  );
}
