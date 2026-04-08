import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { validateEmail } from '../utils/validators'

/**
 * Reset password page with Soft Guardian design.
 * 
 * UX Improvements:
 * - Visible labels (not placeholder-only)
 * - Proper focus states with ring
 * - 44px minimum touch targets
 * - ARIA live regions for errors
 * - Success state with visual feedback
 * 
 * Validates: Requirements 5.4, 9.1
 */
export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
    if (emailError) setEmailError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/update-password',
      })

      if (error) {
        setServerError('Something went wrong. Please try again later.')
      } else {
        // Requirement 5.4: do not confirm account existence
        setSuccess(true)
      }
    } catch {
      setServerError('Something went wrong. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <a href="#reset-form" className="skip-to-content">
        Skip to reset password form
      </a>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block text-slate-900 font-bold text-2xl tracking-tight">
              Safe<span className="text-brand-primary">T</span>Net
            </Link>
          </div>

          <div className="card p-8">
            <h1 className="text-2xl font-bold mb-2 text-slate-900">Reset your password</h1>
            <p className="text-slate-600 mb-8 text-sm">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {success ? (
              <div role="status" aria-live="polite" className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-info-light flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-info" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <p className="text-slate-900 font-bold text-lg mb-2">Check your email</p>
                <p className="text-slate-600 text-sm">
                  If an account exists for <span className="font-semibold">{email}</span>, a reset link has been sent.
                </p>
                <p className="text-slate-500 text-xs mt-4">
                  Didn't receive it? Check your spam folder or try again.
                </p>
              </div>
            ) : (
              <form id="reset-form" onSubmit={handleSubmit} noValidate aria-label="Reset password form">
                <div className="mb-5">
                  <label htmlFor="email" className="label">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={handleChange}
                    aria-describedby={emailError ? 'email-error' : undefined}
                    aria-invalid={!!emailError}
                    className={`input ${emailError ? 'input-error' : ''}`}
                    placeholder="you@example.com"
                  />
                  {emailError && (
                    <p id="email-error" role="alert" aria-live="polite" className="mt-2 text-emergency text-sm">
                      {emailError}
                    </p>
                  )}
                </div>

                {serverError && (
                  <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-xl bg-emergency-light border border-emergency text-emergency-dark text-sm">
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  aria-label="Send password reset link"
                  className="btn btn-primary w-full py-3 text-base"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-slate-600">
              <Link to="/login" className="text-brand-primary hover:text-brand-dark font-semibold transition-colors">
                ← Back to login
              </Link>
            </p>
          </div>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-slate-500 hover:text-slate-700 text-sm font-semibold transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </motion.div>
    </>
  )
}
