import { Link, useRouterState } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { iconBtn } from "@/components/admin/AdminTools";
import { AxAction, AxToggle, axInput } from "@/components/admin/AxiomDetail";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { sharedId } from "@/lib/workspaces";
import { addItem, childrenOf, personalId, type Workspace } from "@/lib/workspaces";
import { useWorkspaces } from "@/lib/use-workspaces";

type Mode = { scope: "personal" | "shared"; kind: "bookmark" | "report" };
const flatten = (list: Workspace[], scope: Workspace["scope"], parent: string | null = null, depth = 0): { w: Workspace; depth: number }[] =>
  childrenOf(list, parent).filter((w) => w.scope === scope).flatMap((w) => [{ w, depth }, ...flatten(list, scope, w.id, depth + 1)]);

/** The + button in the Launchpad bar: save this screen as a bookmark (a link) or, on queries, a report (a copy) in a personal or shared workspace. */
export function OrganizeMenu({ title }: { title: string }) {
  const href = useRouterState({ select: (r) => r.location.href });
  const [mode, setMode] = useState<Mode | null>(null);
  const isQuery = href.startsWith("/admin/queries");
  const items: Mode[] = [{ scope: "personal", kind: "bookmark" }, { scope: "shared", kind: "bookmark" }, ...(isQuery ? ([{ scope: "personal", kind: "report" }, { scope: "shared", kind: "report" }] as Mode[]) : [])];
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><button type="button" aria-label="Organize" title="Organize" className={iconBtn}><Plus className="size-5" strokeWidth={3} /></button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[220px] text-[14px]">
          {items.map((m) => <DropdownMenuItem key={`${m.scope}${m.kind}`} onSelect={() => setMode(m)}>New {m.scope === "personal" ? "Personal" : "Shared"} {m.kind === "report" ? "Report" : "Bookmark"}</DropdownMenuItem>)}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/admin/workspaces">Open Workspaces</Link></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {mode && <SaveDialog key={`${mode.scope}${mode.kind}`} mode={mode} title={title} href={href} onClose={() => setMode(null)} />}
    </>
  );
}

function SaveDialog({ mode, title, href, onClose }: { mode: Mode; title: string; href: string; onClose: () => void }) {
  const ws = useWorkspaces();
  const choices = flatten(ws.mine, mode.scope);
  const [name, setName] = useState(title);
  const [target, setTarget] = useState(mode.scope === "personal" ? personalId(ws.uid) : sharedId("system"));
  const [fav, setFav] = useState(false);
  const noun = `${mode.scope === "personal" ? "Personal" : "Shared"} ${mode.kind === "report" ? "Report" : "Bookmark"}`;
  const create = () => {
    if (!name.trim()) { toast.error("Enter a description."); return; }
    ws.mutate((l) => addItem(l, target, { id: crypto.randomUUID(), kind: mode.kind, title: name.trim(), path: href, favorite: fav }));
    toast.success(`${noun} saved${fav ? " and added to Favorites" : ""}`);
    onClose();
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[520px] rounded-none text-[13px]">
        <DialogHeader><DialogTitle className="border-b border-dotted border-vc-gray-light pb-2 text-[22px] font-normal">New {noun}</DialogTitle><DialogDescription className="sr-only">Choose a name and the workspace to save this screen in.</DialogDescription></DialogHeader>
        <label className="block"><span className="font-bold uppercase">Description</span><input aria-label="Description" className={`${axInput} mt-1`} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></label>
        <fieldset><legend className="font-bold uppercase">Workspace</legend>
          <ul className="mt-1 max-h-48 overflow-y-auto border border-vc-line">{choices.map(({ w, depth }) => <li key={w.id}><label className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-vc-panel" style={{ paddingLeft: 8 + depth * 18 }}><input type="radio" name="workspace" checked={target === w.id} onChange={() => setTarget(w.id)} />{w.name}</label></li>)}</ul>
        </fieldset>
        <div className="flex items-center gap-3"><span className="font-bold uppercase">Display in Favorites</span><AxToggle label="Display in Favorites" on={fav} onChange={setFav} /></div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="h-[34px] border border-vc-gray-light/80 px-4 hover:bg-vc-panel">Cancel</button><AxAction onClick={create}>Create {noun}</AxAction></div>
      </DialogContent>
    </Dialog>
  );
}
