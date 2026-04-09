import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthListener } from './hooks/useAuthListener'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const SignUpPage = lazy(() => import('./pages/SignUpPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" aria-label="Loading" />
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  useAuthListener()

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <AnimatedRoutes />
      </Suspense>
    </BrowserRouter>
  )
}
