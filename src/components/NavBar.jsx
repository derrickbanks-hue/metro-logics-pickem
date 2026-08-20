import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import MetroMark from './MetroMark'

const linkClass = ({ isActive }) =>
  `px-3 py-1.5 text-sm font-mono tracking-wide uppercase transition-colors border-b-2 ${
    isActive
      ? 'text-amber border-amber'
      : 'text-chalkDim border-transparent hover:text-chalk hover:border-line'
  }`

export default function NavBar({ userEmail, profile }) {
  const initial = (profile?.full_name ?? userEmail ?? '?').charAt(0).toUpperCase()

  return (
    <header className="border-b border-line bg-panel/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <MetroMark className="h-9 shrink-0" />
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>This Week</NavLink>
            <NavLink to="/leaderboard" className={linkClass}>Leaderboard</NavLink>
            <NavLink to="/history" className={linkClass}>My History</NavLink>
            {profile?.is_admin && (
              <NavLink to="/admin" className={linkClass}>Admin</NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <NavLink to="/profile" title="My profile">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-line bg-panelLight">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-chalkDim font-mono">
                  {initial}
                </div>
              )}
            </div>
          </NavLink>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-xs font-mono uppercase text-chalkDim hover:text-amber transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
      <nav className="sm:hidden flex items-center gap-1 px-4 pb-2 -mt-1 flex-wrap">
        <NavLink to="/" end className={linkClass}>This Week</NavLink>
        <NavLink to="/leaderboard" className={linkClass}>Leaderboard</NavLink>
        <NavLink to="/history" className={linkClass}>History</NavLink>
        {profile?.is_admin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
      </nav>
    </header>
  )
}
