// Original, generic helmet silhouette — not a reproduction of any specific
// team's actual helmet design or logo. Colored using the team's real school
// colors (facts, not IP) via props, with a plain center stripe, which is a
// generic design element used across the sport broadly, not owned by any
// one team.
export default function TeamHelmet({ primary = '#5C7085', secondary = '#FFFFFF', className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 48 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 24C6 12 15 4 26 4C35 4 41 11 41 20C41 28 35 33 26 34L18 34C10 34 6 30 6 24Z"
        fill={primary}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />
      <path
        d="M24 4.5C24 4.5 27 18 25 33.5"
        stroke={secondary}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M14 26C8 27 5 31 6 35"
        stroke={secondary}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M19 30C14 30.5 11 34 12 37"
        stroke={secondary}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="28" cy="20" r="2.5" fill="rgba(0,0,0,0.2)" />
    </svg>
  )
}
