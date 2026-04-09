import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { validateEmail, validatePasswordStrength, getPasswordStrength } from '../utils/validators'

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
  const [form, setForm] = useState<FormState>({ email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    
    if (!form.email) {
      errs.email = 'Email is required.'
    } else if (!validateEmail(form.email)) {
      errs.email = 'Please enter a valid email address (e.g., you@example.com).'
    }
    
    const passwordError = validatePasswordStrength(form.password)
    if (passwordError) {
      errs.password = passwordError
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
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (error) {
        console.log('Signup error:', error.message) // Debug log
        
        // Provide helpful error messages
        const errorMsg = error.message?.toLowerCase() || ''
        
        if (errorMsg.includes('already') || 
            errorMsg.includes('registered') || 
            errorMsg.includes('exists') ||
            errorMsg.includes('duplicate') ||
            errorMsg.includes('user already registered')) {
          setServerError('This email is already registered. Please log in instead.')
        } else if (errorMsg.includes('invalid email') || errorMsg.includes('email')) {
          setServerError('Please enter a valid email address.')
        } else if (errorMsg.includes('password')) {
          setServerError('Password does not meet requirements. Please use a stronger password.')
        } else {
          const isNetworkError =
            errorMsg.includes('fetch') ||
            errorMsg.includes('network') ||
            errorMsg.includes('failed to fetch')

          if (isNetworkError) {
            setServerError('Unable to connect. Please check your internet connection and try again.')
          } else {
            // Show the actual error for debugging
            setServerError(`Unable to create account: ${error.message}`)
          }
        }
      } else if (signUpData?.user?.identities?.length === 0) {
        // User already exists - Supabase returns user but with empty identities array
        setServerError('This email is already registered. Please log in instead.')
      } else {
        setSubmitted(true)
      }
    } catch (err) {
      setServerError('Unable to create account. Please check your information and try again.')
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
                      placeholder="Create a strong password"
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
                  
                  {/* Password strength indicator */}
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {['weak', 'medium', 'strong'].map((level, idx) => {
                          const strength = getPasswordStrength(form.password)
                          const isActive = 
                            (strength === 'weak' && idx === 0) ||
                            (strength === 'medium' && idx <= 1) ||
                            (strength === 'strong' && idx <= 2)
                          
                          return (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                isActive
                                  ? idx === 0
                                    ? 'bg-emergency'
                                    : idx === 1
                                    ? 'bg-yellow-500'
                                    : 'bg-success'
                                  : 'bg-slate-200'
                              }`}
                            />
                          )
                        })}
                      </div>
                      <p className="text-xs text-slate-500">
                        Strength: <span className={`font-semibold ${
                          getPasswordStrength(form.password) === 'weak' ? 'text-emergency' :
                          getPasswordStrength(form.password) === 'medium' ? 'text-yellow-600' :
                          'text-success'
                        }`}>
                          {getPasswordStrength(form.password)}
                        </span>
                      </p>
                    </div>
                  )}
                  
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
                    Confirm password
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
                      placeholder="Repeat your password"
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
                    {serverError.includes('already registered') && (
                      <div className="mt-2">
                        <Link to="/login" className="font-semibold underline hover:text-emergency">
                          Go to login page →
                        </Link>
                      </div>
                    )}
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
