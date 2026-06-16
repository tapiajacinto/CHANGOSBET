import { SVGProps } from 'react';

export type IconName =
  | 'user' | 'users' | 'idCard' | 'phone' | 'mail' | 'lock' | 'calendar' | 'eye' | 'eyeOff'
  | 'arrowRight' | 'arrowLeft' | 'chevronRight' | 'chevronDown' | 'check' | 'x' | 'plus' | 'minus'
  | 'bell' | 'wallet' | 'logout' | 'shield' | 'search' | 'home' | 'coins' | 'trophy' | 'dice'
  | 'refresh' | 'copy' | 'alert' | 'menu' | 'sparkles' | 'chip' | 'cards' | 'roulette' | 'horse' | 'ball'
  | 'sun' | 'moon'
  | 'spade' | 'heart' | 'diamond' | 'club';

const STROKE: Record<string, JSX.Element> = {
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" /><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6" /><path d="M16.5 14c2.5.4 4.5 2.3 4.5 5" /></>,
  idCard: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="8.5" cy="11" r="2" /><path d="M5.5 16c.4-1.6 1.6-2.4 3-2.4s2.6.8 3 2.4" /><path d="M14 9.5h4M14 12.5h4M14 15.5h2.5" /></>,
  phone: <path d="M6.5 4h3l1.5 4-2 1.2a12 12 0 0 0 5.8 5.8L16 13l4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M4 4l16 16" /><path d="M9.5 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3.2 3.8" /><path d="M6.2 7.7A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1 0 1.9-.2 2.8-.5" /></>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  check: <path d="M5 12.5 10 17.5 19.5 6.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><circle cx="16.5" cy="13.5" r="1.2" /></>,
  logout: <><path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" /><path d="M10 12h10M17 8l3 4-3 4" /></>,
  shield: <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  home: <path d="M4 11 12 4l8 7M6 9.5V20h12V9.5" />,
  coins: <><ellipse cx="9" cy="7" rx="5.5" ry="2.6" /><path d="M3.5 7v5c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6V7" /><path d="M14.5 12.2c2.7.2 4.9 1.3 4.9 2.6 0 1.4-2.5 2.6-5.5 2.6-1 0-2-.1-2.8-.4" /></>,
  trophy: <><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 3M17 6h2.5a2.5 2.5 0 0 1-2.5 3" /><path d="M12 13v3M9 20h6M10 20l.5-4h3l.5 4" /></>,
  dice: <><rect x="4" y="4" width="16" height="16" rx="3.5" /><circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none" /><circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none" /></>,
  refresh: <path d="M20 11a8 8 0 0 0-14-4.5L4 8m0-4v4h4M4 13a8 8 0 0 0 14 4.5L20 16m0 4v-4h-4" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2.2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
  alert: <><path d="M12 4 3 19h18L12 4Z" /><path d="M12 10v4" /><circle cx="12" cy="16.5" r=".6" fill="currentColor" stroke="none" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  sparkles: <path d="M12 4l1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z" />,
  chip: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6 6l2.2 2.2M15.8 15.8 18 18M18 6l-2.2 2.2M8.2 15.8 6 18" /></>,
  cards: <><rect x="4" y="6" width="10" height="13" rx="2" transform="rotate(-8 9 12)" /><rect x="10" y="5" width="10" height="13" rx="2" transform="rotate(8 15 11)" /></>,
  roulette: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2" /><path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6 6 18" /></>,
  horse: <path d="M5 19c0-5 2-7 4-8 0-2 1-4 3-4l1.5 2 3-1-1 3c1 1 1.5 2.5 1.5 4 0 0-2-1-3 0-1.5 1.5-2 4-2 4" />,
  ball: <><circle cx="12" cy="12" r="8.5" /><path d="m12 7 2.8 2-1 3.3h-3.6l-1-3.3Z" /><path d="m12 9.5 1.8 1.3M12 9.5l-1.8 1.3M9.8 12.3 8 15M14.2 12.3 16 15M9 17h6" /></>,
};

const FILL: Record<string, JSX.Element> = {
  spade: <path d="M12 3C9 6 4.5 8.5 4.5 12.5c0 2.2 1.7 3.7 3.7 3.7 1 0 1.9-.4 2.5-1-.2 1.6-.9 2.8-1.9 3.8h6.4c-1-1-1.7-2.2-1.9-3.8.6.6 1.5 1 2.5 1 2 0 3.7-1.5 3.7-3.7C19.5 8.5 15 6 12 3Z" />,
  heart: <path d="M12 20S3.5 14.5 3.5 8.8C3.5 6 5.6 4 8.1 4c1.7 0 3.1.9 3.9 2.3C12.8 4.9 14.2 4 15.9 4c2.5 0 4.6 2 4.6 4.8C20.5 14.5 12 20 12 20Z" />,
  diamond: <path d="M12 3 19 12 12 21 5 12 12 3Z" />,
  club: <path d="M12 3a3.2 3.2 0 0 0-2.4 5.3A3.2 3.2 0 1 0 11 14c-.1 1.4-.7 2.5-1.7 3.4h5.4c-1-.9-1.6-2-1.7-3.4a3.2 3.2 0 1 0 1.4-5.7A3.2 3.2 0 0 0 12 3Z" />,
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, className, ...rest }: IconProps) {
  const isFill = name in FILL;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={isFill ? 'currentColor' : 'none'}
      stroke={isFill ? 'none' : 'currentColor'}
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden {...rest}
    >
      {isFill ? FILL[name] : STROKE[name]}
    </svg>
  );
}
