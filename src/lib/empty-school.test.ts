import { describe, expect, it } from "vitest";
import { ALL_ASSIGNMENTS, ALL_SECTIONS, STUDENTS, TEACHERS, MESSAGES, NEWS, TODAY_EVENTS, RESOURCE_TILES, events } from "./sis-data";
describe("school starts without sample records", () => {
  it("has no sample classes or assignments", () => {
    expect(ALL_SECTIONS).toHaveLength(0);
    expect(ALL_ASSIGNMENTS).toHaveLength(0);
  });
  it("has no generated directory records", () => {
    expect(STUDENTS).toHaveLength(0);
    expect(TEACHERS).toHaveLength(0);
  });
  it("has no sample communications or events", () => {
    expect(MESSAGES).toHaveLength(0);
    expect(NEWS).toHaveLength(0);
    expect(TODAY_EVENTS).toHaveLength(0);
    expect(events()).toHaveLength(0);
    expect(RESOURCE_TILES).toHaveLength(0);
  });
});