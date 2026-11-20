import { Link } from "@tanstack/react-router";
import { Plus, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/auth-rules";
import { buildAccounts, parseBatch } from "@/lib/batch-accounts";
import { useSchool } from "@/lib/school-store";
import { SCHOOL } from "@/lib/sis-data";

const iconBtn = "grid h-[34px] w-[46px] place-items-center border-l border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20";
const act = "block w-full px-0 py-1 text-left text-[16px] text-vc-link-strong hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline";

/** The + button in the Axiom toolbar: add a record from anywhere. */
export function AddMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><button type="button" aria-label="Add" title="Add" className={iconBtn}><Plus className="size-5" strokeWidth={3} /></button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px] text-[14px]">
        <DropdownMenuItem asChild><Link to="/admin/courses" search={{ add: "course" }}>Course</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/admin/courses">Class (pick a course, then + Class)</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/admin/users" search={{ add: "user" }}>Person / User Account</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/admin/scheduling">Scheduling Set</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/admin/assignment-types">Assignment Type</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The lightning-bolt button: batch tools for user accounts, as on the Veracross System homepage. */
export function ActionsMenu() {
  const { users, user: me, update } = useSchool();
  const [open, setOpen] = useState(false);
  const [batch, setBatch] = useState<Role | null>(null);
  const [text, setText] = useState("");
  const students = users.filter((u) => u.role === "student");
  const faculty = users.filter((u) => u.role === "teacher");
  const unsent = (r: Role) => users.filter((u) => u.role === r && u.active && !u.welcomeSent);
  const disabled = students.some((u) => u.loginDisabled);
  const old = users.filter((u) => !u.active && u.role !== "admin");
  const domain = (me?.email.split("@")[1] ?? SCHOOL.domain).toLowerCase();

  const welcome = (r: Role) => {
    const to = unsent(r);
    if (!to.length) { toast("Everyone already has a welcome email."); return; }
    const ids = new Set(to.map((u) => u.id));
    update((s) => ({ ...s, users: s.users.map((u) => (ids.has(u.id) ? { ...u, welcomeSent: true } : u)), sent: [{ id: `m-${crypto.randomUUID().slice(0, 8)}`, from: me?.email ?? "administrator", list: r === "student" ? "Student accounts" : "Faculty accounts", subject: "Welcome to the portal", body: `Your portal account is ready. Your username is your school email address. For safety, passwords are never sent by email; ask the school office if you need one. Sent to: ${to.map((u) => u.email).join(", ")}`, date: new Date().toISOString(), audience: r === "student" ? "students" : "faculty" }, ...s.sent] }));
    toast.success(`Welcome email sent to ${to.length} ${r === "student" ? "student" : "faculty"} ${to.length === 1 ? "account" : "accounts"}`);
  };
  const toggleStudents = () => {
    update((s) => ({ ...s, users: s.users.map((u) => (u.role === "student" ? { ...u, loginDisabled: !disabled } : u)) }));
    toast.success(disabled ? "Student portal logins re-enabled" : "Student portal logins disabled");
  };
  const removeOld = () => {
    if (!old.length) { toast("No old accounts to remove."); return; }
    if (!confirm(`Remove ${old.length} inactive ${old.length === 1 ? "account" : "accounts"}? This can't be undone.`)) return;
    update((s) => ({ ...s, users: s.users.filter((u) => u.active || u.role === "admin") }));
    toast.success(`${old.length} old ${old.length === 1 ? "account" : "accounts"} removed`);
  };
  const rows = batch ? parseBatch(text, batch) : [];
  const create = () => {
    if (!batch || !rows.length) { toast.error("Enter at least one person: first and last name, one per line."); return; }
    const made = buildAccounts(rows, batch, domain, users, () => crypto.randomUUID().slice(0, 8));
    update((s) => ({ ...s, users: [...s.users, ...made.map((m) => ({ id: `u-${crypto.randomUUID().slice(0, 8)}`, ...m }))] }));
    toast.success(`${made.length} ${batch === "student" ? "student" : "faculty"} ${made.length === 1 ? "account" : "accounts"} created. The password starts out the same as the username.`);
    setBatch(null); setText("");
  };
  const run = (fn: () => void) => () => { fn(); setOpen(false); };
  return (
    <>
      <button type="button" aria-label="Actions" title="Actions" className={iconBtn} onClick={() => setOpen(true)}><Zap className="size-5" fill="currentColor" /></button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-[560px] gap-0 overflow-y-auto rounded-none p-0">
          <DialogHeader className="px-6 pt-5"><DialogTitle className="border-b border-dotted border-vc-gray-light pb-2 text-[22px] font-normal">User Accounts</DialogTitle></DialogHeader>
          <div className="space-y-5 px-6 py-4">
            <div><Link to="/admin/users" onClick={() => setOpen(false)} className={act}>View All User Accounts</Link></div>
            <div>
              <button className={act} onClick={run(() => { setBatch("student"); setText(""); })}>Create Student Accounts</button>
              <button className={act} disabled={!unsent("student").length} onClick={run(() => welcome("student"))}>Send Student Welcome Emails ({unsent("student").length})</button>
              <Link to="/admin/users" search={{ role: "student" }} onClick={() => setOpen(false)} className={`${act} !text-muted-foreground`}>Review Student Accounts ({students.length})</Link>
            </div>
            <div>
              <button className={act} onClick={run(() => { setBatch("teacher"); setText(""); })}>Create Faculty Accounts</button>
              <button className={act} disabled={!unsent("teacher").length} onClick={run(() => welcome("teacher"))}>Send Faculty Welcome Emails ({unsent("teacher").length})</button>
              <Link to="/admin/users" search={{ role: "teacher" }} onClick={() => setOpen(false)} className={`${act} !text-muted-foreground`}>Review Faculty Accounts ({faculty.length})</Link>
            </div>
            <div>
              <button className={act} onClick={run(toggleStudents)}>{disabled ? "Re-Enable Student Portal Access" : "Disable Student Portal Access"}</button>
              <p className="text-[12px] text-muted-foreground">Often done in the summer, so students can't see schedules before they are final.</p>
            </div>
            <div><button className={act} onClick={run(removeOld)}>Remove Old User Accounts ({old.length})</button><p className="text-[12px] text-muted-foreground">Removes accounts that are marked inactive. Administrator accounts are never removed.</p></div>
          </div>
          <div className="flex justify-end border-t border-vc-line bg-vc-panel px-6 py-3"><Button variant="ghost" className="text-[18px] text-muted-foreground" onClick={() => setOpen(false)}>Close</Button></div>
        </DialogContent>
      </Dialog>
      <Dialog open={batch !== null} onOpenChange={(o) => { if (!o) setBatch(null); }}>
        <DialogContent className="max-w-[560px] rounded-none text-[13px]">
          <DialogHeader><DialogTitle className="text-[18px]">Create {batch === "student" ? "Student" : "Faculty"} Accounts</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">One person per line: {batch === "student" ? "First Last, grade (for example: Ada Lovelace, 9)" : "Prefix First Last (for example: Mrs. Grace Hopper)"}. Usernames become first.last@{domain}; the password starts out the same as the username.</p>
          <textarea aria-label="People to create" className="h-40 w-full border border-vc-line p-2 font-mono text-[13px] outline-none focus:border-vc-link" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex items-center justify-between"><span className="text-muted-foreground">{rows.length} {rows.length === 1 ? "account" : "accounts"} ready</span><div className="flex gap-2"><Button variant="outline" onClick={() => setBatch(null)}>Cancel</Button><Button onClick={create} className="bg-ax-go text-primary-foreground hover:bg-ax-go/90">Create Accounts</Button></div></div>
        </DialogContent>
      </Dialog>
    </>
  );
}
