import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

/**
 * Allows the user to update their display name and upload avatar image.
 * Uploads avatar to Supabase Storage and persists URL to profiles table.
 * Shows a confirmation message on success.
 * Validates: Requirements 7.3
 */
export function ProfileSettingsForm() {
  const session = useAppStore((s) => s.session);

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load existing profile data
  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) return;

      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || '');
        setAvatarUrl(data.avatar_url || '');
      }

      if (error) {
        console.error('Failed to load profile:', error);
      }

      setLoadingProfile(false);
    }

    loadProfile();
  }, [session?.user?.id]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      setError(null);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    }
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile || !session?.user?.id) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let finalAvatarUrl = avatarUrl;

      // Upload new avatar if file selected
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar() || '';
      }

      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: session.user.id,
        display_name: displayName.trim(),
        avatar_url: finalAvatarUrl || null,
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      setSuccess(true);
      setAvatarFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  function handleRemoveAvatar() {
    setAvatarUrl('');
    setAvatarFile(null);
  }

  return (
    <section aria-label="Profile settings">
      <h2 id="profile-heading" className="text-lg font-bold text-slate-900 mb-4">Profile Settings</h2>

      {loadingProfile ? (
        <div className="text-center py-8 text-slate-500">
          Loading profile...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* Avatar preview */}
        {avatarUrl && (
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={avatarUrl} 
              alt="Avatar preview" 
              className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <button 
              type="button" 
              onClick={handleRemoveAvatar}
              className="text-sm text-slate-600 hover:text-slate-900 font-semibold"
            >
              Remove
            </button>
          </div>
        )}

        <div>
          <label htmlFor="display-name" className="label">
            Display Name
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
            aria-label="Display name"
            className="input"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="avatar-upload" className="label">
            Avatar Image <span className="text-slate-500 text-xs">(optional, max 2MB)</span>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
            aria-label="Upload avatar image"
            className="input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-slate-900 hover:file:bg-brand-primary cursor-pointer"
          />
          <p className="text-xs text-slate-500 mt-1">
            Supported formats: JPG, PNG, GIF, WebP
          </p>
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="p-3 rounded-xl bg-emergency-light border border-emergency text-emergency-dark text-sm">
            {error}
          </div>
        )}

        {success && (
          <div role="status" aria-live="polite" className="p-3 rounded-xl bg-success-light border border-success text-success-dark text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Profile updated successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          aria-label="Save profile settings"
          className="btn btn-primary w-full py-3"
        >
          {loading ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
      )}
    </section>
  );
}
