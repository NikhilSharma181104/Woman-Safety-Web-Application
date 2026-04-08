import { render, screen, waitFor } from '@testing-library/react'

// Mock Supabase so the client doesn't throw "supabaseUrl is required"
vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}))

// Mock all lazy-loaded pages to avoid deep rendering in this smoke test
vi.mock('./pages/LandingPage', () => ({
  default: () => <h1>SafeTNet</h1>,
}))
vi.mock('./pages/SignUpPage', () => ({ default: () => <div>SignUp</div> }))
vi.mock('./pages/LoginPage', () => ({ default: () => <div>Login</div> }))
vi.mock('./pages/ResetPasswordPage', () => ({ default: () => <div>Reset</div> }))
vi.mock('./pages/DashboardPage', () => ({ default: () => <div>Dashboard</div> }))

// Mock framer-motion AnimatePresence to avoid animation issues in jsdom
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

import App from './App'

describe('App', () => {
  it('renders the landing page at /', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  })
})
