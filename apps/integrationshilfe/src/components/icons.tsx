import { createIcon } from '@chakra-ui/react'

const o = { fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const IcHeute = createIcon({ displayName: 'IcHeute', viewBox: '0 0 24 24', path: <g {...o}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4M9 15l2 2 4-4" /></g> })
export const IcVerlauf = createIcon({ displayName: 'IcVerlauf', viewBox: '0 0 24 24', path: <g {...o}><path d="M4 6h16M4 12h16M4 18h10" /></g> })
export const IcBericht = createIcon({ displayName: 'IcBericht', viewBox: '0 0 24 24', path: <g {...o}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></g> })
export const IcKinder = createIcon({ displayName: 'IcKinder', viewBox: '0 0 24 24', path: <g {...o}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.3" /><path d="M16 14.2c2.6.2 5 2.2 5 5.3" /></g> })
export const IcMehr = createIcon({ displayName: 'IcMehr', viewBox: '0 0 24 24', path: <g {...o}><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></g> })
export const IcHaken = createIcon({ displayName: 'IcHaken', viewBox: '0 0 24 24', path: <path {...o} d="M5 12.5l4.5 4.5L19 7.5" /> })
export const IcPfeilL = createIcon({ displayName: 'IcPfeilL', viewBox: '0 0 24 24', path: <path {...o} d="M15 5l-7 7 7 7" /> })
export const IcPfeilR = createIcon({ displayName: 'IcPfeilR', viewBox: '0 0 24 24', path: <path {...o} d="M9 5l7 7-7 7" /> })
export const IcPlus = createIcon({ displayName: 'IcPlus', viewBox: '0 0 24 24', path: <path {...o} d="M12 5v14M5 12h14" /> })
