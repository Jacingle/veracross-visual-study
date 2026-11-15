import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Store = {
  read: string[]; markRead: (id: string) => void;
  done: string[]; toggleDone: (id: string) => void;
  links: { label: string; url: string }[]; addLink: (l: { label: string; url: string }) => void; removeLink: (url: string) => void;
};
const Ctx = createContext<Store | null>(null);
const KEY = "cra-portal-v1";

export function PortalStoreProvider({ children }: { children: ReactNode }) {
  const [read, setRead] = useState<string[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem(KEY) || "{}"); setRead(v.read ?? []); setDone(v.done ?? []); setLinks(v.links ?? []); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify({ read, done, links })); }, [read, done, links, loaded]);
  return (
    <Ctx.Provider value={{
      read, markRead: (id) => setRead((r) => (r.includes(id) ? r : [...r, id])),
      done, toggleDone: (id) => setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id])),
      links, addLink: (l) => setLinks((x) => [...x, l]), removeLink: (url) => setLinks((x) => x.filter((y) => y.url !== url)),
    }}>{children}</Ctx.Provider>
  );
}
export const usePortal = () => { const c = useContext(Ctx); if (!c) throw new Error("PortalStoreProvider missing"); return c; };
