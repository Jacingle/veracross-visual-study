// Workspaces: personal and shared folders of bookmarks and reports, like Axiom's. Pure functions over a flat list.
import { historyTag } from "./axiom-nav";

export type WsItem = { id: string; kind: "report" | "bookmark"; title: string; path: string; favorite: boolean; /** A bookmarked record (a class, course ...) rather than a query or page. */ record: boolean };
export type Workspace = { id: string; name: string; parentId: string | null; scope: "personal" | "shared"; ownerId?: string | undefined; notes: string; items: WsItem[] };

export const personalId = (userId: string) => `personal-${userId}`;
export const sharedId = (homepageId: string) => `shared-${homepageId}`;

/** Every person has a personal workspace and every homepage a shared one; they appear the first time they are needed. */
export function ensureWorkspaces(saved: Workspace[] | undefined, userId: string, pages: { id: string; title: string }[]): Workspace[] {
  const out = [...(saved ?? [])];
  const have = new Set(out.map((w) => w.id));
  if (userId && !have.has(personalId(userId))) out.push({ id: personalId(userId), name: "My Workspace", parentId: null, scope: "personal", ownerId: userId, notes: "", items: [] });
  for (const p of pages) if (!have.has(sharedId(p.id))) out.push({ id: sharedId(p.id), name: p.title, parentId: null, scope: "shared", notes: "", items: [] });
  return out;
}
export const visibleTo = (list: Workspace[], userId: string) => list.filter((w) => w.scope === "shared" || w.ownerId === userId);
export const childrenOf = (list: Workspace[], id: string | null) => list.filter((w) => w.parentId === id);
/** From the top-level workspace down to this one. */
export function trail(list: Workspace[], id: string): Workspace[] {
  const out: Workspace[] = [];
  for (let w = list.find((x) => x.id === id); w; w = w.parentId ? list.find((x) => x.id === w?.parentId) : undefined) out.unshift(w);
  return out;
}
const patch = (list: Workspace[], id: string, fn: (w: Workspace) => Workspace) => list.map((w) => (w.id === id ? fn(w) : w));

export const addSub = (list: Workspace[], parentId: string, name: string, id: string): Workspace[] => {
  const parent = list.find((w) => w.id === parentId);
  const clean = name.trim();
  return !parent || !clean ? list : [...list, { id, name: clean, parentId, scope: parent.scope, ownerId: parent.ownerId, notes: "", items: [] }];
};
export const renameWorkspace = (list: Workspace[], id: string, name: string) => (name.trim() ? patch(list, id, (w) => ({ ...w, name: name.trim() })) : list);
/** Deleting a sub-workspace deletes everything inside it. Top-level workspaces can't be deleted here. */
export function removeWorkspace(list: Workspace[], id: string): Workspace[] {
  if (!list.find((w) => w.id === id)?.parentId) return list;
  const gone = new Set([id]);
  for (let grew = true; grew; ) { grew = false; for (const w of list) if (w.parentId && gone.has(w.parentId) && !gone.has(w.id)) { gone.add(w.id); grew = true; } }
  return list.filter((w) => !gone.has(w.id));
}
export const setNotes = (list: Workspace[], id: string, notes: string) => patch(list, id, (w) => ({ ...w, notes }));
export const addItem = (list: Workspace[], id: string, item: Omit<WsItem, "record"> & { record?: boolean }): Workspace[] => patch(list, id, (w) => ({ ...w, items: [...w.items, { ...item, record: item.record ?? isRecordPath(item.path) }] }));
export const removeItem = (list: Workspace[], id: string, itemId: string) => patch(list, id, (w) => ({ ...w, items: w.items.filter((i) => i.id !== itemId) }));
export const toggleFavorite = (list: Workspace[], id: string, itemId: string) => patch(list, id, (w) => ({ ...w, items: w.items.map((i) => (i.id === itemId ? { ...i, favorite: !i.favorite } : i)) }));
export const isRecordPath = (path: string) => historyTag(path) === "Record";

/** What the Favorites panel lists: starred items, split into personal and shared, each under its workspace. */
export function favoritesOf(list: Workspace[], userId: string) {
  const mk = (scope: Workspace["scope"]) => visibleTo(list, userId).filter((w) => w.scope === scope).map((w) => ({ workspace: w, items: w.items.filter((i) => i.favorite) })).filter((g) => g.items.length);
  return { personal: mk("personal"), shared: mk("shared") };
}
