import { useEffect, useState } from 'react'
import { supabase, SEASON } from '../lib/supabaseClient'

function initials(name) {
  return name?.charAt(0).toUpperCase() ?? '?'
}

// Simple, clearly-labeled projection — not a real statistical model. Each
// player's projected final score is their current points plus their own
// hit rate applied to the games still left to play (league-average 50%
// for anyone with no scored picks yet). Odds are those projections
// weighted with a bit of separation so the leaders stand out, normalized
// to sum to 100%.
function estimateOdds(rows, remainingGames) {
  const projected = rows.map((r) => {
    const hitRate = r.scored_picks > 0 ? r.correct_picks / r.scored_picks : 0.5
    return Math.max(r.total_points + remainingGames * hitRate, 0.01)
  })
  const weights = projected.map((p) => p ** 3)
  const total = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => (total > 0 ? (w / total) * 100 : 100 / rows.length))
}

function PodiumCard({ row, place, isMe, odds, movement }) {
  const sizes = {
    1: { avatar: 'w-20 h-20', name: 'text-base', points: 'text-3xl', pad: 'pt-2 pb-5', numeral: 'text-4xl' },
    2: { avatar: 'w-16 h-16', name: 'text-sm', points: 'text-2xl', pad: 'pt-2 pb-4', numeral: 'text-3xl' },
    3: { avatar: 'w-14 h-14', name: 'text-sm', points: 'text-xl', pad: 'pt-2 pb-3', numeral: 'text-2xl' },
  }[place]
  const numeralColor = place === 1 ? 'text-amber' : place === 2 ? 'text-steel' : 'text-crimson'

  return (
    <div
      className={`flex flex-col items-center bg-panel border rounded-md shadow-sm px-4 ${sizes.pad} ${
        isMe ? 'border-amber' : 'border-line'
      } ${place === 1 ? 'shadow-md' : ''}`}
    >
      <span className={`font-display font-bold ${sizes.numeral} ${numeralColor} leading-none mb-1`}>
        {place}
      </span>
      <div className={`${sizes.avatar} rounded-full overflow-hidden border border-line bg-panelLight shrink-0`}>
        {row.avatar_url ? (
          <img src={row.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-chalkDim font-mono">
            {initials(row.full_name)}
          </div>
        )}
      </div>
      <span className={`font-medium mt-2 text-center ${sizes.name} ${isMe ? 'text-amber' : 'text-chalk'}`}>
        {row.full_name}
      </span>
      <span className={`font-mono tabular-nums font-bold text-amber ${sizes.points}`}>
        {row.total_points}
      </span>
      <span className="font-mono text-[10px] text-chalkDim uppercase mt-0.5">
        {row.correct_picks}/{row.scored_picks} correct
      </span>
      {odds != null && (
        <span className="font-mono text-[10px] text-steel mt-1">{odds.toFixed(1)}% to win it all</span>
      )}
      {movement != null && movement !== 0 && (
        <span className={`font-mono text-[10px] mt-0.5 ${movement > 0 ? 'text-amber' : 'text-crimson'}`}>
          {movement > 0 ? `▲ ${movement}` : `▼ ${Math.abs(movement)}`} this week
        </span>
      )}
    </div>
  )
}

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState(null)
  const [remainingGames, setRemainingGames] = useState(0)
  const [movementByUser, setMovementByUser] = useState({})

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      setMeId(userData?.user?.id ?? null)

      const [{ data: leaderboardRows }, { data: gameStatuses }, { data: weeklyStandings }] = await Promise.all([
        supabase
          .from('pickem_season_leaderboard')
          .select('*')
          .eq('season', SEASON)
          .order('total_points', { ascending: false })
          .order('win_pct', { ascending: false }),
        supabase.from('pickem_games').select('status').eq('season', SEASON),
        supabase.from('pickem_weekly_standings').select('*').order('week', { ascending: false }),
      ])

      setRows(leaderboardRows ?? [])

      const total = gameStatuses?.length ?? 0
      const final = gameStatuses?.filter((g) => g.status === 'final').length ?? 0
      setRemainingGames(Math.max(total - final, 0))

      // Movement = rank last week vs rank this week. Needs at least two
      // distinct weeks of standings to be meaningful.
      const weeksPresent = [...new Set((weeklyStandings ?? []).map((r) => r.week))].sort((a, b) => b - a)
      if (weeksPresent.length >= 2) {
        const [currentWeek, prevWeek] = weeksPresent
        const currentRanks = {}
        const prevRanks = {}
        for (const r of weeklyStandings) {
          if (r.week === currentWeek) currentRanks[r.user_id] = r.rank_at_week
          if (r.week === prevWeek) prevRanks[r.user_id] = r.rank_at_week
        }
        const moves = {}
        for (const userId of Object.keys(currentRanks)) {
          if (prevRanks[userId] != null) {
            moves[userId] = prevRanks[userId] - currentRanks[userId]
          }
        }
        setMovementByUser(moves)
      }

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

  const odds = estimateOdds(rows, remainingGames)
  const top3 = rows.slice(0, 3)
  const rest = rows.slice(3)

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-chalk tracking-wide mb-6">
        SEASON STANDINGS
      </h1>

      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-3 sm:gap-5 mb-8 flex-wrap">
          {top3[1] && (
            <PodiumCard
              row={top3[1]}
              place={2}
              isMe={top3[1].user_id === meId}
              odds={odds[1]}
              movement={movementByUser[top3[1].user_id]}
            />
          )}
          {top3[0] && (
            <PodiumCard
              row={top3[0]}
              place={1}
              isMe={top3[0].user_id === meId}
              odds={odds[0]}
              movement={movementByUser[top3[0].user_id]}
            />
          )}
          {top3[2] && (
            <PodiumCard
              row={top3[2]}
              place={3}
              isMe={top3[2].user_id === meId}
              odds={odds[2]}
              movement={movementByUser[top3[2].user_id]}
            />
          )}
        </div>
      )}

      {rest.length > 0 && (
        <div className="bg-panel border border-line rounded-md overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-chalkDim font-mono text-xs uppercase">
                <th className="text-left px-4 py-3 w-12">#</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-right px-4 py-3">Correct</th>
                <th className="text-right px-4 py-3">Odds</th>
                <th className="text-right px-4 py-3">Wk</th>
                <th className="text-right px-4 py-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((r, i) => {
                const isMe = r.user_id === meId
                const rank = i + 4
                const move = movementByUser[r.user_id]
                return (
                  <tr
                    key={r.user_id}
                    className={`border-b border-line/50 last:border-0 ${isMe ? 'bg-amber/10' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono tabular-nums text-chalkDim">{rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-line bg-panelLight shrink-0">
                          {r.avatar_url ? (
                            <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-chalkDim font-mono">
                              {initials(r.full_name)}
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
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-steel">
                      {odds[i + 3].toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {move == null || move === 0 ? (
                        <span className="text-chalkDim">—</span>
                      ) : move > 0 ? (
                        <span className="text-amber">▲{move}</span>
                      ) : (
                        <span className="text-crimson">▼{Math.abs(move)}</span>
                      )}
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
      )}

      <p className="text-chalkDim text-[11px] font-mono mt-4 text-center">
        Odds are a simple projection from current record and games remaining — just for fun, not Vegas math.
      </p>
    </div>
  )
}
