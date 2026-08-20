import { useEffect, useState } from 'react'
import { supabase, SEASON } from '../lib/supabaseClient'

export default function MyHistory({ session }) {
  const [weeks, setWeeks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('pickem_picks')
        .select(
          'picked_team, is_correct, points_earned, pickem_games!inner(week, season, home_team, away_team, winner, status, start_date)',
        )
        .eq('user_id', session.user.id)
        .eq('pickem_games.season', SEASON)
        .order('start_date', { referencedTable: 'pickem_games', ascending: true })

      if (!error) {
        const byWeek = {}
        for (const row of data ?? []) {
          const w = row.pickem_games.week
          byWeek[w] = byWeek[w] || []
          byWeek[w].push(row)
        }
        const weekList = Object.entries(byWeek)
          .map(([week, picks]) => ({ week: Number(week), picks }))
          .sort((a, b) => b.week - a.week)
        setWeeks(weekList)
      }
      setLoading(false)
    }
    load()
  }, [session.user.id])

  if (loading) {
    return <p className="text-chalkDim font-mono text-sm">LOADING HISTORY…</p>
  }

  if (!weeks.length) {
    return (
      <div className="text-center py-16">
        <p className="font-display font-bold text-2xl text-chalk">NO PICKS YET</p>
        <p className="text-chalkDim text-sm mt-2">Head to This Week to get started.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-chalk tracking-wide mb-6">MY HISTORY</h1>
      <div className="space-y-6">
        {weeks.map(({ week, picks }) => {
          const scored = picks.filter((p) => p.is_correct !== null)
          const correct = scored.filter((p) => p.is_correct).length
          return (
            <div key={week} className="bg-panel border border-line rounded-md overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                <span className="font-mono text-sm text-chalk uppercase">Week {week}</span>
                {scored.length > 0 && (
                  <span className="font-mono text-sm text-amber">
                    {correct}/{scored.length}
                  </span>
                )}
              </div>
              <div className="divide-y divide-line/50">
                {picks.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span className="text-chalkDim">
                      {p.pickem_games.away_team} @ {p.pickem_games.home_team}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-chalk font-mono">{p.picked_team}</span>
                      {p.is_correct === true && <span className="text-amber">✓</span>}
                      {p.is_correct === false && <span className="text-crimson">✗</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
