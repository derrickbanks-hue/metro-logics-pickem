import FootballIcon from './FootballIcon'

// Original badge design using the conference's plain name as text, styled
// in the app's own typography — not a reproduction of either conference's
// actual logo/emblem artwork.
export default function ConferenceBadge({ label, className = 'w-24 h-24' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-full border-4 border-amber bg-white shadow-lg ${className}`}
    >
      <span className="font-display font-bold text-metroPrimary tracking-wide text-lg text-center leading-tight px-3">
        {label}
      </span>
      <FootballIcon className="w-10 h-6" />
    </div>
  )
}
