import { describe, expect, it } from "vitest";
import { canEnter, findLogin, homeFor, validateUser, type User } from "./auth-rules";
import { SEED_USERS } from "./sis-data";

const users: User[] = SEED_USERS.map((u) => ({ ...u }));

describe("demo sign-in", () => {
  it("each seeded account signs in with password equal to its username", () => {
    expect(findLogin(users, "administrator@ulls.org", "administrator@ulls.org")?.role).toBe("admin");
    expect(findLogin(users, "teacher@ulls.org", "teacher@ulls.org")?.role).toBe("teacher");
    expect(findLogin(users, "student@ulls.org", "student@ulls.org")?.role).toBe("student");
  });
  it("rejects a wrong password", () => {
    expect(findLogin(users, "teacher@ulls.org", "student@ulls.org")).toBeNull();
  });
  it("rejects deactivated accounts", () => {
    const off = users.map((u) => (u.role === "student" ? { ...u, active: false } : u));
    expect(findLogin(off, "student@ulls.org", "student@ulls.org")).toBeNull();
  });
});

describe("portal access", () => {
  it("sends each role to its own portal", () => {
    expect(homeFor("admin")).toBe("/admin");
    expect(homeFor("teacher")).toBe("/teacher");
    expect(homeFor("student")).toBe("/student");
  });
  it("students cannot open the admin or faculty portals", () => {
    expect(canEnter("student", "admin")).toBe(false);
    expect(canEnter("student", "teacher")).toBe(false);
  });
  it("teachers cannot open the admin portal", () => {
    expect(canEnter("teacher", "admin")).toBe(false);
  });
  it("admins can open every portal", () => {
    expect(["admin", "teacher", "student", "shared"].every((a) => canEnter("admin", a as "admin"))).toBe(true);
  });
  it("admin cannot create a second account with an existing username", () => {
    expect(validateUser(users, { email: "Teacher@ulls.org", password: "abcd", role: "teacher", first: "A", last: "B", personId: "", active: true })).toMatch(/already/);
  });
});
