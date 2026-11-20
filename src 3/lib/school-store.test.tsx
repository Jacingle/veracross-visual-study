import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The router is replaced by a settable pathname so a test can change page in the same React commit as a store update.
let path = "/admin/courses";
vi.mock("@tanstack/react-router", () => ({ useRouterState: ({ select }: { select: (r: { location: { pathname: string } }) => unknown }) => select({ location: { pathname: path } }) }));

// A small IndexedDB stand-in with real-browser timing: opening and each transaction take a moment, and transactions run in creation order.
function installFakeIndexedDb() {
  const data = new Map<string, unknown>();
  let chain: Promise<void> = Promise.resolve();
  const wait = () => new Promise<void>((r) => setTimeout(r, 5));
  (globalThis as { indexedDB?: unknown }).indexedDB = {
    open() {
      const req: { result?: unknown; error?: unknown; onsuccess?: () => void; onerror?: () => void; onupgradeneeded?: () => void } = {};
      const db = {
        createObjectStore() {},
        close() {},
        transaction(_store: string, mode: string) {
          const tx: { oncomplete?: () => void; onerror?: () => void; onabort?: () => void; error?: unknown; objectStore: () => unknown } = {
            objectStore: () => ({
              get(key: string) { const r: { result?: unknown; onsuccess?: () => void; onerror?: () => void } = {}; chain = chain.then(async () => { await wait(); r.result = data.get(key); r.onsuccess?.(); tx.oncomplete?.(); }); return r; },
              put(value: unknown, key: string) { chain = chain.then(async () => { await wait(); data.set(key, value); tx.oncomplete?.(); }); return {}; },
            }),
          };
          void mode;
          return tx;
        },
      };
      setTimeout(() => { req.result = db; req.onupgradeneeded?.(); req.onsuccess?.(); }, 1);
      return req;
    },
  };
  return data;
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const settle = (ms = 150) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });

describe("school store", () => {
  beforeEach(() => { localStorage.clear(); path = "/admin/courses"; installFakeIndexedDb(); vi.resetModules(); });
  afterEach(() => { delete (globalThis as { indexedDB?: unknown }).indexedDB; });

  it("keeps a class that is added in the same moment the page changes", async () => {
    const { SchoolStoreProvider, useSchool } = await import("./school-store");
    let api: ReturnType<typeof useSchool> | undefined;
    const Probe = () => { api = useSchool(); return null; };
    const ui = () => <SchoolStoreProvider><Probe /></SchoolStoreProvider>;
    const root = createRoot(document.body.appendChild(document.createElement("div")));
    act(() => { root.render(ui()); });
    await settle();
    expect(api?.ready).toBe(true);
    // Same as the "+ Class" button: add the class, then go to its record page.
    act(() => {
      api!.update((s) => ({ ...s, sections: [...s.sections, { id: "101-2", code: "101-2", name: "English", section: "2", teacherId: "", block: "", room: "", letter: "", pct: 0, type: "ACADEMIC", days: [], time: "", courseNo: "101", teacherIds: [], terms: ["2026-S1"], published: false, studentIds: [], website: { bg: "none", color: "#3a6ea5", photo: "", sections: [], pages: [] } }] }));
      path = "/admin/courses/101-2";
      root.render(ui());
    });
    await settle(300);
    expect(api?.sections.some((c) => c.id === "101-2")).toBe(true);
    act(() => root.unmount());
  });
});
