// School Information rules: what an administrator may save for the school's name, logo and contact details.
import type { SchoolInfo } from "./sis-data";

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
/** Trim every field; the email domain is stored lower case without a leading @. */
export function cleanSchool(d: SchoolInfo): SchoolInfo {
  const t = (s: string) => s.trim();
  return { ...d, name: t(d.name), short: t(d.short).toUpperCase(), domain: t(d.domain).replace(/^@/, "").toLowerCase(), head: t(d.head), address: t(d.address), address2: t(d.address2), city: t(d.city), state: t(d.state), postal: t(d.postal), phone: t(d.phone), website: t(d.website) };
}
/** The first problem with a draft, or null when it can be saved. */
export function validateSchool(d: SchoolInfo): string | null {
  const c = cleanSchool(d);
  if (!c.name) return "Enter the school's name.";
  if (c.name.length > 80) return "The school name can be at most 80 characters.";
  if (!c.short || c.short.length > 8 || /\s/.test(c.short)) return "The short name is 1 to 8 characters with no spaces (for example, CRA).";
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(c.domain)) return "Enter the email domain without the @, for example school.edu.";
  if (c.website && !/^https?:\/\/\S+\.\S+$/i.test(c.website)) return "The website must start with http:// or https://.";
  if (c.logo && !/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(c.logo)) return "The logo must be a PNG, JPG, GIF, WebP or SVG picture.";
  return null;
}
/** Fields that differ from what is saved, so the screen can mark them. */
export const changedFields = (a: SchoolInfo, b: SchoolInfo) => (Object.keys(a) as (keyof SchoolInfo)[]).filter((k) => a[k] !== b[k]);
