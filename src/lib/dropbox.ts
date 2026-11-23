// Assignment dropbox. A teacher opens it per student (Expecting), a student submits work to it (it becomes Received),
// and an assignment's completion status is worked out from what the teacher and the student have recorded.

export type DropboxStatus = "Closed" | "Expecting" | "Received";
export const DROPBOX_STATUSES: readonly DropboxStatus[] = ["Closed", "Expecting", "Received"];

export const COMPLETION_STATUSES = ["Pending", "Complete", "Late", "Missing", "Excused", "Incomplete"] as const;
export type Completion = (typeof COMPLETION_STATUSES)[number];
/** Statuses a teacher sets on purpose: a student's submission or toggle never overwrites them. */
const TEACHER_DECIDES: readonly string[] = ["Late", "Missing", "Excused"];

export type SubFile = { name: string; size: number; type: string; data: string };
export type Submission = { id: string; at: string; text: string; files: SubFile[] };
export type SubmissionMaps = { comments: Record<string, string>; aStatus: Record<string, string>; submissions: Record<string, Submission[]> };

export const MAX_FILES = 5;
/** Files are kept in this browser (no server yet), so each one is kept small. */
export const MAX_FILE_BYTES = 3 * 1024 * 1024;

export const dropboxKey = (key: string) => `d|${key}`;
/** Closed unless the teacher has set Expecting or Received for this student and assignment. */
export function dropboxOf(comments: Record<string, string>, key: string): DropboxStatus {
  const v = comments[dropboxKey(key)];
  return v === "Expecting" || v === "Received" ? v : "Closed";
}
/** Students may submit while the dropbox is Expecting or Received; Closed means no more submissions. */
export const canSubmit = (s: DropboxStatus) => s !== "Closed";

/** The status someone chose (older saves called Complete "Turned In"); undefined when nobody chose one. */
export function storedCompletion(aStatus: Record<string, string>, key: string): Completion | undefined {
  const v = aStatus[key];
  if (v === "Turned In") return "Complete";
  return v !== undefined && (COMPLETION_STATUSES as readonly string[]).includes(v) ? (v as Completion) : undefined;
}
/** A chosen status wins; otherwise a grade means Complete and no grade means Pending. */
export const completionOf = (aStatus: Record<string, string>, key: string, hasScore: boolean): Completion =>
  storedCompletion(aStatus, key) ?? (hasScore ? "Complete" : "Pending");

/** Entering a grade moves a Pending assignment to Complete (the stored Pending is dropped so the grade decides). */
export function onScoreEntered(aStatus: Record<string, string>, key: string, score: string): Record<string, string> {
  if (score.trim() === "" || aStatus[key] !== "Pending") return aStatus;
  const next = { ...aStatus };
  delete next[key];
  return next;
}

export const canSend = (text: string, files: SubFile[]) => text.trim() !== "" || files.length > 0;

/** Message to show when picked files can't be attached, or null when they are fine. */
export function validateFiles(alreadyAttached: number, incoming: { name: string; size: number }[]): string | null {
  if (alreadyAttached + incoming.length > MAX_FILES) return `You can attach up to ${MAX_FILES} files to one submission.`;
  const big = incoming.find((f) => f.size > MAX_FILE_BYTES);
  return big ? `${big.name} is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.` : null;
}

/**
 * A student's submission: it is added to the conversation, the dropbox becomes Received. Completion is left
 * alone: the student (or teacher) sets it on purpose. Null when the dropbox is Closed.
 */
export function addSubmission(m: SubmissionMaps, key: string, sub: Submission): SubmissionMaps | null {
  if (!canSubmit(dropboxOf(m.comments, key))) return null;
  return {
    comments: { ...m.comments, [dropboxKey(key)]: "Received" },
    aStatus: m.aStatus,
    submissions: { ...m.submissions, [key]: [...(m.submissions[key] ?? []), sub] },
  };
}

/** The student's own "Is this assignment complete?" switch. A teacher's Late, Missing or Excused is left alone. */
export function setStudentComplete(aStatus: Record<string, string>, key: string, on: boolean): Record<string, string> {
  const cur = storedCompletion(aStatus, key);
  if (cur !== undefined && TEACHER_DECIDES.includes(cur)) return aStatus;
  if (on) return { ...aStatus, [key]: "Complete" };
  if (cur !== "Complete") return aStatus;
  const next = { ...aStatus };
  delete next[key];
  return next;
}
