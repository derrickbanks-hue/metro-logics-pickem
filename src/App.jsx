import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import NavBar from './components/NavBar'
import SideRail from './components/SideRail'
import Login from './pages/Login'
import WeeklyPicks from './pages/WeeklyPicks'
import Leaderboard from './pages/Leaderboard'
import MyHistory from './pages/MyHistory'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading, null = signed out
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      return
    }
    supabase
      .from('pickem_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data))
  }, [session])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-chalkDim font-mono text-sm">
        LOADING…
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar userEmail={session.user.email} profile={profile} />
      <SideRail side="left" />
      <SideRail side="right" />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <Routes>
          <Route path="/" element={<WeeklyPicks session={session} profile={profile} />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/history" element={<MyHistory session={session} />} />
          <Route
            path="/profile"
            element={profile ? <Profile profile={profile} onProfileChange={setProfile} /> : null}
          />
          <Route
            path="/admin"
            element={profile?.is_admin ? <Admin /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-chalkDim/60 font-mono py-6">
        METRO LOGICS PICK&apos;EM · SEC + BIG TEN
      </footer>
    </div>
  )
}
