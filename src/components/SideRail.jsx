import ConferenceBadge from './ConferenceBadge'
import FootballIcon from './FootballIcon'

// Fixed decorative rails flanking the page on wide screens. Hidden below
// xl since there's no room for them without crowding the actual content.
export default function SideRail({ side }) {
  const isLeft = side === 'left'
  return (
    <div
      aria-hidden="true"
      className={`hidden xl:flex flex-col items-center gap-6 fixed top-1/2 -translate-y-1/2 ${
        isLeft ? 'left-6' : 'right-6'
      }`}
    >
      <FootballIcon className="w-10 h-6 -rotate-12 opacity-80" />
      <ConferenceBadge label={isLeft ? 'SEC' : 'BIG TEN'} className="w-28 h-28" />
      <FootballIcon className="w-10 h-6 rotate-12 opacity-80" />
    </div>
  )
}
