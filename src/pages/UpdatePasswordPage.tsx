import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { validatePassword } from '../utils/validators'

type FormState = {
  password: string
  confirmPassword: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

/**
 * Update password page - shown after clicking reset password link from email
 */
export default function UpdatePasswordPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    // Check if user came from a valid password reset link
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setIsValidSession(true)
      } else {
        setServerError('Invalid or expired reset link. Please request a new one.')
      }
      setCheckingSession(false)
    }
    
    checkSession()
  }, [])

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    
    if (!form.password) {
      errs.password = 'Password is required.'
    } else if (!validatePassword(form.password)) {
      errs.password = 'Password must be at least 8 characters long.'
    } else if (form.password.length < 8) {
      errs.password = 'Password is too short. Use at least 8 characters.'
    } else if (!/[A-Z]/.test(form.password)) {
      errs.password = 'Password should include at least one uppercase letter.'
    } else if (!/[a-z]/.test(form.password)) {
      errs.password = 'Password should include at least one lowercase letter.'
    } else if (!/[0-9]/.test(form.password)) {
      errs.password = 'Password should include at least one number.'
    }
    
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.'
    } else if (form.confirmPassword !== form.password) {
      errs.confirmPassword = 'Passwords do not match.'
    }
    
    return errs
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    
    // Clear field error on change
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: form.password
      })

      if (error) {
        setServerError('Failed to update password. Please try again.')
      } else {
        // Success - redirect to login
        alert('Password updated successfully! Please log in with your new password.')
        navigate('/login')
      }
    } catch {
      setServerError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block text-slate-900 font-bold text-2xl tracking-tight">
              Safe<span className="text-brand-primary">T</span>Net
            </Link>
          </div>

          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emergency-light flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emergency" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-2 text-slate-900">Invalid Reset Link</h1>
            <p className="text-slate-600 text-sm mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link to="/reset-password" className="btn btn-primary inline-block">
              Request New Link
            </Link>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <a href="#update-password-form" className="skip-to-content">
        Skip to update password form
      </a>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block text-slate-900 font-bold text-2xl tracking-tight">
              Safe<span className="text-brand-primary">T</span>Net
            </Link>
          </div>

          <div className="card p-8">
            <h1 className="text-2xl font-bold mb-2 text-slate-900">Set new password</h1>
            <p className="text-slate-600 mb-8 text-sm">
              Choose a strong password for your account.
            </p>

            <form id="update-password-form" onSubmit={handleSubmit} noValidate aria-label="Update password form">
              {/* New Password */}
              <div className="mb-5">
                <label htmlFor="password" className="label">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    aria-describedby={errors.password ? 'password-error password-hint' : 'password-hint'}
                    aria-invalid={!!errors.password}
                    className={`input pr-12 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p id="password-hint" className="mt-2 text-slate-500 text-xs">
                  At least 8 characters with uppercase, lowercase, and numbers
                </p>
                {errors.password && (
                  <p id="password-error" role="alert" aria-live="polite" className="mt-1 text-emergency text-sm">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="label">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                    aria-invalid={!!errors.confirmPassword}
                    className={`input pr-12 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirm-password-error" role="alert" aria-live="polite" className="mt-2 text-emergency text-sm">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Server error */}
              {serverError && (
                <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-xl bg-emergency-light border border-emergency text-emergency-dark text-sm">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                aria-label="Update password"
                className="btn btn-primary w-full py-3 text-base"
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-slate-500 hover:text-slate-700 text-sm font-semibold transition-colors">
              ← Back to login
            </Link>
          </div>
        </div>
      </motion.div>
    </>
  )
}
