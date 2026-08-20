import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AvatarUpload({ userId, avatarUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }
    setUploading(true)
    setError('')

    // Stored under the user's own id so storage policies can scope write
    // access to "your own folder only".
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('pickem-avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage.from('pickem-avatars').getPublicUrl(path)
    // Cache-bust so the new photo shows immediately everywhere it's used.
    const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`

    const { error: profileError } = await supabase
      .from('pickem_profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    setUploading(false)
    if (profileError) {
      setError(profileError.message)
      return
    }
    onUploaded?.(publicUrl)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-panelLight border border-line overflow-hidden shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-chalkDim font-mono text-[10px] text-center leading-tight">
            NO
            <br />
            PHOTO
          </div>
        )}
      </div>
      <div>
        <label className="inline-block cursor-pointer bg-panelLight border border-line rounded px-3 py-1.5 text-sm font-mono text-chalk hover:border-amber transition">
          {uploading ? 'Uploading…' : 'Upload photo'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        {error && <p className="text-crimson text-xs mt-1">{error}</p>}
      </div>
    </div>
  )
}
