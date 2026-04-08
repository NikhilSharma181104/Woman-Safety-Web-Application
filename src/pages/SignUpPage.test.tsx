import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignUpPage from './SignUpPage'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}))

import { supabase } from '../lib/supabase'

const mockSignUp = supabase.auth.signUp as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SignUpPage', () => {
  it('renders email, password, and confirm password fields', () => {
    render(<SignUpPage />)
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('shows inline error when password is less than 8 chars (Requirement 5.7)', async () => {
    render(<SignUpPage />)
    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'short')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'short')
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('shows inline error for invalid email', async () => {
    render(<SignUpPage />)
    await userEvent.type(screen.getByLabelText(/email address/i), 'notanemail')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'validpassword')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'validpassword')
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
  })

  it('shows inline error when passwords do not match', async () => {
    render(<SignUpPage />)
    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'validpassword')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'differentpassword')
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('calls supabase.auth.signUp with correct credentials on valid submit', async () => {
    mockSignUp.mockResolvedValue({ data: {}, error: null })
    render(<SignUpPage />)
    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'validpassword')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'validpassword')
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({ email: 'user@example.com', password: 'validpassword' })
    })
  })

  it('shows verification message on success', async () => {
    mockSignUp.mockResolvedValue({ data: {}, error: null })
    render(<SignUpPage />)
    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'validpassword')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'validpassword')
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
  })

  it('shows generic error on supabase failure — does not reveal email existence (Requirement 5.5)', async () => {
    mockSignUp.mockResolvedValue({ data: null, error: { message: 'User already registered' } })
    render(<SignUpPage />)
    await userEvent.type(screen.getByLabelText(/email address/i), 'existing@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'validpassword')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'validpassword')
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    const errorMsg = await screen.findByText(/unable to create account/i)
    expect(errorMsg).toBeInTheDocument()
    expect(screen.queryByText(/already registered/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/account exists/i)).not.toBeInTheDocument()
  })
})
