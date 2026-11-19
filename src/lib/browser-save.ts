/** Large cropped photos are kept in IndexedDB, avoiding localStorage's small quota. */
const open = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open("cra-saved-school", 1);
  request.onupgradeneeded = () => request.result.createObjectStore("state");
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
export async function readSchool(): Promise<string | null> {
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
  pending = pending.catch(() => {}).then(async () => {
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
  return pending;
}
/** Resolves once every queued save has reached browser storage (used before a full page load). */
export const savesSettled = (): Promise<void> => pending.catch(() => {});
