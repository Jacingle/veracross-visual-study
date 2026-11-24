// Pure helpers for creating user accounts in batch (the Axiom "Actions" menu). No storage, no React.
import type { Role, User } from "./auth-rules";
import { userExists } from "./auth-rules";

export type BatchRow = { first: string; last: string; grade?: number; prefix?: string };

/** One person per line: "First Last", "First Last, 9" (students) or "Mrs. First Last" (faculty). Blank lines are skipped. */
export function parseBatch(text: string, role: Role): BatchRow[] {
  const out: BatchRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const [namePart = "", gradePart] = line.split(/[,;\t]/).map((x) => x.trim());
    const words = namePart.split(/\s+/).filter(Boolean);
    let prefix: string | undefined;
    if (role === "teacher" && words.length > 2 && /^(mr|mrs|ms|miss|mx|dr|prof)\.?$/i.test(words[0]!)) prefix = words.shift()!.replace(/\.?$/, ".");
    if (words.length < 2) continue;
    const grade = role === "student" && gradePart !== undefined && /^\d{1,2}$/.test(gradePart) ? Number(gradePart) : undefined;
    out.push({ first: words[0]!, last: words.slice(1).join(" "), ...(grade !== undefined ? { grade } : {}), ...(prefix ? { prefix } : {}) });
  }
  return out;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Turns rows into accounts: username first.last and email first.last@domain (numbered when the username is taken), password = username. */
export function buildAccounts(rows: BatchRow[], role: Role, domain: string, existing: User[], newId: () => string): Omit<User, "id">[] {
  const taken = [...existing];
  const made: Omit<User, "id">[] = [];
  for (const r of rows) {
    const base = `${slug(r.first)}.${slug(r.last)}`;
    if (base === ".") continue;
    let username = base; let n = 1;
    while (userExists(taken as User[], username)) username = `${base}${++n}`;
    const email = `${username}@${domain}`;
    const acct: Omit<User, "id"> = { email, username, password: username, role, first: r.first, last: r.last, personId: `p-${newId()}`, active: true, ...(r.prefix ? { prefix: r.prefix } : {}), ...(r.grade !== undefined ? { grade: r.grade } : {}) };
    made.push(acct);
    taken.push({ id: "", ...acct } as User);
  }
  return made;
}
