import type { CSSProperties } from 'react';

export type IconName = 'arrow' | 'arrowUp' | 'pin' | 'star' | 'spark' | 'grid' | 'calendar' | 'chart' | 'check' | 'link' | 'search' | 'menu' | 'close' | 'plus' | 'chevron' | 'globe' | 'shield' | 'message' | 'settings' | 'download' | 'clock' | 'play' | 'leaf';
const paths: Record<IconName, string> = {
  arrow: 'M4 12h16m-6-6 6 6-6 6', arrowUp: 'M6 18 18 6M6 6h12v12',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z',
  spark: 'm12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z',
  grid: 'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM7 3v4m10-4v4M3 11h18M7 15h2m4 0h4m-10 3h2',
  chart: 'M4 3v17h17M8 15l4-5 4 2 5-7', check: 'm5 12 4 4L19 6',
  link: 'm9 15 6-6M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 10a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-1 1',
  search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6', menu: 'M4 6h16M4 12h16M4 18h16', close: 'm5 5 14 14M5 19 19 5', plus: 'M12 4v16M4 12h16', chevron: 'm9 5 7 7-7 7',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Zm-4 9 3 3 5-6',
  message: 'M4 4h16v12H9l-5 5ZM8 8h8m-8 4h5', settings: 'M4 6h16M4 18h16M8 3v6m8 6v6M4 12h16m-4-3v6', download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-5v5l3 2', play: 'm9 5 11 7-11 7Z', leaf: 'M20 3C7 3 2 8 5 15s15 4 15-12ZM4 21 16 9',
};
export default function Icon({ name, size = 20, className, style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true"><path d={paths[name]} /></svg>;
}
