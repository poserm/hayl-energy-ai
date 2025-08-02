'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
  requireAuth?: boolean
  roles?: string[]
}

export default function ProtectedRoute({
  children,
  fallback,
  redirectTo = '/login',
  requireAuth = true,
  roles = []
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // Redirect to login if authentication is required but user is not logged in
        const currentPath = window.location.pathname
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
        router.push(redirectUrl)
        return
      }

      if (!requireAuth && user) {
        // Redirect authenticated users away from auth pages
        router.push('/dashboard')
        return
      }

      // Check role-based access if roles are specified
      if (roles.length > 0 && user) {
        // Note: This assumes user object has a 'role' property
        // You'll need to add role support to your user model and JWT payload
        const userRole = (user as any).role || 'user'
        if (!roles.includes(userRole)) {
          router.push('/unauthorized')
          return
        }
      }

      setIsAuthorized(true)
    }
  }, [user, loading, requireAuth, roles, router, redirectTo])

  // Show loading state while checking authentication
  if (loading) {
    return fallback || <LoadingSpinner />
  }

  // Show unauthorized if user doesn't have required permissions
  if (requireAuth && !user) {
    return fallback || <UnauthorizedAccess />
  }

  // Show children if authorized
  if (isAuthorized) {
    return <>{children}</>
  }

  // Default fallback
  return fallback || <LoadingSpinner />
}

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Loading...</h2>
          <p className="text-sm text-gray-500">Please wait while we verify your access</p>
        </div>
      </div>
    </div>
  )
}

// Unauthorized access component
function UnauthorizedAccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            You need to sign in to access this page.
          </p>
          <div className="mt-6">
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Utility hooks for common use cases
export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      const currentPath = window.location.pathname
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading, isAuthenticated: !!user }
}

export function useRequireRole(requiredRoles: string[], redirectTo = '/unauthorized') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      const userRole = (user as any).role || 'user'
      if (!requiredRoles.includes(userRole)) {
        router.push(redirectTo)
      }
    }
  }, [user, loading, requiredRoles, router, redirectTo])

  const userRole = user ? (user as any).role || 'user' : null
  const hasRequiredRole = userRole ? requiredRoles.includes(userRole) : false

  return { user, loading, hasRequiredRole, userRole }
}

// Protected route variants for specific use cases
export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute roles={['admin', 'super_admin']}>
      {children}
    </ProtectedRoute>
  )
}

export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  )
}