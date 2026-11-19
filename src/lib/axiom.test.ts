import { describe, expect, it } from "vitest";
import { DEFAULT_CLASS_CONFIG, classConfigOf, defaultPortals, isHex, screenCounts, sortedItems, sortedNav } from "./axiom";

describe("axiom data", () => {
  it("falls back to defaults for classes with no saved configuration", () => {
    expect(classConfigOf({}, "x")).toEqual(DEFAULT_CLASS_CONFIG);
    expect(classConfigOf({ x: { defaultMax: 50, scorePublishing: "Manual" } }, "x")).toMatchObject({ defaultMax: 50, scorePublishing: "Manual", trackAttendance: true });
  });
  it("seeds student and faculty portals with screens and menus", () => {
    const [student, faculty] = defaultPortals();
    expect(student?.access).toBe("student");
    expect(faculty?.role).toBe("teacher");
    expect(screenCounts(student!).component + screenCounts(student!).content).toBe(student!.screens.length);
  });
  it("orders menus and items by column then sort key", () => {
    const p = defaultPortals()[0]!;
    const cats = sortedNav([...p.nav].reverse());
    expect(cats.map((c) => c.sort)).toEqual([...cats.map((c) => c.sort)].sort((a, b) => a - b));
    const items = sortedItems({ ...p.nav[0]!, items: [...p.nav[0]!.items].reverse() });
    expect(items.map((i) => i.sort)).toEqual([...items.map((i) => i.sort)].sort((a, b) => a - b));
  });
  it("validates hex colors", () => {
    expect(isHex("#3693D8")).toBe(true);
    expect(isHex("#fff")).toBe(true);
    expect(isHex("blue")).toBe(false);
    expect(isHex("#12")).toBe(false);
  });
});
