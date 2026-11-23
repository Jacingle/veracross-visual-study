import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Star, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AxAction, axInput } from "@/components/admin/AxiomDetail";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { useWorkspaces } from "@/lib/use-workspaces";
import { addSub, childrenOf, removeItem, removeWorkspace, renameWorkspace, setNotes, toggleFavorite, trail, type Workspace, type WsItem } from "@/lib/workspaces";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/workspaces")({
  validateSearch: z.object({ w: z.string().optional() }),
  head: () => pageHead("Axiom · Workspaces", "Personal and shared workspaces: saved bookmarks and reports."),
  component: Workspaces,
});

const tile = "relative flex min-h-[84px] items-end border border-vc-line bg-vc-tile-warm p-3 text-[16px] hover:bg-vc-tile-warm-hover";

function Workspaces() {
  const { w } = Route.useSearch();
  const ws = useWorkspaces();
  const cur = w ? ws.mine.find((x) => x.id === w) : undefined;
  const crumbs = cur ? trail(ws.all, cur.id) : [];
  return (
    <AxiomShell title={cur ? `Workspace: ${cur.name}` : "Workspaces"} crumbs={[]}>
      <div className="mx-auto max-w-[1240px] border border-vc-line bg-background">
        <div className="flex flex-wrap items-center gap-1 border-b border-vc-line bg-vc-panel px-4 py-2 text-[14px]"><Link to="/admin/workspaces" search={{}} className="text-vc-link-strong hover:underline">Workspaces</Link>{crumbs.map((c) => <span key={c.id} className="flex items-center gap-1">›{c.id === cur?.id ? <b>{c.name}</b> : <Link to="/admin/workspaces" search={{ w: c.id }} className="text-vc-link-strong hover:underline">{c.name}</Link>}</span>)}</div>
        {cur ? <Open key={cur.id} ws={cur} /> : (
          <div className="space-y-6 p-5">
            {(["personal", "shared"] as const).map((scope) => (
              <section key={scope} aria-label={`${scope} workspaces`}>
                <h2 className="mb-2 border-b border-dotted border-vc-gray-light pb-1 text-[22px] font-light uppercase">{scope === "personal" ? "Personal Workspaces" : "Shared Workspaces"}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{ws.mine.filter((x) => x.scope === scope && !x.parentId).map((x) => <Link key={x.id} to="/admin/workspaces" search={{ w: x.id }} className={tile}>{x.name}<span className="absolute right-2 top-2 text-[12px] text-vc-gray">{x.items.length} saved</span></Link>)}</div>
              </section>))}
          </div>)}
      </div>
    </AxiomShell>
  );
}

