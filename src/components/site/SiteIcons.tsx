import type { ReactNode } from "react";

/** Solid tab icons for the class website (filled, like the Veracross class tabs). */
const Svg = ({ className = "size-[25px]", children }: { className?: string; children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>{children}</svg>
);
type P = { className?: string };

export const HomeIcon = (p: P) => <Svg {...p}><path d="M12 2.5 1.5 12h3v9h5.5v-6h4v6h5.5v-9h3z" /></Svg>;
export const PostsIcon = (p: P) => <Svg {...p}><path d="M2 9.5v5h2.5l1.2 5.5h3.2l-1.3-5.5H9l9.5 4.5V5L9 9.5zM20 9v6a3 3 0 0 0 0-6z" /></Svg>;
export const TimelineIcon = (p: P) => <Svg {...p}><path fillRule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2.2a7.8 7.8 0 1 1 0 15.6 7.8 7.8 0 0 1 0-15.6zM11 7v6l4.2 2.5.9-1.5-3.3-2V7z" /></Svg>;
export const CalendarIcon = (p: P) => <Svg {...p}><path fillRule="evenodd" d="M6 1.5h2.2V4h7.6V1.5H18V4h3v18H3V4h3zM5 9v11h14V9zm2 2h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 15h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" /></Svg>;
export const FolderIcon = (p: P) => <Svg {...p}><path d="M2 4.5h7l2 2.5h8v3H7.2L4 19.5H2zM6.5 12H23l-3.5 8H3z" /></Svg>;
export const PhotosIcon = (p: P) => <Svg {...p}><path fillRule="evenodd" d="M2 4h20v16H2zm2 2v9.5l4.5-4.5 3.5 3.5 3-3L20 15.5V6zm12 1.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z" /></Svg>;
export const DiscussionsIcon = (p: P) => <Svg {...p}><path d="M10 3C5 3 1 6.2 1 10.2c0 2 1 3.800 2.700 5.100L3 19l4-2c.9.2 1.900.4 3 .4 5 0 9-3.200 9-7.200S15 3 10 3zM20.500 9.500c1.600 1 2.500 2.500 2.500 4.200 0 1.400-.7 2.700-1.800 3.600L22 21l-3.700-1.600c-.7.2-1.400.3-2.100.3-2.300 0-4.300-.9-5.600-2.400 5.500-.1 9.600-3.200 9.900-7.800z" /></Svg>;
export const DirectoryIcon = (p: P) => <Svg {...p}><path d="M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM3 21c0-4.800 3.800-7.500 9-7.500s9 2.700 9 7.500z" /></Svg>;
