import { beforeEach, describe, expect, it } from "vitest";
import { readSchool, saveSchool, savesSettled } from "./browser-save";

beforeEach(() => { localStorage.clear(); });

describe("browser save", () => {
  it("reads back the newest value while its write is still in flight", async () => {
    const done = saveSchool('{"sections":["new class"]}');
    expect(await readSchool()).toBe('{"sections":["new class"]}');
    await done;
    expect(await readSchool()).toBe('{"sections":["new class"]}');
  });
  it("returns the newest of several queued saves", async () => {
    void saveSchool('{"v":1}');
    void saveSchool('{"v":2}');
    expect(await readSchool()).toBe('{"v":2}');
    await savesSettled();
    expect(await readSchool()).toBe('{"v":2}');
  });
});
