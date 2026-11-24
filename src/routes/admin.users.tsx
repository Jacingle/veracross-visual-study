import { PersonPhoto } from "@/components/common/PersonPhoto";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, KeyRound, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { ImageCropper } from "@/components/common/ImageCropper";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { PersonRecord } from "@/components/admin/PersonRecord";
import { Switch } from "@/components/ui/switch";
import { canImpersonate, homeFor, loginName, ROLE_LABEL, validateUser, type Role, type User } from "@/lib/auth-rules";
import { Button } from "@/components/ui/button";
import { useSchool } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/users")({
  validateSearch: z.object({ q: z.string().optional(), role: z.enum(["admin", "teacher", "student"]).optional(), add: z.enum(["user"]).optional() }),
  head: () => pageHead("Axiom · Users & Security", "Create portal accounts, set passwords and roles, and deactivate users."),
  component: UsersPage,
});

type Draft = Omit<User, "id">;
const blank: Draft = { email: "", username: "", password: "", role: "student", first: "", last: "", personId: "new", active: true };

function UsersPage() {
  const { q = "", role, add } = Route.useSearch();
  const nav = useNavigate({ from: "/admin/users" });
  const { users, user: me, update, photos, impersonate } = useSchool();
  const [photoFor, setPhotoFor] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ id?: string; d: Draft } | null>(null);
  const [pending, setPending] = useState<{ url: string; full: string } | null>(null);
  const [cropNew, setCropNew] = useState(false);
  useEffect(() => { if (add === "user") { setEdit({ d: { ...blank } }); nav({ search: (p) => ({ ...p, add: undefined }), replace: true }); } }, [add, nav]);
  const shown = users.filter((u) => (!role || u.role === role) && `${u.first} ${u.last} ${u.email} ${u.username ?? ""}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.last.localeCompare(b.last) || a.first.localeCompare(b.first));
  const save = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!edit) return;
    const d = { ...edit.d, personId: edit.d.personId === "new" ? `p-${crypto.randomUUID().slice(0, 8)}` : edit.d.personId, email: edit.d.email.trim().toLowerCase(), username: (edit.d.username ?? "").trim(), first: edit.d.first.trim(), last: edit.d.last.trim() };
    if (!d.username) { toast.error("Enter a username on Portal Access. It is separate from the email address."); return; }
    const err = validateUser(users, d, edit.id);
    if (err) { toast.error(err); return; }
    if (edit.id === me?.id && d.role !== "admin") { toast.error("You can't remove your own administrator role."); return; }
    update((s) => ({ ...s, users: edit.id ? s.users.map((u) => (u.id === edit.id ? { ...u, ...d } : u)) : [...s.users, { id: `u-${crypto.randomUUID().slice(0, 8)}`, ...d }], ...(pending && d.personId ? { photos: { ...s.photos, [d.personId]: pending.url }, fullPhotos: { ...s.fullPhotos, [d.personId]: pending.full } } : {}) }));
    toast.success(edit.id ? "User updated" : `Account created for ${d.username}`); setEdit(null); setPending(null);
  };
  if (edit) {
    const nm = `${edit.d.last.trim() || "New"}${edit.d.first.trim() ? `, ${edit.d.first.trim()}` : ""}`;
    const kind = ROLE_LABEL[edit.d.role];
    const title = edit.id ? `${kind} ${edit.d.personId.replace(/\D/g, "").slice(0, 5) || ""}: ${nm} - ${kind}${edit.d.role === "student" ? ` (${edit.d.grade ?? 9})` : ""}`.replace(" :", ":") : `New ${kind}: ${nm}`;
    return (
      <AxiomShell title={title} crumbs={[{ label: "Users & Security", to: "/admin/users" }]} onUpdate={() => save()} actions={<button type="button" onClick={() => { setEdit(null); setPending(null); }} className="h-[30px] border border-white/60 px-4 text-[13px] font-bold text-white">CANCEL</button>}>
        <PersonRecord d={edit.d} set={(p) => setEdit({ ...edit, d: { ...edit.d, ...p } })} photoUrl={pending?.url} onReplacePhoto={() => (edit.id && edit.d.personId && edit.d.personId !== "new" ? setPhotoFor(edit.d.personId) : setCropNew(true))} />
        <ImageCropper open={cropNew} onClose={() => setCropNew(false)} aspect={1} outWidth={300} title="Person Photo" onSave={(url, full) => { setPending({ url, full }); toast.success("Photo ready — it is saved with the record"); }} />
        <ImageCropper open={!!photoFor} onClose={() => setPhotoFor(null)} aspect={1} outWidth={300} title="Person Photo"
          onSave={(url, fullPhoto) => { if (!photoFor) return; update((s) => ({ ...s, photos: { ...s.photos, [photoFor]: url }, fullPhotos: { ...s.fullPhotos, [photoFor]: fullPhoto } })); toast.success("Photo saved"); }} />
      </AxiomShell>);
  }
  return (
    <AxiomShell title="Users & Security" actions={<button onClick={() => setEdit({ d: { ...blank } })} className="flex h-7 items-center gap-1 bg-ax-go px-3 font-semibold text-primary-foreground"><Plus className="size-4" />Add User</button>}>
      <div className="border border-vc-line bg-background">
        <div className="flex flex-wrap items-center gap-3 border-b border-vc-line bg-ax-head px-3 py-2">
          <input aria-label="Filter users" value={q} onChange={(e) => nav({ search: (p) => ({ ...p, q: e.target.value || undefined }), replace: true })} placeholder="Filter by name or username" className="h-7 w-full max-w-72 border border-vc-line bg-background px-2" />
          <select aria-label="Role" value={role ?? ""} onChange={(e) => nav({ search: (p) => ({ ...p, role: (e.target.value || undefined) as Role | undefined }) })} className="h-7 border border-vc-line bg-background px-2">
            <option value="">All roles</option>{(["admin", "teacher", "student"] as const).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
          <span className="ml-auto text-muted-foreground">{shown.length} of {users.length} accounts</span>
        </div>
        <div className="overflow-x-auto"><table className="admin-grid w-full min-w-[720px]">
          <thead><tr className="border-b border-vc-line text-left text-[11px] uppercase text-muted-foreground"><th className="px-3 py-1.5">Name</th><th>Username</th><th>Email</th><th>Role</th><th>Linked Record</th><th>Status</th><th className="pr-3 text-right">Actions</th></tr></thead>
          <tbody>{shown.map((u) => (
            <tr key={u.id} className="border-b border-vc-line hover:bg-vc-panel">
              <td className="px-3 py-1.5"><Button variant="link" className="h-auto p-0 text-[13px] text-vc-link-strong" onClick={() => setEdit({ id: u.id, d: { ...u, username: loginName(u) } })}>{u.last}, {u.first}</Button>{u.id === me?.id && <span className="ml-1.5 text-[10px] text-muted-foreground">(you)</span>}</td>
              <td className="font-mono text-[12px]">{loginName(u)}</td><td className="text-[12px]">{u.email}</td>
              <td><span className={`px-1.5 py-px text-[10px] font-semibold text-primary-foreground ${u.role === "admin" ? "bg-ax-top" : u.role === "teacher" ? "bg-vc-success" : "bg-vc-badge"}`}>{ROLE_LABEL[u.role].toUpperCase()}</span></td>
              <td className="text-muted-foreground"><span className="flex items-center gap-2"><PersonPhoto personId={u.personId} className="size-7" />{u.personId ? `${u.prefix ? `${u.prefix} ` : ""}${u.first} ${u.last}${u.role === "student" ? ` (Grade ${u.grade ?? 9})` : ""}` : "—"}</span></td>
              <td><Switch aria-label={`Active: ${loginName(u)}`} checked={u.active} disabled={u.id === me?.id} onCheckedChange={(on) => { update((s) => ({ ...s, users: s.users.map((x) => (x.id === u.id ? { ...x, active: on } : x)) })); toast(on ? "Account activated" : "Account deactivated — they can no longer log in"); }} /></td>
              <td className="pr-3 text-right">
                {canImpersonate(me, u) && <Button variant="ghost" size="icon" className="size-7" title="Log in as this user" aria-label={`Impersonate ${loginName(u)}`} onClick={() => { if (impersonate(u.id)) nav({ to: homeFor(u.role) }); }}><UserRound className="size-4" /></Button>}
                <button aria-label={`Edit ${loginName(u)}`} onClick={() => setEdit({ id: u.id, d: { ...u, username: loginName(u) } })} className="p-1 text-vc-link-strong"><Pencil className="size-4" /></button>
                {u.personId && <button aria-label={`Photo for ${loginName(u)}`} onClick={() => setPhotoFor(u.personId)} className="p-1 text-vc-link-strong"><Camera className="size-4" /></button>}
                <button aria-label={`Reset password for ${loginName(u)}`} onClick={() => { update((s) => ({ ...s, users: s.users.map((x) => (x.id === u.id ? { ...x, password: loginName(x) } : x)) })); toast.success("Password reset to the username"); }} className="p-1 text-vc-link-strong"><KeyRound className="size-4" /></button>
                <button aria-label={`Delete ${loginName(u)}`} disabled={u.id === me?.id} onClick={() => { if (confirm(`Delete ${loginName(u)}?`)) { update((s) => ({ ...s, users: s.users.filter((x) => x.id !== u.id) })); toast("User deleted"); } }} className="p-1 text-destructive disabled:opacity-30"><Trash2 className="size-4" /></button>
              </td>
            </tr>))}</tbody>
        </table></div>
      </div>
      <ImageCropper open={!!photoFor} onClose={() => setPhotoFor(null)} aspect={1} outWidth={300} title="Directory Photo"
        onSave={(url, fullPhoto) => { if (!photoFor) return; update((s) => ({ ...s, photos: { ...s.photos, [photoFor]: url }, fullPhotos: { ...s.fullPhotos, [photoFor]: fullPhoto } })); toast.success("Photo saved"); }} />
    </AxiomShell>
  );
}
