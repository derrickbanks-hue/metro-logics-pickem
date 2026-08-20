import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName || email.split('@')[0] },
      },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-4xl text-chalk tracking-wide">
            PICK<span className="text-amber">&apos;EM</span>
          </h1>
          <p className="text-chalkDim text-sm mt-2 font-mono">
            METRO LOGICS · SEC SEASON POOL
          </p>
        </div>

        {status === 'sent' ? (
          <div className="bg-panel border border-line rounded-md shadow-sm p-6 text-center">
            <p className="text-chalk font-medium">Check your inbox</p>
            <p className="text-chalkDim text-sm mt-2">
              We sent a sign-in link to <span className="text-chalk">{email}</span>. Open it on
              this device to get in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-panel border border-line rounded-md shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-chalkDim mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Derrick Banks"
                className="w-full bg-panelLight border border-line rounded px-3 py-2 text-chalk placeholder:text-chalkDim/50 focus:border-amber outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-chalkDim mb-1.5">
                Work email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@metrologics.com"
                className="w-full bg-panelLight border border-line rounded px-3 py-2 text-chalk placeholder:text-chalkDim/50 focus:border-amber outline-none"
              />
            </div>
            {status === 'error' && (
              <p className="text-crimson text-sm">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full bg-amber text-metroPrimary font-mono uppercase text-sm font-bold py-2.5 rounded hover:brightness-110 transition disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending link…' : 'Email me a sign-in link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
