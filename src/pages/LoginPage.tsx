import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { validateEmail } from '../utils/validators'

type FormState = {
  email: string
  password: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

/**
 * Login page with Soft Guardian design.
 * 
 * UX Improvements:
 * - Visible labels (not placeholder-only)
 * - Proper focus states with ring
 * - 44px minimum touch targets
 * - ARIA live regions for errors
 * - Skip to content link
 * 
 * Validates: Requirements 5.2, 5.3, 9.1
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAppStore((s) => s.setSession)

  const [form, setForm] = useState<FormState>({ email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    
    if (!form.email) {
      errs.email = 'Email is required.'
    } else if (!validateEmail(form.email)) {
      errs.email = 'Please enter a valid email address (e.g., you@example.com).'
    }
    
    if (!form.password) {
      errs.password = 'Password is required.'
    } else if (form.password.length < 6) {
      errs.password = 'Password is too short.'
    }
    
    return errs
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (error) {
        // Provide helpful error messages
        if (error.message?.includes('Invalid login credentials')) {
          setServerError('Incorrect email or password. Please double-check and try again.')
        } else if (error.message?.includes('Email not confirmed')) {
          setServerError('Please verify your email address. Check your inbox for the verification link.')
        } else {
          const isNetworkError =
            error.message?.toLowerCase().includes('fetch') ||
            error.message?.toLowerCase().includes('network') ||
            error.message?.toLowerCase().includes('failed to fetch')
          setServerError(
            isNetworkError
              ? 'Unable to connect. Please check your internet connection and try again.'
              : 'Incorrect email or password. Please try again.'
          )
        }
      } else {
        setSession(data.session)
        navigate('/dashboard')
      }
    } catch (err) {
      setServerError('Incorrect email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <a href="#login-form" className="skip-to-content">
        Skip to login form
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
            <h1 className="text-2xl font-bold mb-2 text-slate-900">Welcome back</h1>
            <p className="text-slate-600 mb-8 text-sm">Log in to your SafeTNet account.</p>

            <form id="login-form" onSubmit={handleSubmit} noValidate aria-label="Login form">
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
              <div className="mb-2">
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    aria-invalid={!!errors.password}
                    className={`input pr-12 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter your password"
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
                {errors.password && (
                  <p id="password-error" role="alert" aria-live="polite" className="mt-2 text-emergency text-sm">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Forgot password link */}
              <div className="mb-6 text-right">
                <Link to="/reset-password" className="text-brand-primary hover:text-brand-dark text-sm font-semibold transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Server error — generic, does not reveal email vs password (Requirement 5.3) */}
              {serverError && (
                <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-xl bg-emergency-light border border-emergency text-emergency-dark text-sm">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                aria-label="Log in to your account"
                className="btn btn-primary w-full py-3 text-base"
              >
                {loading ? 'Logging in…' : 'Log in'}
              </button>

              <p className="mt-6 text-center text-sm text-slate-600">
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="text-brand-primary hover:text-brand-dark font-semibold transition-colors">
                  Sign up
                </Link>
              </p>
            </form>
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
