import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import type { Session } from '@supabase/supabase-js'

// Mock useAppStore so we can control the session value
vi.mock('../store/useAppStore', () => ({
  useAppStore: vi.fn(),
}))

import { useAppStore } from '../store/useAppStore'

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>

function renderWithRouter(session: Session | null) {
  mockUseAppStore.mockImplementation((selector: (s: { session: Session | null }) => unknown) =>
    selector({ session })
  )

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('renders children when session is present', () => {
    const fakeSession = { access_token: 'tok', user: { id: '1' } } as unknown as Session
    renderWithRouter(fakeSession)
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })

  it('redirects to /login when session is null', () => {
    renderWithRouter(null)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})
