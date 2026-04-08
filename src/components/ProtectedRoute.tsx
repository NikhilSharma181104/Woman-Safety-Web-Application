import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const session = useAppStore((s) => s.session)

  if (session === null) {
    return <Navigate replace to="/login" />
  }

  return <>{children}</>
}
