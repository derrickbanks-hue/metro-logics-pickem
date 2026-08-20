import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AvatarUpload from '../components/AvatarUpload'

export default function Profile({ profile, onProfileChange }) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error

  async function saveName(e) {
    e.preventDefault()
    setSaveState('saving')
    const { error } = await supabase
      .from('pickem_profiles')
      .update({ full_name: fullName })
      .eq('id', profile.id)
    setSaveState(error ? 'error' : 'saved')
    if (!error) onProfileChange({ ...profile, full_name: fullName })
    setTimeout(() => setSaveState('idle'), 1500)
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display font-bold text-3xl text-chalk tracking-wide mb-6">MY PROFILE</h1>
      <div className="bg-panel border border-line rounded-md p-6 space-y-6">
        <AvatarUpload
          userId={profile.id}
          avatarUrl={profile.avatar_url}
          onUploaded={(url) => onProfileChange({ ...profile, avatar_url: url })}
        />
        <form onSubmit={saveName} className="space-y-3">
          <div>
            <label className="block text-xs font-mono uppercase text-chalkDim mb-1.5">
              Display name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-panelLight border border-line rounded px-3 py-2 text-chalk focus:border-amber outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saveState === 'saving'}
            className="bg-amber text-panel font-mono uppercase text-sm font-bold px-4 py-2 rounded hover:brightness-110 transition disabled:opacity-50"
          >
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
