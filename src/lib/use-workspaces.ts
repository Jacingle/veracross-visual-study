import { useMemo } from "react";
import { ALL_HOMEPAGES } from "./admin-homepages";
import { useSchool } from "./school-store";
import { ensureWorkspaces, visibleTo, type Workspace } from "./workspaces";

const PAGES = ALL_HOMEPAGES.map((h) => ({ id: h.id, title: h.title }));
/** The signed-in administrator's workspaces: their personal one and every shared one, saved with the school records. */
export function useWorkspaces() {
  const { workspaces, user, update } = useSchool();
  const uid = user?.id ?? "";
  const all = useMemo(() => ensureWorkspaces(workspaces, uid, PAGES), [workspaces, uid]);
  const mine = useMemo(() => visibleTo(all, uid), [all, uid]);
  const mutate = (fn: (list: Workspace[]) => Workspace[]) => update((s) => ({ ...s, workspaces: fn(ensureWorkspaces(s.workspaces, uid, PAGES)) }));
  return { all, mine, uid, mutate };
}
