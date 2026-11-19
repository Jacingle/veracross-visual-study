import type { User } from './auth-rules';
import type { Section } from './school-store';
import { validateClassRecord } from './class-records';

/** Spreadsheet formulas must remain plain text in downloaded school records. */
export function csvText(rows: (string | number | boolean)[][]) {
  return rows.map((row) => row.map((value) => {
    const raw = String(value);
    const safe = /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  }).join(',')).join('\r\n');
}
export function downloadCsv(name: string, rows: (string | number | boolean)[][]) {
  const url = URL.createObjectURL(new Blob(['\ufeff', csvText(rows)], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
export function publishingError(c: Pick<Section, 'name' | 'section' | 'terms' | 'teacherIds' | 'studentIds' | 'block' | 'room'>, users: User[]) {
  return validateClassRecord(c, users) ?? (!c.block.trim() || !c.room.trim() ? 'Set a block and room before publishing.' : null);
}