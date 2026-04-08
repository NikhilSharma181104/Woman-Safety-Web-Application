import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}))

// Mock useAppStore
const mockSetSession = vi.fn()
vi.mock('../store/useAppStore', () => ({
  useAppStore: (selector: (s: { setSession: typeof mockSetSession }) => unknown) =>
    selector({ setSession: mockSetSession }),
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { supabase } from '../lib/supabase'

const mockSignIn = supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LoginPage', () => {
  it('renders email and password fields, submit button, and navigation links', () => {
    renderLoginPage()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
  })

  it('shows inline error for invalid email format', async () => {
    renderLoginPage()
    await userEvent.type(screen.getByLabelText(/email address/i), 'notanemail')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'somepassword')
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('shows inline error when password is empty', async () => {
    renderLoginPage()
    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com')
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('calls supabase.auth.signInWithPassword with correct args on valid submit', async () => {
    mockSignIn.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null })
    renderLoginPage()
    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'mypassword')
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'mypassword',
      })
    })
  })

  it('calls setSession and navigates to /dashboard on successful login', async () => {
    const fakeSession = { access_token: 'tok', user: { id: '1' } }
    mockSignIn.mockResolvedValue({ data: { session: fakeSession }, error: null })
    renderLoginPage()
    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'mypassword')
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith(fakeSession)
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows generic error on failed login — does not reveal email vs password mismatch (Requirement 5.3)', async () => {
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } })
    renderLoginPage()
    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'wrongpassword')
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))

    const errorMsg = await screen.findByText(/invalid credentials\. please try again\./i)
    expect(errorMsg).toBeInTheDocument()

    // Must not reveal which field was wrong
    expect(screen.queryByText(/email.*incorrect/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/password.*incorrect/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/email.*not found/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/wrong password/i)).not.toBeInTheDocument()
  })

  it('shows the same generic error regardless of which field caused the failure (Requirement 5.3)', async () => {
    // Simulate "email not found" error from Supabase
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Email not confirmed' } })
    renderLoginPage()
    await userEvent.type(screen.getByLabelText(/email address/i), 'unknown@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'somepassword')
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))

    const errorMsg = await screen.findByText(/invalid credentials\. please try again\./i)
    expect(errorMsg).toBeInTheDocument()
    // The raw Supabase error message must not be surfaced
    expect(screen.queryByText(/email not confirmed/i)).not.toBeInTheDocument()
  })

  it('forgot password link points to /reset-password', () => {
    renderLoginPage()
    const link = screen.getByRole('link', { name: /forgot password/i })
    expect(link).toHaveAttribute('href', '/reset-password')
  })

  it('sign up link points to /signup', () => {
    renderLoginPage()
    const link = screen.getByRole('link', { name: /sign up/i })
    expect(link).toHaveAttribute('href', '/signup')
  })
})
