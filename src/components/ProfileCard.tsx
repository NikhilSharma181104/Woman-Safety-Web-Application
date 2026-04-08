import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

/**
 * Profile card showing user information with edit capability
 */
export function ProfileCard() {
  const session = useAppStore((s) => s.session);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editing, setEditing] = useState(false);
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
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      setError(null);
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
      setEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="card p-6">
        <div className="text-center py-8 text-slate-500">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900">Your Profile</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-brand-primary hover:text-brand-dark font-semibold"
          >
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        // View Mode
        <div className="space-y-6">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName || 'User avatar'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {displayName || 'No name set'}
              </h3>
              <p className="text-sm text-slate-500">{session?.user?.email}</p>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</p>
              <p className="text-sm text-slate-900">{session?.user?.email}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Account Created</p>
              <p className="text-sm text-slate-900">
                {session?.user?.created_at 
                  ? new Date(session.user.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : 'Unknown'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">User ID</p>
              <p className="text-xs text-slate-600 font-mono break-all">{session?.user?.id}</p>
            </div>
          </div>
        </div>
      ) : (
        // Edit Mode
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="avatar-upload" className="btn btn-secondary text-sm px-4 py-2 cursor-pointer">
                Change Photo
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
              />
              <p className="text-xs text-slate-500 mt-1">Max 2MB</p>
            </div>
          </div>

          {/* Display Name */}
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
              className="input"
              placeholder="Your name"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              className="input bg-slate-100 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          {error && (
            <div role="alert" className="p-3 rounded-xl bg-emergency-light border border-emergency text-emergency-dark text-sm">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="p-3 rounded-xl bg-success-light border border-success text-success-dark text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Profile updated successfully!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 py-3"
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
                setSuccess(false);
              }}
              disabled={loading}
              className="btn btn-secondary px-6 py-3"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
