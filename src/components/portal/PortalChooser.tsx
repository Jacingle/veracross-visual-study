import { Link, useNavigate } from '@tanstack/react-router';
import { Camera, LogOut, Users, GraduationCap, School } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PersonPhoto } from '@/components/common/PersonPhoto';
import { ImageCropper } from '@/components/common/ImageCropper';
import { useSchool } from '@/lib/school-store';

export function PortalChooser({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout, update, photos, impersonatorId, stopImpersonating } = useSchool();
  const [tab, setTab] = useState('portals');
  const [crop, setCrop] = useState(false);
  const nav = useNavigate();
  return <><Dialog open={open} onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-[520px] gap-0 overflow-hidden p-0">
    <DialogHeader className="bg-vc-navbar px-6 pt-4 text-primary-foreground"><DialogTitle className="text-center text-[18px] font-light">Cedar Ridge Academy</DialogTitle><div className="mt-5 flex gap-1">{['portals', 'settings'].map((t) => <Button key={t} variant="ghost" className={tab === t ? 'bg-background text-vc-link-strong' : 'text-primary-foreground'} onClick={() => setTab(t)}>{t === 'portals' ? 'Portals' : 'Settings'}</Button>)}</div></DialogHeader>
    <div className="min-h-[370px] bg-vc-panel px-8 py-8">
      {tab === 'portals' ? <div className="flex flex-wrap justify-center gap-4">{user?.role === 'admin' && <Link to="/admin" onClick={onClose} className="flex size-24 flex-col items-center justify-center gap-2 border border-vc-line bg-background"><School className="size-8 text-vc-link-strong" />Axiom</Link>}{user?.role !== 'student' && <Link to="/teacher" onClick={onClose} className="flex size-24 flex-col items-center justify-center gap-2 border border-vc-line bg-background"><Users className="size-8 text-vc-link-strong" />Faculty</Link>}{user?.role !== 'teacher' && <Link to="/student" onClick={onClose} className="flex size-24 flex-col items-center justify-center gap-2 border border-vc-line bg-background"><GraduationCap className="size-8 text-vc-link-strong" />Student</Link>}</div> : <div className="text-center"><div className="font-semibold">{user?.first} {user?.last}</div>{user?.personId && <><PersonPhoto personId={user.personId} className="mx-auto mt-3 size-24" /><Button variant="outline" className="mt-4" onClick={() => { onClose(); setCrop(true); }}><Camera className="size-4" />Upload Profile Photo</Button></>}</div>}
      {impersonatorId && <div className="mt-6 text-center"><p className="mb-2 text-[12px]">Impersonating {user?.first} {user?.last}</p><Button variant="outline" onClick={() => { stopImpersonating(); onClose(); nav({ to: "/admin/users" }); }}>Return to Administration</Button></div>}<div className="mt-10 text-center"><Button variant="outline" onClick={() => { logout(); onClose(); nav({ to: '/' }); }}><LogOut className="size-4" />Log Out</Button></div>
    </div></DialogContent></Dialog><ImageCropper open={crop} onClose={() => setCrop(false)} aspect={1} outWidth={300} title="Profile Photo" onSave={(photo) => { if (!user) return; const pid = user.personId || `p-${user.id}`; update((s) => ({ ...s, users: s.users.map((u) => u.id === user.id ? { ...u, personId: pid } : u), photos: { ...s.photos, [pid]: photo } })); }} /></>;
}