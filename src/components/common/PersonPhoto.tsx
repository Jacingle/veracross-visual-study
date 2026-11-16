import placeholder from '@/assets/default-profile.asset.json';
import { useSchool } from '@/lib/school-store';

export function PersonPhoto({ personId, className = 'size-16', alt = 'Profile', full = false }: { personId?: string | undefined; className?: string; alt?: string; full?: boolean }) {
  const { photos, fullPhotos } = useSchool();
  const source = personId ? (full ? fullPhotos[personId] || photos[personId] : photos[personId]) : undefined;
  return <img src={source || placeholder.url} alt={alt} className={`shrink-0 rounded-[4px] ${full ? 'h-auto object-contain' : 'aspect-square object-cover'} ${className}`} />;
}