function Open({ ws: cur }: { ws: Workspace }) {
  const ws = useWorkspaces();
  const subs = childrenOf(ws.mine, cur.id);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [edit, setEdit] = useState(false);
  const [notes, setNotesText] = useState(cur.notes);
  const save = () => { if (!name.trim()) { toast.error("Enter a workspace name."); return; } ws.mutate((l) => addSub(l, cur.id, name, crypto.randomUUID())); setAdding(false); setName(""); toast.success("Workspace saved"); };
  const del = (x: Workspace) => { if (confirm(`Delete ${x.name}? Everything saved inside it is deleted too.`)) ws.mutate((l) => removeWorkspace(l, x.id)); };
  const list = (items: WsItem[], empty: string) => items.length ? (
    <ul>{items.map((i) => (
      <li key={i.id} className="group flex items-center gap-2 border-b border-vc-line px-2 py-2 hover:bg-vc-panel">
        <button type="button" aria-label={i.favorite ? `Remove ${i.title} from Favorites` : `Display ${i.title} in Favorites`} aria-pressed={i.favorite} onClick={() => ws.mutate((l) => toggleFavorite(l, cur.id, i.id))}><Star className={`size-4 ${i.favorite ? "fill-current text-vc-tile-warm-fg" : "text-vc-gray"}`} /></button>
        <a href={i.path} className="min-w-0 flex-1 truncate text-vc-link-strong hover:underline">{i.title}</a><span className="text-[11px] uppercase text-vc-gray">{i.kind}</span>
        <button type="button" aria-label={`Remove ${i.title}`} title="Remove" onClick={() => ws.mutate((l) => removeItem(l, cur.id, i.id))} className="invisible text-destructive group-hover:visible group-focus-within:visible"><X className="size-4" /></button>
      </li>))}</ul>
  ) : <p className="px-2 py-3 text-vc-gray">{empty}</p>;
  return (
    <div className="space-y-6 p-5">
      <section aria-label="Sub-workspaces">
        <div className="mb-2 flex items-center justify-between border-b border-dotted border-vc-gray-light pb-1"><h2 className="text-[22px] font-light uppercase">Workspaces</h2><div className="flex gap-2">{subs.length > 0 && <button type="button" aria-pressed={edit} onClick={() => setEdit((v) => !v)} className="h-[34px] border border-vc-gray-light/80 px-3 hover:bg-vc-panel">{edit ? "Done" : "Edit"}</button>}<AxAction onClick={() => setAdding(true)}>Add Workspace</AxAction></div></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {adding && <div className={`${tile} flex-col items-stretch justify-between gap-2`}><input autoFocus aria-label="Workspace name" className={axInput} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} /><AxAction onClick={save}>Save Workspace</AxAction></div>}
          {subs.map((x) => (
            <div key={x.id} className="relative">
              {edit ? <RenameTile x={x} onRename={(n) => ws.mutate((l) => renameWorkspace(l, x.id, n))} onDelete={() => del(x)} /> : <Link to="/admin/workspaces" search={{ w: x.id }} className={tile}>{x.name}</Link>}
            </div>))}
        </div>
        {!subs.length && !adding && <p className="py-2 text-vc-gray">No sub-workspaces yet.</p>}
      </section>
      <section aria-label="Queries"><h2 className="mb-1 border-b border-dotted border-vc-gray-light pb-1 text-[22px] font-light uppercase">Queries</h2>{list(cur.items.filter((i) => !i.record), "Nothing saved yet. Use the + (Organize) button on a screen to save a bookmark or report here.")}</section>
      <section aria-label="Records"><h2 className="mb-1 border-b border-dotted border-vc-gray-light pb-1 text-[22px] font-light uppercase">Records</h2>{list(cur.items.filter((i) => i.record), "No bookmarked records. Open a class or course and use + (Organize) to bookmark it.")}</section>
      <section aria-label="Notes"><h2 className="mb-1 border-b border-dotted border-vc-gray-light pb-1 text-[22px] font-light uppercase">Notes</h2><textarea aria-label="Workspace notes" className="h-28 w-full border border-vc-line p-2 outline-none focus:border-vc-link" value={notes} onChange={(e) => setNotesText(e.target.value)} onBlur={() => notes !== cur.notes && ws.mutate((l) => setNotes(l, cur.id, notes))} placeholder="Notes for this workspace" /></section>
    </div>
  );
}

function RenameTile({ x, onRename, onDelete }: { x: Workspace; onRename: (n: string) => void; onDelete: () => void }) {
  const [n, setN] = useState(x.name);
  return (
    <div className={`${tile} flex-col items-stretch justify-end gap-1`}>
      <button type="button" aria-label={`Delete ${x.name}`} title="Delete" onClick={onDelete} className="absolute right-1.5 top-1.5 text-destructive"><X className="size-5" /></button>
      <label className="flex items-center gap-1 text-[12px]"><Pencil className="size-3" />Name<input aria-label={`Rename ${x.name}`} className={axInput} value={n} maxLength={60} onChange={(e) => setN(e.target.value)} onBlur={() => n.trim() && n !== x.name && onRename(n)} /></label>
    </div>
  );
}
