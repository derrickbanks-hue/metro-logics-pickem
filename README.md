# Metro Logics Pick'em

Company-wide, straight-up pick'em challenge covering every SEC and Big Ten
game each week. Branded to Metro Logics' official brand guidelines
(navy #002447 / blue #008FD4 / accent #C18447, Poppins throughout), with
individual employee logins, avatar photos, and an admin-only weekly recap
emailer. Built on Vite + React + Supabase + Netlify.

## What's already live

**Supabase — "Derrick's Project" (`xgmbhovyluyhtlhxbffq`)**
- Schema applied: `pickem_profiles`, `pickem_games`, `pickem_picks`, plus
  `pickem_season_leaderboard` / `pickem_weekly_leaderboard` views. Tables are
  prefixed `pickem_` to match this project's existing `cc_` / `gemba_` /
  `mlc_` naming convention — no collisions with your other apps.
- `pickem-avatars` storage bucket created, public read, upload/update/delete
  scoped to each user's own folder.
- RLS is on everywhere: picks lock at kickoff at the database level, other
  people's picks stay hidden until their game starts, and only the service
  role (Edge Functions) can flip `is_admin` — a user can't self-promote via
  the normal "update your profile" endpoint.
- All three Edge Functions are deployed and ACTIVE: `sync-games`,
  `score-picks`, `send-weekly-recap`.
- Ran the security advisor after deploying and hardened everything it
  flagged in the new schema (view `security_invoker`, function
  `search_path`).

**Netlify**
- Site created: `metro-logics-pickem` (site id
  `48b6a0eb-710e-42d6-afcb-2cbab2d58f35`), live at
  `https://metro-logics-pickem.netlify.app`.
- Env vars already set: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_SEASON`.
- `netlify.toml` included (build command, publish dir, SPA redirect).

**Branding**
- Real Metro Logics icon logo (from `M_logo.png`) is bundled in at
  `src/assets/metro-icon.png` and used in the nav bar via `MetroMark.jsx`.
- Colors and type pulled directly from `Metro_Logics_Brand_Guidance.pdf`:
  Primary `#002447`, Secondary `#008FD4`, Accent `#C18447`, Poppins Bold for
  headings/CTAs, Poppins Regular for body (Calibri fallback per the brand
  doc). Football feel comes through in a subtle yard-line background texture
  and the leather-tone accent color, not through off-brand colors or fonts.

## What's left — three things

### 1. Deploy the frontend files

I couldn't push the build from this environment — Netlify's deploy proxy
isn't reachable from my sandbox (network policy blocks it), so this last
step needs to happen from a machine with normal internet access. Easiest
options, in order of effort:

**A. Drag-and-drop (no CLI needed)**
```bash
npm install
npm run build
```
Then go to `https://app.netlify.com/projects/metro-logics-pickem`, open the
**Deploys** tab, and drag the `dist` folder onto the page.

**B. Netlify CLI**
```bash
npm install
npm run build
npx netlify-cli deploy --prod --dir=dist --site=48b6a0eb-710e-42d6-afcb-2cbab2d58f35
```

**C. Connect to GitHub (best long-term)**
Push this folder to a repo, then in the Netlify dashboard connect the site
to that repo for continuous deployment. Build command `npm run build`,
publish directory `dist` — already set in `netlify.toml`.

### 2. Set two sets of API keys as Supabase Edge Function secrets

I don't have a tool that can set these for you, so this needs to happen in
the Supabase dashboard (**Project Settings > Edge Functions > Secrets**) or
via CLI (`supabase secrets set KEY=value --project-ref xgmbhovyluyhtlhxbffq`):

| Secret | Where to get it |
|---|---|
| `CFBD_API_KEY` | Free key at [collegefootballdata.com/key](https://collegefootballdata.com/key) |
| `PICKEM_SEASON` | `2026` |
| `BREVO_API_KEY` | Your existing Brevo account (same one the Holmes Rd tracker uses) |
| `RECAP_SENDER_EMAIL` | e.g. `pickem@metro-logics.com` (optional — has a default) |
| `RECAP_SENDER_NAME` | e.g. `Metro Logics Pick'em` (optional — has a default) |

### 3. Schedule the two sync jobs and make yourself admin

- In the Supabase dashboard under **Edge Functions**, add a cron schedule to
  `sync-games` for `0 6 * * 2` (Tuesday 6am, loads the week's slate) and to
  `score-picks` for something like `*/30 * * * 4,5,6` (Thu/Fri/Sat, refreshes
  scores and grades picks). `score-picks` needs `?week=<current_week>` in
  the invocation URL.
- Sign in to the deployed app once with your own email so your profile row
  exists, then run this in the Supabase SQL editor to make yourself an
  admin (this is the only way to grant the first admin — everything after
  that you can do from the Admin tab):

  ```sql
  update public.pickem_profiles
  set is_admin = true
  where email = 'your-email@metro-logics.com';
  ```

## How it works day to day

- Every SEC and Big Ten game each week loads itself automatically — nobody
  enters a schedule by hand.
- 1 point per correct pick, straight-up (no spreads). Season leaderboard =
  total correct picks.
- Picks lock at kickoff, enforced by the database.
- Employees upload their own avatar photo from the Profile page (top-right
  of the nav bar).
- You (as admin) get an **Admin** tab in the nav. It shows the week's
  results and standings preview, with a "Send Week N recap to everyone"
  button that emails every participant a personalized recap (their record +
  full results + top 10 standings) via Brevo.

## Local development

```bash
cp .env.example .env   # fill in from Supabase Project Settings > API
npm install
npm run dev
```

## Extending it

- **Department leaderboards**: `pickem_season_leaderboard` already carries
  `department`; group by it for a divisional standings view.
- **Scheduled recap sends**: right now the recap only sends when you click
  the button in Admin. If you'd rather it go out automatically every Monday,
  add a cron schedule to `send-weekly-recap` too — you'd just need to swap
  its admin-JWT check for a service-role check (or a shared secret) since a
  cron job doesn't have a logged-in user's session.
- **Confidence points later**: if you ever want to move off straight-up
  picks, add a `confidence` column to `pickem_picks` and adjust the scoring
  line in `score-picks` — the rest of the schema doesn't need to change.
