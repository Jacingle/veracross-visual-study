// Pure sign-in and access rules for the demo accounts (no storage, no React) so they can be tested.
export type Role = "admin" | "teacher" | "student";
export type Area = "admin" | "teacher" | "student" | "shared";
export type User = { id: string; email: string; password: string; role: Role; first: string; last: string; personId: string; active: boolean; prefix?: string; suffix?: string; middle?: string; preferred?: string; address?: string; city?: string; state?: string; postal?: string; phone?: string; grade?: number };

export const canImpersonate = (actor: User | null, target: User) => actor?.role === "admin" && target.role !== "admin" && target.active;

export const ROLE_LABEL: Record<Role, string> = { admin: "Administrator", teacher: "Faculty", student: "Student" };

const norm = (s: string) => s.trim().toLowerCase();

/** Username is the email (case-insensitive); password must match exactly; inactive accounts can't sign in. */
export function findLogin(users: User[], username: string, password: string): User | null {
  const u = users.find((x) => norm(x.email) === norm(username));
  if (!u || !u.active || u.password !== password) return null;
  return u;
}

export const userExists = (users: User[], username: string) => users.some((x) => norm(x.email) === norm(username));

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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address for the username.";
  if (users.some((u) => u.id !== editingId && norm(u.email) === email)) return "Another account already uses that username.";
  if (!draft.first.trim() || !draft.last.trim()) return "First and last name are required.";
  if (draft.password.length < 4) return "Password must be at least 4 characters.";
  return null;
}
