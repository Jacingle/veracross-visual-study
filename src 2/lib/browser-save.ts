/** Large cropped photos are kept in IndexedDB, avoiding localStorage's small quota. */
const open = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open("cra-saved-school", 1);
  request.onupgradeneeded = () => request.result.createObjectStore("state");
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
// The newest value handed to saveSchool while its write is still in flight. Reads return it, so a page that
// re-reads storage right after a change (route change, window focus) never gets the older copy back and
// overwrites the change: this is what made a just-added class disappear when its record page opened.
let queued: string | null = null;
let inFlight = 0;
export async function readSchool(): Promise<string | null> {
  if (inFlight > 0 && queued !== null) return queued;
  try {
    const db = await open();
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction("state", "readonly");
      const request = tx.objectStore("state").get("school");
      request.onsuccess = () => resolve(request.result ?? localStorage.getItem("cra-school-v2") ?? null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch { return localStorage.getItem("cra-school-v2"); }
}
let pending: Promise<void> = Promise.resolve();
export function saveSchool(value: string): Promise<void> {
  queued = value;
  inFlight++;
  const run = pending.catch(() => {}).then(async () => {
  let fallback = false;
  try { localStorage.setItem("cra-school-v2", value); fallback = true; } catch { /* IndexedDB handles larger photos. */ }
  try {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    tx.objectStore("state").put(value, "school");
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
  });
  } catch (error) { if (!fallback) throw error; }
  });
  pending = run.finally(() => { inFlight--; });
  return pending;
}
/** Resolves once every queued save has reached browser storage (used before a full page load). */
export const savesSettled = (): Promise<void> => pending.catch(() => {});
