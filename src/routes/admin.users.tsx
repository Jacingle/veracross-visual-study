import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, KeyRound, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { ImageCropper } from "@/components/common/ImageCropper";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { canImpersonate, homeFor, ROLE_LABEL, validateUser, type Role, type User } from "@/lib/auth-rules";
import { Button } from "@/components/ui/button";
import { TEACHERS, studentById, teacher } from "@/lib/sis-data";
import { useSchool } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/users")({
  validateSearch: z.object({ q: z.string().optional(), role: z.enum(["admin", "teacher", "student"]).optional() }),
  head: () => pageHead("Axiom · Users & Security", "Create portal accounts, set passwords and roles, and deactivate users."),
  component: UsersPage,
});

const inp = "h-8 w-full border border-vc-line px-2 text-[13px] outline-none focus:border-vc-link";
type Draft = Omit<User, "id">;
const blank: Draft = { email: "", password: "", role: "student", first: "", last: "", personId: "new", active: true };

function UsersPage() {
  const { q = "", role } = Route.useSearch();
  const nav = useNavigate({ from: "/admin/users" });
  const { users, user: me, update, photos, impersonate } = useSchool();
  const [photoFor, setPhotoFor] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ id?: string; d: Draft } | null>(null);
  const shown = users.filter((u) => (!role || u.role === role) && `${u.first} ${u.last} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    const d = { ...edit.d, personId: edit.d.personId === "new" && edit.d.role !== "admin" ? `p-${crypto.randomUUID().slice(0, 8)}` : edit.d.personId === "new" ? "" : edit.d.personId, email: edit.d.email.trim().toLowerCase(), first: edit.d.first.trim(), last: edit.d.last.trim() };
    const err = validateUser(users, d, edit.id);
    if (err) { toast.error(err); return; }
    if (edit.id === me?.id && d.role !== "admin") { toast.error("You can't remove your own administrator role."); return; }
    update((s) => ({ ...s, users: edit.id ? s.users.map((u) => (u.id === edit.id ? { ...u, ...d } : u)) : [...s.users, { id: `u-${crypto.randomUUID().slice(0, 8)}`, ...d }] }));
    toast.success(edit.id ? "User updated" : `Account created for ${d.email}`); setEdit(null);
  };
  return (
    <AxiomShell title="Users & Security" actions={<button onClick={() => setEdit({ d: { ...blank } })} className="flex h-7 items-center gap-1 bg-ax-go px-3 font-semibold text-primary-foreground"><Plus className="size-4" />Add User</button>}>
      <div className="border border-vc-line bg-background">
        <div className="flex items-center gap-3 border-b border-vc-line bg-ax-head px-3 py-2">
          <input aria-label="Filter users" value={q} onChange={(e) => nav({ search: (p) => ({ ...p, q: e.target.value || undefined }), replace: true })} placeholder="Filter by name or username" className="h-7 w-72 border border-vc-line bg-background px-2" />
          <select aria-label="Role" value={role ?? ""} onChange={(e) => nav({ search: (p) => ({ ...p, role: (e.target.value || undefined) as Role | undefined }) })} className="h-7 border border-vc-line bg-background px-2">
            <option value="">All roles</option>{(["admin", "teacher", "student"] as const).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
          <span className="ml-auto text-muted-foreground">{shown.length} of {users.length} accounts</span>
        </div>
        <table className="w-full">
          <thead><tr className="border-b border-vc-line text-left text-[11px] uppercase text-muted-foreground"><th className="px-3 py-1.5">Name</th><th>Username</th><th>Role</th><th>Linked Record</th><th>Status</th><th className="pr-3 text-right">Actions</th></tr></thead>
          <tbody>{shown.map((u) => (
            <tr key={u.id} className="border-b border-vc-line hover:bg-vc-panel">
              <td className="px-3 py-1.5">{u.last}, {u.first}{u.id === me?.id && <span className="ml-1.5 text-[10px] text-muted-foreground">(you)</span>}</td>
              <td className="font-mono text-[12px]">{u.email}</td>
              <td><span className={`px-1.5 py-px text-[10px] font-semibold text-primary-foreground ${u.role === "admin" ? "bg-ax-top" : u.role === "teacher" ? "bg-vc-success" : "bg-vc-badge"}`}>{ROLE_LABEL[u.role].toUpperCase()}</span></td>
              <td className="text-muted-foreground"><span className="flex items-center gap-2">{u.personId && photos[u.personId] && <img src={photos[u.personId]} alt="" className="h-7 w-[21px] object-cover" />}{u.role === "teacher" && u.personId ? `${teacher(u.personId).prefix} ${teacher(u.personId).first} ${teacher(u.personId).last}` : u.role === "student" && studentById(u.personId) ? `${studentById(u.personId)!.first} ${studentById(u.personId)!.last} (Grade ${studentById(u.personId)!.grade})` : "—"}</span></td>
              <td><Switch aria-label={`Active: ${u.email}`} checked={u.active} disabled={u.id === me?.id} onCheckedChange={(on) => { update((s) => ({ ...s, users: s.users.map((x) => (x.id === u.id ? { ...x, active: on } : x)) })); toast(on ? "Account activated" : "Account deactivated — they can no longer log in"); }} /></td>
              <td className="pr-3 text-right">
                {canImpersonate(me, u) && <Button variant="ghost" size="icon" className="size-7" title="Log in as this user" aria-label={`Impersonate ${u.email}`} onClick={() => { if (impersonate(u.id)) nav({ to: homeFor(u.role) }); }}><UserRound className="size-4" /></Button>}
                <button aria-label={`Edit ${u.email}`} onClick={() => setEdit({ id: u.id, d: { ...u } })} className="p-1 text-vc-link-strong"><Pencil className="size-4" /></button>
                {u.personId && <button aria-label={`Photo for ${u.email}`} onClick={() => setPhotoFor(u.personId)} className="p-1 text-vc-link-strong"><Camera className="size-4" /></button>}
                <button aria-label={`Reset password for ${u.email}`} onClick={() => { update((s) => ({ ...s, users: s.users.map((x) => (x.id === u.id ? { ...x, password: x.email } : x)) })); toast.success("Password reset to the username"); }} className="p-1 text-vc-link-strong"><KeyRound className="size-4" /></button>
                <button aria-label={`Delete ${u.email}`} disabled={u.id === me?.id} onClick={() => { if (confirm(`Delete ${u.email}?`)) { update((s) => ({ ...s, users: s.users.filter((x) => x.id !== u.id) })); toast("User deleted"); } }} className="p-1 text-destructive disabled:opacity-30"><Trash2 className="size-4" /></button>
              </td>
            </tr>))}</tbody>
        </table>
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] max-w-[580px] overflow-y-auto text-[13px]">
          <DialogHeader><DialogTitle className="text-[17px]">{edit?.id ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
          {edit && <form onSubmit={save} className="space-y-2.5 text-[12px] text-muted-foreground">
            <div className="grid grid-cols-2 gap-3">
              <label>FIRST NAME<input className={inp} value={edit.d.first} maxLength={40} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, first: e.target.value } })} /></label>
              <label>LAST NAME<input className={inp} value={edit.d.last} maxLength={40} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, last: e.target.value } })} /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([['prefix', 'PREFIX'], ['suffix', 'SUFFIX'], ['middle', 'MIDDLE NAME'], ['preferred', 'PREFERRED NAME'], ['address', 'STREET ADDRESS'], ['city', 'CITY'], ['state', 'STATE / PROVINCE'], ['postal', 'POSTAL CODE'], ['phone', 'PHONE']] as const).map(([key, label]) => <label key={key}>{label}<input className={inp} value={edit.d[key] ?? ''} maxLength={160} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, [key]: e.target.value } })} /></label>)}
              {edit.d.role === 'student' && <label>GRADE LEVEL<select className={inp} value={edit.d.grade ?? 9} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, grade: Number(e.target.value) } })}>{Array.from({ length: 13 }, (_, grade) => <option key={grade} value={grade}>{grade === 0 ? 'Kindergarten' : grade}</option>)}</select></label>}
            </div>
            <label className="block">USERNAME (EMAIL)<input className={inp} value={edit.d.email} maxLength={120} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, email: e.target.value } })} /></label>
            <label className="block">PASSWORD<div className="flex gap-2"><input className={inp} value={edit.d.password} maxLength={120} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, password: e.target.value } })} />
              <button type="button" onClick={() => setEdit({ ...edit, d: { ...edit.d, password: edit.d.email.trim().toLowerCase() } })} className="shrink-0 border border-vc-line px-2 text-foreground">Same as username</button></div></label>
            <div className="grid grid-cols-2 gap-3">
              <label>ROLE<select className={inp} value={edit.d.role} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, role: e.target.value as Role, personId: "new" } })}>{(["student", "teacher", "admin"] as const).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></label>
              {edit.d.role === "teacher" && <label>FACULTY RECORD<select className={inp} value={edit.d.personId} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, personId: e.target.value } })}><option value="new">+ New faculty record</option><option value="">— none —</option>{TEACHERS.map((t) => <option key={t.id} value={t.id}>{t.prefix} {t.first} {t.last}</option>)}{edit.d.personId.startsWith("p-") && <option value={edit.d.personId}>{edit.d.first} {edit.d.last} (own record)</option>}</select></label>}
              {edit.d.role === "student" && <label>STUDENT RECORD<select className={inp} value={edit.d.personId} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, personId: e.target.value } })}><option value="new">+ New student record</option><option value="">— none —</option><option value="me">Jack Ingle (Grade 9)</option>{edit.d.personId.startsWith("p-") && <option value={edit.d.personId}>{edit.d.first} {edit.d.last} (own record)</option>}</select></label>}
            </div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setEdit(null)} className="h-8 border border-vc-line px-3 text-foreground">Cancel</button><button className="h-8 bg-ax-go px-4 font-semibold text-primary-foreground">Save</button></div>
          </form>}
        </DialogContent>
      </Dialog>
      <ImageCropper open={!!photoFor} onClose={() => setPhotoFor(null)} aspect={3 / 4} outWidth={300} title="Directory Photo"
        onSave={(url) => { if (!photoFor) return; update((s) => ({ ...s, photos: { ...s.photos, [photoFor]: url } })); toast.success("Photo saved"); }} />
    </AxiomShell>
  );
}
