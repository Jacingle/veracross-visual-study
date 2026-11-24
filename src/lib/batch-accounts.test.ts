import { describe, expect, it } from "vitest";
import { buildAccounts, parseBatch } from "./batch-accounts";

describe("batch accounts", () => {
  it("parses students with grades and faculty with prefixes", () => {
    expect(parseBatch("Ada Lovelace, 9\n\n  Alan  Turing ", "student")).toEqual([{ first: "Ada", last: "Lovelace", grade: 9 }, { first: "Alan", last: "Turing" }]);
    expect(parseBatch("Mrs. Grace Hopper", "teacher")).toEqual([{ first: "Grace", last: "Hopper", prefix: "Mrs." }]);
    expect(parseBatch("Madonna", "student")).toEqual([]);
  });
  it("builds unique usernames with the password equal to the username", () => {
    let n = 0;
    const made = buildAccounts(parseBatch("Ada Lovelace\nAda Lovelace", "student"), "student", "x.org", [], () => String(++n));
    expect(made.map((m) => m.email)).toEqual(["ada.lovelace@x.org", "ada.lovelace2@x.org"]);
    expect(made.map((m) => m.username)).toEqual(["ada.lovelace", "ada.lovelace2"]);
    expect(made[0]).toMatchObject({ password: "ada.lovelace", role: "student", active: true });
    expect(made[0]?.username).not.toBe(made[0]?.email);
  });
});
