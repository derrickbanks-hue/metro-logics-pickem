import { useEffect, useState } from 'react'
import { supabase, SEASON } from '../lib/supabaseClient'

export default function WeeklyStandingWidget({ week, userId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!week) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('pickem_weekly_leaderboard')
        .select('*')
        .eq('season', SEASON)
        .eq('week', week)
        .order('points', { ascending: false })
      if (!cancelled) {
        setRows(data ?? [])
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [week])

  if (loading || rows.length === 0) return null

  // Nothing scored yet this week for anyone — comparison isn't meaningful yet.
  const anyScored = rows.some((r) => r.scored_picks > 0)
  if (!anyScored) return null

  const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }))
  const me = ranked.find((r) => r.user_id === userId)
  const top3 = ranked.slice(0, 3)

  return (
    <div className="bg-panel border border-line rounded-md shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <span className="font-mono text-xs uppercase text-chalkDim">This week vs. the field</span>
        {me && (
          <span className="font-mono text-sm text-chalk">
            You're <span className="text-amber font-bold">#{me.rank}</span> of {ranked.length} ·{' '}
            <span className="tabular-nums">{me.correct_picks}/{me.scored_picks}</span> correct
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {top3.map((r) => (
          <div key={r.user_id} className="flex items-center justify-between text-sm">
            <span className={`flex items-center gap-2 ${r.user_id === userId ? 'text-amber font-semibold' : 'text-chalk'}`}>
              <span className="font-mono text-xs text-chalkDim w-4">{r.rank}</span>
              {r.avatar_url ? (
                <img src={r.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-panelLight flex items-center justify-center text-[8px] font-mono text-chalkDim">
                  {r.full_name?.charAt(0).toUpperCase()}
                </span>
              )}
              {r.full_name}
            </span>
            <span className="font-mono tabular-nums text-chalkDim">
              {r.correct_picks}/{r.scored_picks}
            </span>
          </div>
        ))}
        {me && me.rank > 3 && (
          <div className="flex items-center justify-between text-sm pt-1.5 border-t border-line/50">
            <span className="flex items-center gap-2 text-amber font-semibold">
              <span className="font-mono text-xs text-chalkDim w-4">{me.rank}</span>
              {me.avatar_url ? (
                <img src={me.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-panelLight flex items-center justify-center text-[8px] font-mono text-chalkDim">
                  {me.full_name?.charAt(0).toUpperCase()}
                </span>
              )}
              {me.full_name} (you)
            </span>
            <span className="font-mono tabular-nums text-chalkDim">
              {me.correct_picks}/{me.scored_picks}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
