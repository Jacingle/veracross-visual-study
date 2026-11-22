import { useNavigate } from "@tanstack/react-router";

export type RecordWindowPath = "/admin/course/new" | "/admin/class/new";

/** New records open in their own window, as in Veracross. If the browser blocks the popup, the record opens in this tab instead. */
export function useRecordWindow() {
  const nav = useNavigate();
  return (to: RecordWindowPath, search?: Record<string, string>) => {
    const qs = search && Object.keys(search).length ? `?${new URLSearchParams(search).toString()}` : "";
    const w = typeof window === "undefined" ? null : window.open(`${to}${qs}`, "_blank", "popup=yes,width=1180,height=820");
    if (!w) nav({ to, search: (search ?? {}) as never });
  };
}
