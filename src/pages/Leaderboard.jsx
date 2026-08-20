import { useEffect, useState } from 'react'
import { supabase, SEASON } from '../lib/supabaseClient'

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      setMeId(userData?.user?.id ?? null)

      const { data, error } = await supabase
        .from('pickem_season_leaderboard')
        .select('*')
        .eq('season', SEASON)
        .order('total_points', { ascending: false })
        .order('win_pct', { ascending: false })

      if (!error) setRows(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <p className="text-chalkDim font-mono text-sm">LOADING STANDINGS…</p>
  }

  if (!rows.length) {
    return (
      <div className="text-center py-16">
        <p className="font-display font-bold text-2xl text-chalk">STANDINGS ARE EMPTY</p>
        <p className="text-chalkDim text-sm mt-2">
          They'll fill in once picks start getting scored.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-chalk tracking-wide mb-6">
        SEASON STANDINGS
      </h1>
      <div className="bg-panel border border-line rounded-md overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-chalkDim font-mono text-xs uppercase">
              <th className="text-left px-4 py-3 w-12">#</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-right px-4 py-3">Correct</th>
              <th className="text-right px-4 py-3">Win %</th>
              <th className="text-right px-4 py-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isMe = r.user_id === meId
              return (
                <tr
                  key={r.user_id}
                  className={`border-b border-line/50 last:border-0 ${isMe ? 'bg-amber/10' : ''}`}
                >
                  <td className="px-4 py-3 font-mono tabular-nums text-chalkDim">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-line bg-panelLight shrink-0">
                        {r.avatar_url ? (
                          <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-chalkDim font-mono">
                            {r.full_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className={isMe ? 'text-amber font-semibold' : 'text-chalk'}>
                        {r.full_name}
                      </span>
                      {r.department && (
                        <span className="text-chalkDim text-xs">{r.department}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-chalk">
                    {r.correct_picks}/{r.scored_picks}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-chalkDim">
                    {r.win_pct != null ? `${r.win_pct}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-amber font-bold">
                    {r.total_points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
