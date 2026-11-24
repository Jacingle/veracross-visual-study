import { describe, expect, it } from "vitest";
import { canEnter, findLogin, homeFor, loginName, userExists, validateUser, type User } from "./auth-rules";
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

describe("username is separate from email", () => {
  const base: Omit<User, "id"> = { email: "jane@school.org", username: "jane.smith", password: "abcd", role: "teacher", first: "Jane", last: "Smith", personId: "", active: true };
  const withJane: User[] = [...users, { id: "u-j", ...base }];
  it("signs in with the username, not the email", () => {
    expect(findLogin(withJane, "jane.smith", "abcd")?.first).toBe("Jane");
    expect(findLogin(withJane, "JANE.SMITH", "abcd")?.first).toBe("Jane");
    expect(findLogin(withJane, "jane@school.org", "abcd")).toBeNull();
    expect(userExists(withJane, "jane@school.org")).toBe(false);
  });
  it("older accounts without a username still sign in with their email", () => {
    expect(loginName({ email: "old@x.org" })).toBe("old@x.org");
    expect(loginName({ email: "old@x.org", username: "  " })).toBe("old@x.org");
    expect(findLogin(users, "teacher@ulls.org", "teacher@ulls.org")?.role).toBe("teacher");
  });
  it("checks the username and the email separately", () => {
    expect(validateUser(users, { ...base, username: "jane smith" })).toMatch(/no spaces/);
    expect(validateUser(users, { ...base, username: "ab" })).toMatch(/3 to 60/);
    expect(validateUser(users, { ...base, email: "not-an-email" })).toMatch(/valid email/);
    expect(validateUser(withJane, { ...base, email: "other@school.org" })).toMatch(/already uses that username/);
    expect(validateUser(withJane, { ...base, username: "teacher@ulls.org" })).toMatch(/already/);
    expect(validateUser(withJane, base, "u-j")).toBeNull();
    // two people may share a contact email as long as their usernames differ
    expect(validateUser(withJane, { ...base, username: "jane.two" })).toBeNull();
  });
});
