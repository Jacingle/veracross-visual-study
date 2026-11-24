import { describe, expect, it } from "vitest";
import { buildTimeline, canComment, categoryLabel, chipTime, discussionState, monthGrid, padTime12, scheduleLines, visibleDiscussions, weekLabel, withComment, withoutComment, type Discussion } from "./class-site";
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

describe("class website discussions", () => {
  const d = (id: string, p: Partial<Discussion> = {}): Discussion => ({ id, title: id, body: "", status: "open", comments: [], ...p });
  const day = "2026-09-10";
  it("works out where a discussion stands on a day", () => {
    expect(discussionState(d("a"), day)).toBe("open");
    expect(discussionState(d("a", { opens: "2026-09-12" }), day)).toBe("scheduled");
    expect(discussionState(d("a", { closes: "2026-09-09" }), day)).toBe("closed");
    expect(discussionState(d("a", { closes: "2026-09-10" }), day)).toBe("open");
    expect(discussionState(d("a", { status: "draft" }), day)).toBe("draft");
    expect(discussionState(d("a", { status: "closed" }), day)).toBe("closed");
  });
  it("shows students open and closed topics, and the teacher everything", () => {
    const all = [d("open"), d("later", { opens: "2026-10-01" }), d("draft", { status: "draft" }), d("done", { status: "closed" })];
    expect(visibleDiscussions(all, false, day).map((x) => x.id)).toEqual(["open", "done"]);
    expect(visibleDiscussions(all, true, day)).toHaveLength(4);
    expect(canComment(all[0]!, day, false)).toBe(true);
    expect(canComment(all[3]!, day, false)).toBe(false);
    expect(canComment(all[3]!, day, true)).toBe(true);
  });
  it("keeps threads one level deep and removes replies with their comment", () => {
    const c = (id: string, parent?: string) => ({ id, by: "A", byId: "p", date: "2026-09-10T10:00:00Z", text: id, parent });
    let t = withComment(d("t"), c("top"));
    t = withComment(t, c("r1", "top"));
    t = withComment(t, c("r2", "r1"));
    expect(t.comments.map((x) => [x.id, x.parent])).toEqual([["top", undefined], ["r1", "top"], ["r2", "top"]]);
    expect(withoutComment(t, "top").comments).toEqual([]);
    expect(withoutComment(t, "r1").comments.map((x) => x.id)).toEqual(["top", "r2"]);
  });
});
