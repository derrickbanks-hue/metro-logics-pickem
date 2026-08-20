// Plain generic football illustration for decorative use. A football's
// shape and lacing pattern are standard sporting-goods design, not
// protected IP tied to any team, league, or conference.
export default function FootballIcon({ className = 'w-10 h-6', color = '#C18447' }) {
  return (
    <svg viewBox="0 0 48 28" className={className} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="14" rx="22" ry="12" fill={color} stroke="#002447" strokeWidth="1" />
      <line x1="16" y1="14" x2="32" y2="14" stroke="#FBFAF2" strokeWidth="2" />
      <line x1="19" y1="10" x2="19" y2="18" stroke="#FBFAF2" strokeWidth="1.5" />
      <line x1="23" y1="9" x2="23" y2="19" stroke="#FBFAF2" strokeWidth="1.5" />
      <line x1="27" y1="9" x2="27" y2="19" stroke="#FBFAF2" strokeWidth="1.5" />
      <line x1="29" y1="10" x2="29" y2="18" stroke="#FBFAF2" strokeWidth="1.5" />
    </svg>
  )
}
