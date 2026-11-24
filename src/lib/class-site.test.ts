import { describe, expect, it } from "vitest";
import { buildTimeline, categoryLabel, chipTime, monthGrid, padTime12, scheduleLines, weekLabel } from "./class-site";
import type { Assignment } from "./sis-data";

const a = (id: string, assigned: string, due: string): Assignment => ({ id, courseId: "c", category: "HOMEWORK", title: id, short: "HW", points: 10, notes: "", assigned: new Date(`${assigned}T00:00:00`), due: new Date(`${due}T00:00:00`) });

describe("class website helpers", () => {
  it("formats times like the class pages", () => {
    expect(padTime12("13:40")).toBe("01:40");
    expect(padTime12("09:10")).toBe("09:10");
    expect(chipTime("10:35")).toBe("10:35a");
    expect(chipTime("08:00")).toBe("8a");
    expect(chipTime("13:40")).toBe("1:40p");
  });

  it("lists weekly meetings Monday first from a scheduling set", () => {
    const set = { id: "s", name: "Set", terms: [], blocks: [{ id: "b", name: "C", days: [], start: "", end: "" }], weekdays: [2, 3, 5], meetings: [
      { id: "1", day: 5, start: "10:35", end: "11:40", blockId: "b" }, { id: "2", day: 2, start: "09:10", end: "10:15", blockId: "b" }, { id: "3", day: 3, start: "13:40", end: "14:45", blockId: "b" },
    ] };
    const lines = scheduleLines({ terms: [], days: [], time: "", scheduleSetId: "s", scheduleBlockId: "b" }, [set]);
    expect(lines.map((l) => l.dayName)).toEqual(["Tuesday", "Wednesday", "Friday"]);
  });

  it("falls back to the class's own days and time", () => {
    const lines = scheduleLines({ terms: [], days: [1, 3], time: "08:00" }, []);
    expect(lines.map((l) => `${l.dayName} ${l.start}`)).toEqual(["Monday 08:00", "Wednesday 08:00"]);
  });

  it("groups assigned and due events by week, newest first", () => {
    const now = new Date("2026-11-17T12:00:00");
    const weeks = buildTimeline([a("hw6", "2026-11-16", "2026-11-18"), a("hw5", "2026-11-12", "2026-11-16")], now, "recent");
    expect(weeks.map((w) => w.label)).toEqual(["Nov 15-21", "Nov 08-14"]);
    expect(weeks[0]?.events.map((e) => `${e.assignment.id}:${e.kind}`)).toEqual(["hw6:due", "hw5:due", "hw6:assigned"]);
  });

  it("recent hides events older than two weeks; all year keeps them", () => {
    const now = new Date("2026-11-17T12:00:00");
    const list = [a("old", "2026-09-01", "2026-09-03")];
    expect(buildTimeline(list, now, "recent")).toEqual([]);
    expect(buildTimeline(list, now, "all")).toHaveLength(1);
  });

  it("labels weeks that cross a month", () => {
    expect(weekLabel(new Date("2026-11-29T00:00:00"))).toBe("Nov 29-Dec 05");
  });

  it("builds a six-week month grid starting on Sunday", () => {
    const grid = monthGrid(new Date("2026-11-17T00:00:00"));
    expect(grid).toHaveLength(6);
    expect(grid[0]?.[0]?.date.getDate()).toBe(1);
    expect(grid[0]?.[0]?.inMonth).toBe(true);
    expect(grid[5]?.[0]?.inMonth).toBe(false);
  });

  it("names assignment categories for the home list", () => {
    expect(categoryLabel("QUIZ")).toBe("Quiz");
  });
});
