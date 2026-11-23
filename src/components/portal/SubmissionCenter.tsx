import { format, parseISO } from "date-fns";
import { FileText, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { addSubmission, canSend, canSubmit, completionOf, dropboxOf, setStudentComplete, validateFiles, type SubFile, type Submission } from "@/lib/dropbox";
import { scoreKey } from "@/lib/gradebook";
import { useSchool, useStudentAssignments } from "@/lib/school-store";
import { courseTitle, studentById, teacherShort, type Assignment } from "@/lib/sis-data";

const nice = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const when = (iso: string) => format(parseISO(iso), "EEE, MMM dd yyyy hh:mm a");
const kb = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

function readFile(f: File): Promise<SubFile> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ name: f.name, size: f.size, type: f.type, data: String(r.result) });
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}

type Entry = { id: string; by: "student" | "teacher"; at: string | undefined; text: string; files: SubFile[] };

/** Square NO / YES switch (screenshot: white thumb + gray "NO"; green "YES" when on). */
function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className="flex h-[34px] w-[68px] shrink-0 overflow-hidden rounded-[3px] border border-[#d4d8dd] text-[12px] font-bold">
      {on ? <><span className="grid flex-1 place-items-center bg-vc-success text-primary-foreground">YES</span><span className="w-[26px] bg-background" /></>
        : <><span className="w-[26px] bg-background" /><span className="grid flex-1 place-items-center bg-[#ececec] text-[#c4c4c4]">NO</span></>}
    </button>
  );
}

/**
 * The student's Assignment Submission page. The list on the left holds every assignment the teacher has opened to
 * this student (dropbox Expecting or Received) plus any they already handed work in for; the right side shows the
 * assignment, the conversation (submissions and teacher feedback) and the box to add a new submission.
 */
export function SubmissionCenter({ aid, onPick }: { aid: string | undefined; onPick: (id: string) => void }) {
  const all = useStudentAssignments();
  const { comments, aStatus, submissions, sections, user, update } = useSchool();
  const sid = user?.personId || "me";
  const keyOf = (a: Assignment) => scoreKey(a.id, sid);
  const rows = all.filter((a) => canSubmit(dropboxOf(comments, keyOf(a))) || (submissions[keyOf(a)]?.length ?? 0) > 0).sort((a, b) => +a.due - +b.due);
  const waiting = rows.find((a) => dropboxOf(comments, keyOf(a)) === "Expecting");
  const sel = rows.find((a) => a.id === aid) ?? waiting ?? rows[0];
  return (
    <div style={{ zoom: 0.88 }}>
      <div className="bg-vc-panel px-[35px] pb-3.5 pt-[22px]">
        <h1 className="text-[32px] font-semibold leading-10 text-foreground/80">Assignment Submission</h1>
        <p className="text-[16px] font-light text-vc-gray-dark">{rows.length ? "Select an Assignment Below" : "Nothing is open for submission right now."}</p>
      </div>
      {rows.length === 0 ? (
        <p className="border-t border-vc-line px-[35px] py-10 text-[15px] text-vc-gray-dark">Your teachers open an assignment for submissions by setting its dropbox to Expecting. When one is open for you, it will be listed here and a Submit button will appear next to it on your All Assignments page.</p>
      ) : (
        <div className="grid border-t border-vc-line md:grid-cols-[minmax(0,330px)_minmax(0,1fr)]">
          <ul className="bg-vc-panel">
            {rows.map((a) => {
              const c = sections.find((x) => x.id === a.courseId);
              const done = completionOf(aStatus, keyOf(a), a.score !== undefined) === "Complete";
              const on = sel?.id === a.id;
              return (
                <li key={a.id} className={`border-b border-vc-line ${on ? "bg-background" : ""}`}>
                  <button type="button" aria-current={on} onClick={() => onPick(a.id)} className="block w-full px-[35px] py-[18px] text-left">
                    <div className="text-[18px] leading-6"><strong className="font-semibold">{c?.code ?? a.courseId}:</strong> <span className="font-light">{c ? courseTitle(c) : ""}</span></div>
                    <div className="text-[15px] font-light text-vc-gray-dark">Due Date: {format(a.due, "EEE, MMM dd")}</div>
                    {done && <span className="mt-1.5 inline-block bg-[#d4ecd4] px-3.5 py-1 text-[14px] uppercase text-[#2f2f2f]">Complete</span>}
                    <div className="mt-3 text-[17px] leading-5">{nice(a.category)}</div>
                    <div className="text-[16px] font-light leading-[22px] text-vc-gray-dark">{a.title}</div>
                  </button>
                </li>
              );
            })}
          </ul>
          {sel && <Detail key={sel.id} a={sel} sid={sid} />}
        </div>
      )}
    </div>
  );
}

