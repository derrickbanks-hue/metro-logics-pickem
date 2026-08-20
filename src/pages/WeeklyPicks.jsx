import { useEffect, useMemo, useState } from 'react'
import { supabase, SEASON } from '../lib/supabaseClient'
import GameCard from '../components/GameCard'

function pickDefaultWeek(games) {
  if (!games.length) return null
  const weeks = [...new Set(games.map((g) => g.week))].sort((a, b) => a - b)
  for (const w of weeks) {
    const weekGames = games.filter((g) => g.week === w)
    const allFinal = weekGames.every((g) => g.status === 'final')
    if (!allFinal) return w
  }
  return weeks[weeks.length - 1]
}

export default function WeeklyPicks({ session }) {
  const userId = session.user.id
  const [games, setGames] = useState([])
  const [picks, setPicks] = useState({}) // game_id -> pick row
  const [teamColors, setTeamColors] = useState({}) // team name -> { primary_color, secondary_color }
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error

  async function loadData() {
    setLoading(true)
    const { data: gameRows } = await supabase
      .from('pickem_games')
      .select('*')
      .eq('season', SEASON)
      .order('start_date', { ascending: true })

    const { data: pickRows } = await supabase
      .from('pickem_picks')
      .select('*')
      .eq('user_id', userId)

    const { data: colorRows } = await supabase
      .from('pickem_team_colors')
      .select('*')

    setGames(gameRows ?? [])
    const pickMap = {}
    for (const p of pickRows ?? []) pickMap[p.game_id] = p
    setPicks(pickMap)
    const colorMap = {}
    for (const c of colorRows ?? []) colorMap[c.team] = c
    setTeamColors(colorMap)
    setSelectedWeek((current) => current ?? pickDefaultWeek(gameRows ?? []))
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const weeks = useMemo(() => [...new Set(games.map((g) => g.week))].sort((a, b) => a - b), [games])
  const weekGames = useMemo(
    () => games.filter((g) => g.week === selectedWeek).sort((a, b) => new Date(a.start_date) - new Date(b.start_date)),
    [games, selectedWeek],
  )

  const correctSoFar = weekGames.filter((g) => picks[g.id]?.is_correct === true).length
  const scoredSoFar = weekGames.filter((g) => picks[g.id]?.is_correct !== null && picks[g.id]?.is_correct !== undefined).length

  async function handlePick(gameId, team) {
    setSaveState('saving')
    const { data, error } = await supabase
      .from('pickem_picks')
      .upsert(
        { user_id: userId, game_id: gameId, picked_team: team },
        { onConflict: 'user_id,game_id' },
      )
      .select()
      .single()

    if (error) {
      setSaveState('error')
      return
    }
    setPicks((prev) => ({ ...prev, [gameId]: data }))
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 1500)
  }

  if (loading) {
    return <p className="text-chalkDim font-mono text-sm">LOADING SLATE…</p>
  }

  if (!games.length) {
    return (
      <div className="text-center py-16">
        <p className="font-display font-bold text-2xl text-chalk">NO GAMES SYNCED YET</p>
        <p className="text-chalkDim text-sm mt-2">
          Check back once this week's SEC and Big Ten slate has loaded.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-chalk tracking-wide">
            WEEK {selectedWeek}
          </h1>
          {scoredSoFar > 0 && (
            <p className="text-chalkDim text-sm font-mono mt-1">
              {correctSoFar} / {scoredSoFar} correct so far
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {saveState === 'saving' && <span className="text-xs font-mono text-chalkDim">SAVING…</span>}
          {saveState === 'saved' && <span className="text-xs font-mono text-amber">SAVED ✓</span>}
          {saveState === 'error' && <span className="text-xs font-mono text-crimson">SAVE FAILED</span>}
          {weeks.length > 1 && (
            <select
              value={selectedWeek ?? ''}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="bg-panelLight border border-line rounded px-3 py-1.5 text-sm font-mono text-chalk"
            >
              {weeks.map((w) => (
                <option key={w} value={w}>
                  WEEK {w}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {weekGames.map((g) => (
          <GameCard key={g.id} game={g} pick={picks[g.id]} onPick={handlePick} teamColors={teamColors} />
        ))}
      </div>
    </div>
  )
}
