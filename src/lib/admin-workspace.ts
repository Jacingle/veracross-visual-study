import { useEffect, useState } from 'react';
type Entry = { title: string; path: string };
type Workspace = { favorites: Entry[]; history: Entry[] };
/** Per-administrator navigation preferences only; school records stay in the school store. */
export function useAdminWorkspace(userId: string | undefined) {
  const key = `cra-admin-workspace-${userId ?? 'none'}`;
  const [state, setState] = useState<Workspace>({ favorites: [], history: [] });
  const [ready, setReady] = useState(false);
  useEffect(() => { try { setState(JSON.parse(localStorage.getItem(key) ?? '{"favorites":[],"history":[]}')); } catch { setState({ favorites: [], history: [] }); } setReady(true); }, [key]);
  useEffect(() => { if (ready) { try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* preferences only */ } } }, [key, state, ready]);
  return { ...state, ready, visit: (entry: Entry) => setState((s) => ({ ...s, history: [entry, ...s.history.filter((e) => e.path !== entry.path)].slice(0, 25) })), toggleFavorite: (entry: Entry) => setState((s) => ({ ...s, favorites: s.favorites.some((e) => e.path === entry.path) ? s.favorites.filter((e) => e.path !== entry.path) : [...s.favorites, entry] })) };
}