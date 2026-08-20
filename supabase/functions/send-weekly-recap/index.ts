// supabase/functions/send-weekly-recap/index.ts
//
// Admin-only. Builds a personalized weekly recap (that person's record +
// full week results + top-10 season standings) and sends it via Brevo to
// every participant with an email on file. Triggered from the Admin page,
// not on a schedule.
//
// Required secrets:
//   BREVO_API_KEY        - from your Brevo account (same pattern as the
//                           Holmes Rd project tracker)
//   RECAP_SENDER_EMAIL    - e.g. pickem@metro-logics.com (optional, has a
//                           default below)
//   RECAP_SENDER_NAME     - optional, has a default below
//   PICKEM_SEASON          - e.g. "2026"
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are provided
// automatically by the Supabase platform.

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')!
const SENDER_EMAIL = Deno.env.get('RECAP_SENDER_EMAIL') ?? 'pickem@metro-logics.com'
const SENDER_NAME = Deno.env.get('RECAP_SENDER_NAME') ?? "Metro Logics Pick'em"
const SEASON = Deno.env.get('PICKEM_SEASON') ?? '2026'

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    // Identify the caller from their own session...
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !userData?.user) throw new Error('Not authenticated')

    // ...then use the service role to check admin status (RLS-safe: the
    // client's own token can't be trusted to self-report is_admin).
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: callerProfile, error: profErr } = await admin
      .from('pickem_profiles')
      .select('is_admin')
      .eq('id', userData.user.id)
      .single()
    if (profErr || !callerProfile?.is_admin) throw new Error('Admin access required')

    const { week } = await req.json()
    if (!week) throw new Error('week is required')

    const { data: games } = await admin
      .from('pickem_games')
      .select('*')
      .eq('season', Number(SEASON))
      .eq('week', Number(week))
      .order('start_date', { ascending: true })

    const { data: weekly } = await admin
      .from('pickem_weekly_leaderboard')
      .select('*')
      .eq('season', Number(SEASON))
      .eq('week', Number(week))

    const { data: season } = await admin
      .from('pickem_season_leaderboard')
      .select('*')
      .eq('season', Number(SEASON))
      .order('total_points', { ascending: false })
      .order('win_pct', { ascending: false })

    const { data: profiles } = await admin.from('pickem_profiles').select('id, full_name, email')

    const finalGames = (games ?? []).filter((g) => g.status === 'final')
    const gamesRows = finalGames
      .map(
        (g) => `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #0B3D6E;color:#FBFAF2;">${g.away_team} ${g.away_points} @ ${g.home_team} ${g.home_points}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #0B3D6E;color:#C18447;font-weight:bold;">${g.winner}</td>
        </tr>`,
      )
      .join('')

    const seasonRows = (season ?? [])
      .slice(0, 10)
      .map(
        (r: any, i: number) => `<tr>
          <td style="padding:4px 10px;color:#9FB3C8;">${i + 1}</td>
          <td style="padding:4px 10px;color:#FBFAF2;">${r.full_name}</td>
          <td style="padding:4px 10px;text-align:right;color:#C18447;font-weight:bold;">${r.total_points}</td>
        </tr>`,
      )
      .join('')

    const weeklyByUser: Record<string, any> = {}
    for (const w of weekly ?? []) weeklyByUser[w.user_id] = w

    let sent = 0
    let failed = 0

    for (const p of profiles ?? []) {
      if (!p.email) continue
      const mine = weeklyByUser[p.id]
      const myLine = mine
        ? `You went <strong style="color:#C18447;">${mine.correct_picks}/${mine.scored_picks}</strong> this week.`
        : `You didn't have any picks scored this week.`

      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;background:#002447;color:#FBFAF2;padding:28px;">
          <h1 style="color:#C18447;font-size:22px;margin:0 0 4px;">Week ${week} Recap</h1>
          <p style="font-size:14px;color:#9FB3C8;margin:0 0 20px;">Metro Logics Pick&apos;em &middot; SEC + Big Ten</p>
          <p style="font-size:15px;">${myLine}</p>

          <h2 style="font-size:15px;color:#FBFAF2;border-bottom:1px solid #0B3D6E;padding-bottom:6px;margin-top:24px;">Results</h2>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">${gamesRows}</table>

          <h2 style="font-size:15px;color:#FBFAF2;border-bottom:1px solid #0B3D6E;padding-bottom:6px;margin-top:24px;">Season Standings (Top 10)</h2>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">${seasonRows}</table>

          <p style="margin-top:28px;font-size:11px;color:#9FB3C8;">Make your Week ${Number(week) + 1} picks before kickoff.</p>
        </div>
      `

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { email: SENDER_EMAIL, name: SENDER_NAME },
          to: [{ email: p.email, name: p.full_name }],
          subject: `Pick'em Week ${week} Recap`,
          htmlContent: html,
        }),
      })
      if (res.ok) sent++
      else failed++
    }

    return new Response(JSON.stringify({ ok: true, emailsSent: sent, emailsFailed: failed }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
