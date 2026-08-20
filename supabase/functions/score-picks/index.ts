// supabase/functions/score-picks/index.ts
//
// Refreshes scores for a given week from CollegeFootballData.com, then grades
// every pick on any game that just went final (1 point per correct pick).
// Intended to run every 30-60 minutes on game days (Thu-Sat in season).
//
// Call with ?week=3 (required).
//
// Required secrets: same as sync-games (CFBD_API_KEY, PICKEM_SEASON).

import { createClient } from 'npm:@supabase/supabase-js@2'

const CFBD_API_KEY = Deno.env.get('CFBD_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SEASON = Deno.env.get('PICKEM_SEASON') ?? '2026'
const CONFERENCES = ['SEC', 'Big Ten']
const POINTS_PER_CORRECT_PICK = 1

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url)
    const week = url.searchParams.get('week')
    if (!week) throw new Error('week query param is required, e.g. ?week=3')

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // 1. Pull latest scores for this week's SEC + Big Ten games.
    const allGames: any[] = []
    for (const conf of CONFERENCES) {
      const res = await fetch(
        `https://api.collegefootballdata.com/games?year=${SEASON}&week=${week}&conference=${encodeURIComponent(conf)}`,
        { headers: { Authorization: `Bearer ${CFBD_API_KEY}` } },
      )
      if (!res.ok) throw new Error(`CFBD games fetch failed for ${conf}: ${res.status}`)
      allGames.push(...(await res.json()))
    }

    const seen = new Set<number>()
    const rows = allGames
      .filter((g) => (seen.has(g.id) ? false : (seen.add(g.id), true)))
      .map((g) => ({
        id: g.id,
        home_points: g.homePoints ?? null,
        away_points: g.awayPoints ?? null,
        status: g.completed ? 'final' : g.homePoints != null ? 'in_progress' : 'scheduled',
        winner: g.completed ? (g.homePoints > g.awayPoints ? g.homeTeam : g.awayTeam) : null,
        updated_at: new Date().toISOString(),
      }))

    if (rows.length) {
      // Partial upsert: only score-related columns. Requires the row to
      // already exist (created by sync-games), so we update rather than
      // upsert-with-defaults to avoid clobbering unrelated columns.
      for (const row of rows) {
        const { error } = await supabase.from('pickem_games').update(row).eq('id', row.id)
        if (error) throw error
      }
    }

    // 2. Grade picks for any game that is now final and not yet scored.
    const { data: finalGames, error: fgErr } = await supabase
      .from('pickem_games')
      .select('id, winner')
      .eq('season', Number(SEASON))
      .eq('week', Number(week))
      .eq('status', 'final')
      .eq('scored', false)
    if (fgErr) throw fgErr

    let scoredGames = 0
    let scoredPicks = 0

    for (const game of finalGames ?? []) {
      const { data: picks, error: pErr } = await supabase
        .from('pickem_picks')
        .select('id, picked_team')
        .eq('game_id', game.id)
      if (pErr) throw pErr

      for (const pick of picks ?? []) {
        const isCorrect = pick.picked_team === game.winner
        const { error: upErr } = await supabase
          .from('pickem_picks')
          .update({
            is_correct: isCorrect,
            points_earned: isCorrect ? POINTS_PER_CORRECT_PICK : 0,
          })
          .eq('id', pick.id)
        if (upErr) throw upErr
        scoredPicks++
      }

      const { error: gErr } = await supabase.from('pickem_games').update({ scored: true }).eq('id', game.id)
      if (gErr) throw gErr
      scoredGames++
    }

    return new Response(
      JSON.stringify({ ok: true, scoresUpdated: rows.length, gamesGraded: scoredGames, picksGraded: scoredPicks }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
