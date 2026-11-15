import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { canEnter, homeFor, type Area } from "@/lib/auth-rules";
import { useSchool } from "@/lib/school-store";

/** Client-side demo gate: signed-out visitors go to the login page, wrong roles go to their own portal. */
export function RoleGate({ area, children }: { area: Area; children: ReactNode }) {
  const { ready, user } = useSchool();
  const nav = useNavigate();
  const ok = !!user && canEnter(user.role, area);
  useEffect(() => {
    if (!ready) return;
    if (!user) nav({ to: "/", replace: true });
    else if (!canEnter(user.role, area)) nav({ to: homeFor(user.role), replace: true });
  }, [ready, user, area, nav]);
  if (!ready || !ok) return <div className="min-h-screen bg-vc-panel" />;
  return <>{children}</>;
}
