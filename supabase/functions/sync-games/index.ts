// supabase/functions/sync-games/index.ts
//
// Pulls the SEC + Big Ten schedule for a given week from CollegeFootballData.com
// and upserts it into the `games` table. Intended to run on a weekly cron
// (e.g. every Tuesday morning) so the upcoming slate is ready before picks open.
//
// Call with ?week=3 to force a specific week, or omit it to auto-detect the
// current week from the CFBD calendar.
//
// Required secrets (set via `supabase secrets set`):
//   CFBD_API_KEY              - free key from https://collegefootballdata.com/key
//   PICKEM_SEASON              - e.g. "2026" (optional, defaults to below)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CFBD_API_KEY = Deno.env.get('CFBD_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SEASON = Deno.env.get('PICKEM_SEASON') ?? '2026'
const CONFERENCES = ['SEC', 'B1G'] // CFBD abbreviations for SEC and Big Ten

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url)
    const weekParam = url.searchParams.get('week')
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    let week = weekParam ? Number(weekParam) : null

    if (!week) {
      const calRes = await fetch(
        `https://api.collegefootballdata.com/calendar?year=${SEASON}`,
        { headers: { Authorization: `Bearer ${CFBD_API_KEY}` } },
      )
      if (!calRes.ok) throw new Error(`CFBD calendar fetch failed: ${calRes.status}`)
      const calendar = await calRes.json()
      const now = Date.now()
      const current = calendar.find(
        (w: any) => new Date(w.firstGameStart).getTime() <= now && new Date(w.lastGameStart).getTime() >= now,
      )
      week = current ? current.week : calendar[0]?.week
      if (!week) throw new Error('Could not determine current week from CFBD calendar')
    }

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
        season: g.season,
        week: g.week,
        season_type: g.seasonType,
        start_date: g.startDate,
        home_team: g.homeTeam,
        away_team: g.awayTeam,
        home_conference: g.homeConference,
        away_conference: g.awayConference,
        home_points: g.homePoints ?? null,
        away_points: g.awayPoints ?? null,
        status: g.completed ? 'final' : g.homePoints != null ? 'in_progress' : 'scheduled',
        winner: g.completed ? (g.homePoints > g.awayPoints ? g.homeTeam : g.awayTeam) : null,
        updated_at: new Date().toISOString(),
      }))

    if (rows.length) {
      const { error } = await supabase.from('pickem_games').upsert(rows, { onConflict: 'id' })
      if (error) throw error
    }

    return new Response(JSON.stringify({ ok: true, week, gamesSynced: rows.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
