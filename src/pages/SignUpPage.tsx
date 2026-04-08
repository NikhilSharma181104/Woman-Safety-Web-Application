import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { validateEmail, validatePassword } from '../utils/validators'

type FormState = {
  email: string
  password: string
  confirmPassword: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

/**
 * Sign up page with Soft Guardian design.
 * 
 * UX Improvements:
 * - Visible labels (not placeholder-only)
 * - Proper focus states with ring
 * - 44px minimum touch targets
 * - ARIA live regions for errors
 * - Password strength indicator
 * 
 * Validates: Requirements 5.1, 5.5, 5.7, 9.1
 */
export default function SignUpPage() {
  const navigate = useNavigate()
  const setSession = useAppStore((s) => s.setSession)
  const [form, setForm] = useState<FormState>({ email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    if (!validateEmail(form.email)) {
      errs.email = 'Please enter a valid email address.'
    }
    if (!validatePassword(form.password)) {
      errs.password = 'Password must be at least 8 characters.'
    }
    if (form.confirmPassword !== form.password) {
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
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (error) {
        const isNetworkError =
          error.message?.toLowerCase().includes('fetch') ||
          error.message?.toLowerCase().includes('network') ||
          error.message?.toLowerCase().includes('failed to fetch')

        if (isNetworkError) {
          setServerError('Backend not connected yet. Please set up Supabase in your .env file.')
        } else {
          // Requirement 5.5: do not reveal whether email is already registered
          setServerError('Unable to create account. Please try again.')
        }
      } else {
        setSubmitted(true)
      }
    } catch {
      setServerError('Backend not connected yet. Please set up Supabase in your .env file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <a href="#signup-form" className="skip-to-content">
        Skip to sign up form
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
            <h1 className="text-2xl font-bold mb-2 text-slate-900">Create account</h1>
            <p className="text-slate-600 mb-8 text-sm">Join SafeTNet — your safety, always within reach.</p>

            {submitted ? (
              <div
                role="status"
                aria-live="polite"
                className="text-center py-6"
              >
                <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-success font-bold text-lg mb-2">Check your email</p>
                <p className="text-slate-600 text-sm">We sent a verification link to <span className="font-semibold">{form.email}</span></p>
                <p className="text-slate-500 text-sm mt-2">Once verified, you can log in to your account.</p>
              </div>
            ) : (
              <form id="signup-form" onSubmit={handleSubmit} noValidate aria-label="Sign up form">
                {/* Email */}
                <div className="mb-5">
                  <label htmlFor="email" className="label">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    aria-invalid={!!errors.email}
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p id="email-error" role="alert" aria-live="polite" className="mt-2 text-emergency text-sm">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="mb-5">
                  <label htmlFor="password" className="label">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    aria-describedby={errors.password ? 'password-error password-hint' : 'password-hint'}
                    aria-invalid={!!errors.password}
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Min. 8 characters"
                  />
                  <p id="password-hint" className="mt-2 text-slate-500 text-xs">
                    Must be at least 8 characters long
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
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                    aria-invalid={!!errors.confirmPassword}
                    className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Repeat your password"
                  />
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
                  aria-label="Create your account"
                  className="btn btn-primary w-full py-3 text-base"
                >
                  {loading ? 'Creating account…' : 'Create account'}
                </button>

                <p className="mt-6 text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-brand-primary hover:text-brand-dark font-semibold transition-colors">
                    Log in
                  </Link>
                </p>
              </form>
            )}
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