/** One assignment: its details, the submission conversation and the box for a new submission. */
function Detail({ a, sid }: { a: Assignment; sid: string }) {
  const { comments, aStatus, submissions, sections, update } = useSchool();
  const k = scoreKey(a.id, sid);
  const c = sections.find((x) => x.id === a.courseId);
  const open = canSubmit(dropboxOf(comments, k));
  const complete = completionOf(aStatus, k, a.score !== undefined);
  const me = studentById(sid);
  const teacherId = c?.teacherIds[0] ?? "";
  const teacherName = teacherId ? teacherShort(teacherId).trim() : "Teacher";
  const [text, setText] = useState("");
  const [files, setFiles] = useState<SubFile[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const entries: Entry[] = (submissions[k] ?? []).map((s: Submission) => ({ id: s.id, by: "student" as const, at: s.at, text: s.text, files: s.files }));
  const fb = comments[`a|${k}`];
  if (fb) entries.push({ id: "feedback", by: "teacher", at: comments[`at|${k}`], text: fb, files: [] });
  entries.sort((x, y) => (x.at ?? "9999").localeCompare(y.at ?? "9999"));

  const pick = async (list: FileList | null) => {
    if (!list?.length) return;
    const incoming = [...list];
    const err = validateFiles(files.length, incoming);
    if (err) { toast.error(err); return; }
    try { const read = await Promise.all(incoming.map(readFile)); setFiles((f) => [...f, ...read]); } catch { toast.error("That file couldn't be read. Please try again."); }
    if (input.current) input.current.value = "";
  };
  const send = () => {
    if (!canSend(text, files)) return;
    if (!canSubmit(dropboxOf(comments, k))) { toast.error("Your teacher has closed submissions for this assignment."); return; }
    const sub: Submission = { id: `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, at: new Date().toISOString(), text: text.trim(), files };
    update((s) => { const r = addSubmission(s, k, sub); return r ? { ...s, ...r } : s; });
    setText(""); setFiles([]);
    toast.success("Submission sent to your teacher");
  };
  const toggle = () => {
    if (["Late", "Missing", "Excused"].includes(complete)) { toast.info(`Your teacher marked this assignment ${complete}. Ask them if that should change.`); return; }
    update((s) => ({ ...s, aStatus: setStudentComplete(s.aStatus, k, complete !== "Complete") }));
  };

  return (
    <div className="min-w-0 bg-background px-[52px] pb-12 pt-[40px]">
      <h2 className="text-[34px] font-semibold leading-10 text-foreground/80">Details</h2>
      <p className="mt-5 whitespace-pre-wrap text-[17px] leading-6">{a.notes.trim() || "See assignment for details."}</p>
      <h2 className="mt-9 text-[34px] font-semibold leading-10 text-foreground/80">Submissions</h2>
      {entries.length === 0 ? (
        <div className="py-14 text-center"><Paperclip className="mx-auto size-8" strokeWidth={1.6} /><p className="mt-6 text-[17px]">Add a submission below. After adding a submission, mark the assignment as complete yourself with the switch below.</p></div>
      ) : (
        <ul className="mt-6 space-y-7">
          {entries.map((e) => (
            <li key={e.id} className="flex gap-4">
              <PersonPhoto personId={e.by === "student" ? sid : teacherId} className="size-[54px] shrink-0 rounded-full" />
              <div className="min-w-0">
                <div className="text-[22px] leading-7">{e.by === "student" ? (me ? `${me.last}, ${me.first}` : "Me") : teacherName}</div>
                {e.at && <div className="text-[17px] font-light text-vc-gray-dark">{when(e.at)}</div>}
                {e.text && <p className="mt-3 whitespace-pre-wrap break-words text-[16px] leading-[22px]">{e.text}</p>}
                {e.files.map((f, i) => <a key={`${f.name}-${i}`} href={f.data} download={f.name} className="mt-3 flex w-fit max-w-full items-center gap-1.5 text-[18px] text-vc-link-strong hover:underline"><FileText className="size-[18px] shrink-0 text-foreground" /><span className="truncate">{f.name}</span></a>)}
              </div>
            </li>
          ))}
        </ul>
      )}
      {open ? (
        <div className="mt-10">
          <h3 className="text-[30px] font-light leading-9">Add Submission</h3>
          <textarea aria-label="Add Submission" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} className="mt-3.5 block h-[100px] w-full resize-y border border-[#c9c9c9] p-3 text-[16px] outline-none focus:border-vc-link" />
          {files.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-3">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="relative flex w-[150px] flex-col items-center border border-vc-line px-2 pb-2 pt-4">
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-foreground text-background"><X className="size-3" strokeWidth={3} /></button>
                  <FileText className="size-9 text-vc-gray" strokeWidth={1.4} />
                  <span className="mt-2 w-full truncate text-center text-[12px]" title={f.name}>{f.name}</span><span className="text-[11px] text-vc-gray">{kb(f.size)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2.5 flex gap-2.5">
            <input ref={input} type="file" multiple hidden aria-label="Choose files" onChange={(e) => void pick(e.target.files)} />
            <button type="button" onClick={() => input.current?.click()} className="flex h-[42px] items-center gap-2 rounded-[3px] border border-[#cfcfcf] bg-background px-4 text-[15px] font-semibold text-foreground/80 shadow-[0_1px_2px_rgba(0,0,0,.12)]"><Paperclip className="size-4" />Attach Files</button>
            <button type="button" disabled={!canSend(text, files)} onClick={send} className="h-[42px] rounded-[3px] bg-[#2d6fc0] px-5 text-[15px] font-semibold text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,.2)] enabled:hover:brightness-110 disabled:opacity-50">Submit</button>
          </div>
        </div>
      ) : <p className="mt-10 bg-vc-panel px-4 py-3 text-[15px] text-vc-gray-dark">Your teacher has closed submissions for this assignment.</p>}
      <div className="mt-6 flex items-center justify-between gap-4 border-l-[3px] border-l-[#2d6fc0] bg-[#eaf2fb] py-3 pl-5 pr-6">
        <span className="text-[26px] font-semibold leading-8 text-[#2d6fc0]">Is this assignment complete?</span>
        <Switch on={complete === "Complete"} onChange={toggle} label="Is this assignment complete?" />
      </div>
    </div>
  );
}
