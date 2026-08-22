import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Code-based sign-in instead of a clickable magic link. Corporate email
// security scanners (Microsoft Defender Safe Links and similar) auto-visit
// every link in incoming mail to check for malware, which burns Supabase's
// single-use magic link before the real person ever clicks it. A 6-digit
// code the person types in themselves sidesteps that entirely, and also
// works even if the email is read on a different device/browser than the
// one they're signing in from.
export default function Login() {
  const [step, setStep] = useState('email') // 'email' | 'code'
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | verifying | error
  const [errorMsg, setErrorMsg] = useState('')

  async function sendCode() {
    setStatus('sending')
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: { full_name: fullName || email.split('@')[0] },
      },
    })
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return false
    }
    setStatus('idle')
    return true
  }

  async function handleSendCode(e) {
    e.preventDefault()
    if (await sendCode()) setStep('code')
  }

  async function handleResend() {
    await sendCode()
  }

  async function handleVerifyCode(e) {
    e.preventDefault()
    setStatus('verifying')
    setErrorMsg('')
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }
    // On success, App.jsx's auth listener picks up the new session
    // automatically and swaps this page out, nothing else to do here.
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

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="bg-panel border border-line rounded-md shadow-sm p-6 space-y-4">
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
              {status === 'sending' ? 'Sending code…' : 'Email me a sign-in code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="bg-panel border border-line rounded-md shadow-sm p-6 space-y-4">
            <p className="text-chalk text-sm">
              We sent a 6-digit code to <span className="font-semibold">{email}</span>. Enter it
              below to sign in.
            </p>
            <div>
              <label className="block text-xs font-mono uppercase text-chalkDim mb-1.5">
                Sign-in code
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full bg-panelLight border border-line rounded px-3 py-3 text-chalk text-center text-2xl font-mono tracking-[0.4em] focus:border-amber outline-none"
              />
            </div>
            {status === 'error' && (
              <p className="text-crimson text-sm">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === 'verifying' || code.length !== 6}
              className="w-full bg-amber text-metroPrimary font-mono uppercase text-sm font-bold py-2.5 rounded hover:brightness-110 transition disabled:opacity-50"
            >
              {status === 'verifying' ? 'Verifying…' : 'Verify & sign in'}
            </button>
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setStatus('idle')
                  setErrorMsg('')
                }}
                className="text-chalkDim hover:text-chalk transition-colors"
              >
                ← Use a different email
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={status === 'sending'}
                className="text-chalkDim hover:text-amber transition-colors disabled:opacity-50"
              >
                {status === 'sending' ? 'Resending…' : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
