import ConferenceBadge from './ConferenceBadge'
import FootballIcon from './FootballIcon'

// Fixed decorative rails flanking the page on wide screens. Shown at 2xl+
// where there's a generous side gutter (~256px+) to actually fill instead
// of crowding the main content column.
export default function SideRail({ side }) {
  const isLeft = side === 'left'
  return (
    <div
      aria-hidden="true"
      className={`hidden 2xl:flex flex-col items-center gap-8 fixed top-1/2 -translate-y-1/2 ${
        isLeft ? 'left-10' : 'right-10'
      }`}
    >
      <FootballIcon className="w-16 h-10 -rotate-12 opacity-80" />
      <ConferenceBadge label={isLeft ? 'SEC' : 'BIG TEN'} className="w-48 h-48" />
      <FootballIcon className="w-16 h-10 rotate-12 opacity-80" />
    </div>
  )
}
