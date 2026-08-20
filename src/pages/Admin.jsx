import { useEffect, useState } from 'react'
import { supabase, SEASON } from '../lib/supabaseClient'

export default function Admin() {
  const [weeks, setWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [games, setGames] = useState([])
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [sendState, setSendState] = useState('idle') // idle | sending | done | error
  const [sendResult, setSendResult] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: gameRows } = await supabase
        .from('pickem_games')
        .select('week')
        .eq('season', SEASON)
        .order('week', { ascending: true })
      const weekList = [...new Set((gameRows ?? []).map((g) => g.week))]
      setWeeks(weekList)
      setSelectedWeek(weekList[weekList.length - 1] ?? null)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedWeek) return
    async function loadWeek() {
      const { data: gameRows } = await supabase
        .from('pickem_games')
        .select('*')
        .eq('season', SEASON)
        .eq('week', selectedWeek)
        .order('start_date', { ascending: true })
      setGames(gameRows ?? [])

      const { data: standingRows } = await supabase
        .from('pickem_weekly_leaderboard')
        .select('*')
        .eq('season', SEASON)
        .eq('week', selectedWeek)
        .order('points', { ascending: false })
      setStandings(standingRows ?? [])
    }
    loadWeek()
  }, [selectedWeek])

  async function sendRecap() {
    setSendState('sending')
    setSendResult(null)
    const { data, error } = await supabase.functions.invoke('send-weekly-recap', {
      body: { week: selectedWeek },
    })
    if (error) {
      setSendState('error')
      setSendResult(error.message ?? 'Send failed')
      return
    }
    setSendState('done')
    setSendResult(`Sent to ${data?.emailsSent ?? 0} people.`)
  }

  if (loading) return <p className="text-chalkDim font-mono text-sm">LOADING…</p>

  const finalCount = games.filter((g) => g.status === 'final').length

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-chalk tracking-wide mb-6">ADMIN · WEEKLY RECAP</h1>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <label className="text-xs font-mono uppercase text-chalkDim">Week</label>
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
        <span className="text-xs font-mono text-chalkDim">
          {finalCount}/{games.length} games final
        </span>
      </div>

      <div className="bg-panel border border-line rounded-md overflow-hidden shadow-sm mb-6">
        <div className="px-4 py-3 border-b border-line font-mono text-xs uppercase text-chalkDim">
          This week&apos;s results
        </div>
        <div className="divide-y divide-line/50">
          {games.map((g) => (
            <div key={g.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="text-chalkDim">
                {g.away_team} @ {g.home_team}
              </span>
              <span className="font-mono tabular-nums text-chalk">
                {g.status === 'final'
                  ? `${g.away_points}-${g.home_points} · ${g.winner}`
                  : g.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          ))}
          {games.length === 0 && (
            <div className="px-4 py-4 text-sm text-chalkDim">No games synced for this week.</div>
          )}
        </div>
      </div>

      <div className="bg-panel border border-line rounded-md overflow-hidden shadow-sm mb-6">
        <div className="px-4 py-3 border-b border-line font-mono text-xs uppercase text-chalkDim">
          Weekly standings preview
        </div>
        <div className="divide-y divide-line/50">
          {standings.map((s, i) => (
            <div key={s.user_id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="text-chalk">
                {i + 1}. {s.full_name}
              </span>
              <span className="font-mono tabular-nums text-chalkDim">
                {s.correct_picks}/{s.scored_picks}
              </span>
            </div>
          ))}
          {standings.length === 0 && (
            <div className="px-4 py-4 text-sm text-chalkDim">Nobody has picks scored yet.</div>
          )}
        </div>
      </div>

      <button
        onClick={sendRecap}
        disabled={sendState === 'sending' || finalCount === 0}
        className="bg-amber text-metroPrimary font-mono uppercase text-sm font-bold px-5 py-2.5 rounded hover:brightness-110 transition disabled:opacity-50"
      >
        {sendState === 'sending' ? 'Sending…' : `Send Week ${selectedWeek} recap to everyone`}
      </button>
      {finalCount === 0 && (
        <p className="text-chalkDim text-xs font-mono mt-2">
          No games are final yet this week — nothing to recap.
        </p>
      )}
      {sendResult && (
        <p className={`text-sm font-mono mt-3 ${sendState === 'error' ? 'text-crimson' : 'text-amber'}`}>
          {sendResult}
        </p>
      )}
    </div>
  )
}
