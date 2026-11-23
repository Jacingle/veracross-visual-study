import { describe, expect, it } from "vitest";
import { addSubmission, canSend, canSubmit, completionOf, dropboxOf, onScoreEntered, setStudentComplete, validateFiles, MAX_FILES, MAX_FILE_BYTES, type SubmissionMaps } from "./dropbox";

const K = "a1|s1";
const sub = { id: "x", at: "2026-12-01T18:51:00.000Z", text: "Here is my assignment!", files: [] };
const maps = (over: Partial<SubmissionMaps> = {}): SubmissionMaps => ({ comments: {}, aStatus: {}, submissions: {}, ...over });

describe("dropbox status", () => {
  it("is Closed until a teacher opens it", () => {
    expect(dropboxOf({}, K)).toBe("Closed");
    expect(dropboxOf({ [`d|${K}`]: "nonsense" }, K)).toBe("Closed");
    expect(dropboxOf({ [`d|${K}`]: "Expecting" }, K)).toBe("Expecting");
    expect(dropboxOf({ [`d|${K}`]: "Received" }, K)).toBe("Received");
  });
  it("lets students submit while Expecting or Received only", () => {
    expect([canSubmit("Closed"), canSubmit("Expecting"), canSubmit("Received")]).toEqual([false, true, true]);
  });
});

describe("completion status", () => {
  it("is Pending without a grade and Complete once a grade exists", () => {
    expect(completionOf({}, K, false)).toBe("Pending");
    expect(completionOf({}, K, true)).toBe("Complete");
  });
  it("lets a chosen status win, and reads older Turned In as Complete", () => {
    expect(completionOf({ [K]: "Late" }, K, true)).toBe("Late");
    expect(completionOf({ [K]: "Pending" }, K, true)).toBe("Pending");
    expect(completionOf({ [K]: "Turned In" }, K, false)).toBe("Complete");
  });
  it("moves a Pending assignment to Complete when a grade is entered", () => {
    expect(completionOf(onScoreEntered({ [K]: "Pending" }, K, "9"), K, true)).toBe("Complete");
    expect(onScoreEntered({ [K]: "Pending" }, K, "")[K]).toBe("Pending");
    expect(onScoreEntered({ [K]: "Late" }, K, "9")[K]).toBe("Late");
  });
});

describe("submitting", () => {
  it("is refused while the dropbox is Closed", () => {
    expect(addSubmission(maps(), K, sub)).toBeNull();
  });
  it("records the submission, marks the dropbox Received but leaves completion to the student", () => {
    const r = addSubmission(maps({ comments: { [`d|${K}`]: "Expecting" } }), K, sub)!;
    expect(r.submissions[K]).toEqual([sub]);
    expect(dropboxOf(r.comments, K)).toBe("Received");
    expect(completionOf(r.aStatus, K, false)).toBe("Pending");
  });
  it("keeps every submission and stays Received when a student submits again", () => {
    const first = addSubmission(maps({ comments: { [`d|${K}`]: "Expecting" } }), K, sub)!;
    const second = addSubmission(first, K, { ...sub, id: "y", text: "Fixed a typo" })!;
    expect(second.submissions[K]?.map((s) => s.id)).toEqual(["x", "y"]);
    expect(dropboxOf(second.comments, K)).toBe("Received");
  });
  it("does not overwrite a status the teacher chose (Late, Missing, Excused)", () => {
    for (const s of ["Late", "Missing", "Excused"]) {
      const r = addSubmission(maps({ comments: { [`d|${K}`]: "Expecting" }, aStatus: { [K]: s } }), K, sub)!;
      expect(r.aStatus[K]).toBe(s);
      expect(dropboxOf(r.comments, K)).toBe("Received");
    }
  });
  it("needs some text or a file", () => {
    expect(canSend("  ", [])).toBe(false);
    expect(canSend("hi", [])).toBe(true);
    expect(canSend("", [{ name: "a.docx", size: 1, type: "", data: "" }])).toBe(true);
  });
});

describe("student complete switch", () => {
  it("turns Complete on and off", () => {
    const on = setStudentComplete({}, K, true);
    expect(completionOf(on, K, false)).toBe("Complete");
    expect(completionOf(setStudentComplete(on, K, false), K, false)).toBe("Pending");
  });
  it("leaves the teacher's Late, Missing and Excused alone", () => {
    for (const s of ["Late", "Missing", "Excused"]) {
      expect(setStudentComplete({ [K]: s }, K, true)[K]).toBe(s);
      expect(setStudentComplete({ [K]: s }, K, false)[K]).toBe(s);
    }
  });
});

describe("attachments", () => {
  it("limits how many files and how large", () => {
    expect(validateFiles(0, [{ name: "a", size: 10 }])).toBeNull();
    expect(validateFiles(MAX_FILES, [{ name: "a", size: 10 }])).toMatch(/up to 5 files/);
    expect(validateFiles(0, [{ name: "big.pdf", size: MAX_FILE_BYTES + 1 }])).toMatch(/big\.pdf is larger than 3 MB/);
  });
});
