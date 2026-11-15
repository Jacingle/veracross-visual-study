import placeholder from '@/assets/default-profile.asset.json';
import { useSchool } from '@/lib/school-store';

export function PersonPhoto({ personId, className = 'size-16', alt = 'Profile' }: { personId?: string | undefined; className?: string; alt?: string }) {
  const { photos } = useSchool();
  return <img src={(personId && photos[personId]) || placeholder.url} alt={alt} className={`shrink-0 aspect-square object-cover ${className}`} />;
}