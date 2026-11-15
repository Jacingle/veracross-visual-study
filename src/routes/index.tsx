import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import crest from "@/assets/crest.png";
import { homeFor, userExists } from "@/lib/auth-rules";
import { SCHOOL } from "@/lib/sis-data";
import { bgSrc, useSchool } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/")({
  head: () => pageHead("Log In", "Sign in to the Cedar Ridge Academy student, faculty and administration portals."),
  component: Login,
});

function Login() {
  const { ready, user, login, users, settings } = useSchool();
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { if (ready && user) nav({ to: homeFor(user.role), replace: true }); }, [ready, user, nav]);
  const src = bgSrc(settings.login.bg);

  const next = (e?: React.SyntheticEvent) => { e?.preventDefault(); if (!username.trim()) return; setError(""); setStep(2); };
  const submit = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    const u = login(username, password);
    if (!u) { setError(userExists(users, username) ? "The password you entered is incorrect." : "We couldn't find an account with that username."); setPassword(""); return; }
  };

  return (
    <div className="relative min-h-screen bg-vc-sky px-4 py-14">
      {src && <img src={src} alt="" width={1920} height={1088} className="fixed inset-0 h-full w-full object-cover" />}
      <div className="relative mx-auto mt-[70px] max-w-[578px] bg-background px-7 pb-6 pt-[86px] text-[15px] shadow-xl">
        <div className="absolute -top-[70px] left-1/2 grid size-[145px] -translate-x-1/2 place-items-center rounded-full bg-background">
          <img src={crest} alt={`${SCHOOL.name} crest`} width={816} height={816} className="size-[100px] object-contain" />
        </div>
        <h1 className="text-center text-[27px] text-vc-topbar">{SCHOOL.name}</h1>
        <p className="mt-3 text-center">{settings.login.message}</p>
        {error && <div role="alert" className="mt-5 bg-vc-note px-3 py-3 text-destructive shadow-sm">{error}</div>}
        {step === 1 ? (
          <form onSubmit={next} className="mt-6">
            <label htmlFor="username" className="text-[13px] tracking-wide text-muted-foreground">USERNAME</label>
            <input id="username" autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={120}
              className="mt-1.5 block h-10 w-full border border-vc-link px-3 outline-none focus:ring-2 focus:ring-vc-link/30" />
            <button type="button" onClick={() => next()} disabled={!username.trim()} className="mt-4 h-[35px] border border-vc-line bg-vc-panel px-4 text-muted-foreground enabled:border-vc-link-strong enabled:bg-vc-link-strong enabled:text-primary-foreground">Next</button>
          </form>
        ) : (
          <form onSubmit={submit} className="mt-6">
            <div className="text-[13px] tracking-wide text-muted-foreground">USERNAME</div>
            <div className="mt-1 flex items-center justify-between"><span className="font-semibold">{username}</span>
              <button type="button" onClick={() => { setStep(1); setPassword(""); setError(""); }} className="text-[13px] text-vc-link hover:underline">Change</button></div>
            <label htmlFor="password" className="mt-4 block text-[13px] tracking-wide text-muted-foreground">PASSWORD</label>
            <input id="password" type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={120}
              className="mt-1.5 block h-10 w-full border border-vc-link px-3 outline-none focus:ring-2 focus:ring-vc-link/30" />
            <button type="button" onClick={() => submit()} disabled={!password} className="mt-4 h-[35px] border border-vc-line bg-vc-panel px-4 text-muted-foreground enabled:border-vc-link-strong enabled:bg-vc-link-strong enabled:text-primary-foreground">Log In</button>
          </form>
        )}
        <button type="button" onClick={() => toast.info("Contact the school office", { description: "Your administrator can reset your password from Axiom → Users & Security." })} className="mt-5 block text-vc-link hover:underline">Can't access your account?</button>
      </div>
    </div>
  );
}
