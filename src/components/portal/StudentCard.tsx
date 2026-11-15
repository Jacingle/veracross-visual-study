import { type Student, studentEmail } from "@/lib/sis-data";

const Lbl = ({ children }: { children: React.ReactNode }) => <span className="inline-block w-[68px] text-[14px] font-semibold tracking-wider text-muted-foreground">{children}</span>;

export function StudentCard({ s }: { s: Student }) {
  return (
    <div className="border border-vc-line bg-background px-7 py-6 shadow-sm">
      <div className="flex gap-6">
        <div className="grid size-[94px] shrink-0 place-items-center bg-vc-tile text-3xl font-light text-vc-link-strong">{s.first[0]}{s.last[0]}</div>
        <div className="flex flex-1 justify-between border-b border-vc-line pb-6">
          <div><div className="text-[27px] font-semibold text-foreground/85">{s.first} {s.last}</div>
            <span className="mt-1 inline-block bg-vc-badge px-2 py-0.5 text-[14px] text-primary-foreground">GRADE {s.grade}</span></div>
          <div className="w-[400px] pt-1"><Lbl>EMAIL</Lbl><a href={`mailto:${studentEmail(s)}`} className="text-[19px] text-vc-link-strong">{studentEmail(s)}</a></div>
        </div>
      </div>
      <div className="mt-6 text-[20px] font-semibold text-foreground/75">{s.address}</div>
      <div className="mt-1"><Lbl>HOME</Lbl><a href={`tel:${s.homePhone}`} className="text-[19px] text-vc-link-strong">{s.homePhone}</a></div>
      <div className="mt-5 grid grid-cols-2">{s.parents.map((p) => (
        <div key={p.name}><div className="text-[20px] font-semibold text-foreground/75">{p.name}</div>
          <div className="mt-1"><Lbl>MOBILE</Lbl><a href={`tel:${p.mobile}`} className="text-[19px] text-vc-link-strong">{p.mobile}</a></div>
          <div className="mt-1"><Lbl>EMAIL</Lbl><a href={`mailto:${p.email}`} className="text-[19px] text-vc-link-strong">{p.email}</a></div></div>))}</div>
    </div>
  );
}
