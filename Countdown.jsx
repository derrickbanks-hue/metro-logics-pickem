import { useEffect, useState } from 'react'

function getParts(target) {
  const diff = Math.max(0, target - Date.now())
  const totalMinutes = Math.floor(diff / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  return { diff, days, hours, minutes }
}

export default function Countdown({ startDate }) {
  const target = new Date(startDate).getTime()
  const [parts, setParts] = useState(() => getParts(target))

  useEffect(() => {
    const id = setInterval(() => setParts(getParts(target)), 30000)
    return () => clearInterval(id)
  }, [target])

  if (parts.diff <= 0) return null

  const label =
    parts.days > 0
      ? `LOCKS IN ${parts.days}D ${parts.hours}H`
      : parts.hours > 0
      ? `LOCKS IN ${parts.hours}H ${parts.minutes}M`
      : `LOCKS IN ${parts.minutes}M`

  const urgent = parts.days === 0 && parts.hours < 2

  return (
    <span className={`font-mono tabular-nums text-xs tracking-wide ${urgent ? 'text-amber' : 'text-chalkDim'}`}>
      {label}
    </span>
  )
}
