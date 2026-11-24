// Pure sign-in and access rules for the demo accounts (no storage, no React) so they can be tested.
export type Role = "admin" | "teacher" | "student";
export type Area = "admin" | "teacher" | "student" | "shared";
export type User = { id: string; /** Contact email address. */ email: string; /** Sign-in name, separate from the email. Older accounts without one sign in with their email. */ username?: string; password: string; role: Role; first: string; last: string; personId: string; active: boolean; prefix?: string; suffix?: string; middle?: string; preferred?: string; loginDisabled?: boolean; welcomeSent?: boolean; address?: string; city?: string; state?: string; postal?: string; phone?: string; grade?: number; mobile?: string; address2?: string; gender?: string; pronouns?: string; birthday?: string; household?: string; email1?: string; parents?: string[] };

export const canImpersonate = (actor: User | null, target: User) => actor?.role === "admin" && target.role !== "admin" && target.active;

export const ROLE_LABEL: Record<Role, string> = { admin: "Administrator", teacher: "Faculty", student: "Student" };

const norm = (s: string) => s.trim().toLowerCase();

/** What a person types to sign in: their username, or (for older accounts that never had one) their email. */
export const loginName = (u: Pick<User, "email" | "username">) => u.username?.trim() || u.email;

/** Username is matched case-insensitively; password must match exactly; inactive accounts can't sign in. */
export function findLogin(users: User[], username: string, password: string): User | null {
  const u = users.find((x) => norm(loginName(x)) === norm(username));
  if (!u || !u.active || u.loginDisabled || u.password !== password) return null;
  return u;
}

/** True when the account exists but portal logins were switched off by an administrator. */
export const loginBlocked = (users: User[], username: string) => users.some((x) => norm(loginName(x)) === norm(username) && x.active && !!x.loginDisabled);
export const userExists = (users: User[], username: string) => users.some((x) => norm(loginName(x)) === norm(username));

export function homeFor(role: Role): "/admin" | "/teacher" | "/student" {
  return role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/student";
}

/** Admins can open every portal; faculty and students only their own plus shared pages. */
export function canEnter(role: Role, area: Area): boolean {
  if (role === "admin" || area === "shared") return true;
  return role === area;
}

export function validateUser(users: User[], draft: Omit<User, "id">, editingId?: string): string | null {
  const email = norm(draft.email);
  const typed = draft.username?.trim() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  if (typed && !/^\S{3,60}$/.test(typed)) return "A username needs 3 to 60 characters and no spaces.";
  const login = norm(typed || draft.email);
  if (users.some((u) => u.id !== editingId && norm(loginName(u)) === login)) return "Another account already uses that username.";
  if (!draft.first.trim() || !draft.last.trim()) return "First and last name are required.";
  if (draft.password.length < 4) return "Password must be at least 4 characters.";
  return null;
}
