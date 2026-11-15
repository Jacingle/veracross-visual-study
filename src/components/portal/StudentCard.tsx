import { PersonPhoto } from "@/components/common/PersonPhoto";
import { MapPinned } from "lucide-react";
import { type Student, studentEmail } from "@/lib/sis-data";
import { useSchool } from "@/lib/school-store";

const Lbl = ({ children }: { children: React.ReactNode }) => <span className="inline-block w-[64px] text-[11px] font-semibold tracking-wider text-muted-foreground">{children}</span>;

export function StudentCard({ s }: { s: Student }) {
  const { photos } = useSchool();
  return (
    <div className="border border-vc-line bg-background px-5 py-4 shadow-sm">
      <div className="flex gap-4">
        <PersonPhoto personId={s.id} className="size-[76px]" />
        <div className="flex flex-1 justify-between gap-4 border-b border-vc-line pb-4">
          <div><div className="text-[21px] font-semibold text-foreground/85">{s.first} {s.last}</div>
            <span className="mt-1 inline-block bg-vc-badge px-1.5 py-px text-[11px] text-primary-foreground">GRADE {s.grade}</span></div>
          <div className="w-[330px] space-y-1 pt-1 text-[15px]">
            <div><Lbl>MOBILE</Lbl><a href={`tel:${s.homePhone}`} className="text-vc-link-strong">{s.homePhone}</a></div>
            <div><Lbl>EMAIL</Lbl><a href={`mailto:${studentEmail(s)}`} className="text-vc-link-strong">{studentEmail(s)}</a></div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[16px] font-semibold text-foreground/75">{s.address} <MapPinned className="size-4 text-vc-link-strong" /></div>
      <div className="mt-1 text-[15px]"><Lbl>HOME</Lbl><a href={`tel:${s.homePhone}`} className="text-vc-link-strong">{s.homePhone}</a></div>
      <div className="mt-3 grid grid-cols-2 gap-4">{s.parents.map((p) => (
        <div key={p.name} className="text-[15px]"><div className="text-[16px] font-semibold text-foreground/75">{p.name}</div>
          <div className="mt-1"><Lbl>MOBILE</Lbl><a href={`tel:${p.mobile}`} className="text-vc-link-strong">{p.mobile}</a></div>
          <div className="mt-0.5"><Lbl>EMAIL</Lbl><a href={`mailto:${p.email}`} className="text-vc-link-strong">{p.email}</a></div></div>))}</div>
    </div>
  );
}
