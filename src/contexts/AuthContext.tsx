'use client'

import { 
  useState, 
  useEffect, 
  createContext, 
  useContext, 
  ReactNode, 
  useCallback,
  useMemo 
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface User {
  id: string
  email: string
  name?: string
  emailVerified?: boolean
  createdAt: string
  updatedAt?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  isInitialized: boolean
}

interface AuthActions {
  login: (email: string, password: string, redirectTo?: string) => Promise<boolean>
  signup: (email: string, password: string, name?: string, redirectTo?: string) => Promise<boolean>
  logout: (redirectTo?: string) => Promise<void>
  refreshAuth: () => Promise<void>
  clearError: () => void
  updateUser: (userData: Partial<User>) => void
}

type AuthContextType = AuthState & AuthActions

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  onAuthChange?: (isAuthenticated: boolean, user: User | null) => void
}

export function AuthProvider({ children, onAuthChange }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isInitialized: false,
  })

  const router = useRouter()
  const searchParams = useSearchParams()

  // Memoized auth state
  const authState = useMemo(() => ({
    ...state,
    isAuthenticated: !!state.user,
  }), [state])

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Update user data
  const updateUser = useCallback((userData: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }))
  }, [])

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setState(prev => ({
            ...prev,
            user: data.user,
            error: null,
            loading: false,
            isInitialized: true,
          }))
          onAuthChange?.(true, data.user)
          return
        }
      }
      
      // Authentication failed or user not found
      setState(prev => ({
        ...prev,
        user: null,
        error: null,
        loading: false,
        isInitialized: true,
      }))
      onAuthChange?.(false, null)
      
    } catch (error) {
      console.error('Auth check failed:', error)
      setState(prev => ({
        ...prev,
        user: null,
        error: null,
        loading: false,
        isInitialized: true,
      }))
      onAuthChange?.(false, null)
    }
  }, [onAuthChange])

  // Refresh authentication
  const refreshAuth = useCallback(async () => {
    await checkAuthStatus()
  }, [checkAuthStatus])

  // Initial auth check
  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  // Login function
  const login = useCallback(async (
    email: string, 
    password: string, 
    redirectTo?: string
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success && data.user) {
        setState(prev => ({
          ...prev,
          user: data.user,
          error: null,
          loading: false,
        }))
        
        onAuthChange?.(true, data.user)
        
        // Handle redirect
        const targetPath = redirectTo || 
                          searchParams?.get('redirect') || 
                          '/dashboard'
        
        router.push(targetPath)
        return true
      } else {
        // Handle email verification required
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          const errorMessage = data.error + ' Check your email for a verification link.'
          setState(prev => ({
            ...prev,
            user: null,
            error: errorMessage,
            loading: false,
          }))
          
          // Show option to resend verification email
          const shouldResend = confirm(`${data.error}\n\nWould you like to resend the verification email?`)
          if (shouldResend && data.data?.email) {
            try {
              const resendResponse = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.data.email })
              })
              const resendData = await resendResponse.json()
              if (resendData.success) {
                alert('Verification email sent! Please check your inbox.')
              }
            } catch (error) {
              console.error('Failed to resend verification email:', error)
            }
          }
          return false
        }
        
        const errorMessage = data.error || 'Login failed'
        setState(prev => ({
          ...prev,
          user: null,
          error: errorMessage,
          loading: false,
        }))
        return false
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.'
      setState(prev => ({
        ...prev,
        user: null,
        error: errorMessage,
        loading: false,
      }))
      return false
    }
  }, [router, searchParams, onAuthChange])

  // Signup function
  const signup = useCallback(async (
    email: string, 
    password: string, 
    name?: string,
    redirectTo?: string
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (data.success) {
        // New email verification flow - no immediate authentication
        if (!data.user && data.data?.emailSent !== undefined) {
          setState(prev => ({
            ...prev,
            user: null,
            error: null,
            loading: false,
          }))
          
          // Show success message for email verification
          alert(data.message || 'Account created! Please check your email to verify your account.')
          router.push('/login?signup=success')
          return true
        }
        
        // Legacy flow with immediate authentication (if user object exists)
        if (data.user) {
          setState(prev => ({
            ...prev,
            user: data.user,
            error: null,
            loading: false,
          }))
          
          onAuthChange?.(true, data.user)
          
          // Handle redirect
          const targetPath = redirectTo || 
                            searchParams?.get('redirect') || 
                            '/dashboard'
          
          router.push(targetPath)
          return true
        }
      } else {
        let errorMessage = data.error || 'Signup failed'
        if (data.details && Array.isArray(data.details)) {
          errorMessage = data.details.join(', ')
        }
        
        setState(prev => ({
          ...prev,
          user: null,
          error: errorMessage,
          loading: false,
        }))
        return false
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.'
      setState(prev => ({
        ...prev,
        user: null,
        error: errorMessage,
        loading: false,
      }))
      return false
    }
  }, [router, searchParams, onAuthChange])

  // Logout function
  const logout = useCallback(async (redirectTo?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
      // Continue with logout even if API call fails
    }
    
    setState(prev => ({
      ...prev,
      user: null,
      error: null,
      loading: false,
    }))
    
    onAuthChange?.(false, null)
    
    // Handle redirect
    const targetPath = redirectTo || '/login'
    router.push(targetPath)
  }, [router, onAuthChange])

  // Context value
  const contextValue = useMemo<AuthContextType>(() => ({
    ...authState,
    login,
    signup,
    logout,
    refreshAuth,
    clearError,
    updateUser,
  }), [authState, login, signup, logout, refreshAuth, clearError, updateUser])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for authentication status only (lighter weight)
export function useAuthStatus() {
  const { isAuthenticated, user, loading, isInitialized } = useAuth()
  return { isAuthenticated, user, loading, isInitialized }
}

// Hook for authentication actions only
export function useAuthActions() {
  const { login, signup, logout, refreshAuth, clearError } = useAuth()
  return { login, signup, logout, refreshAuth, clearError }
}

// Hook with automatic redirect for protected pages
export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, loading, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && !loading && !isAuthenticated) {
      const currentPath = window.location.pathname
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
    }
  }, [isAuthenticated, loading, isInitialized, router, redirectTo])

  return {
    isAuthenticated,
    loading: loading || !isInitialized,
    canAccess: isAuthenticated && isInitialized,
  }
}

// Hook with automatic redirect for guest-only pages
export function useRequireGuest(redirectTo = '/dashboard') {
  const { isAuthenticated, loading, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && !loading && isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, loading, isInitialized, router, redirectTo])

  return {
    isAuthenticated,
    loading: loading || !isInitialized,
    canAccess: !isAuthenticated && isInitialized,
  }
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo = '/login'
) {
  return function AuthenticatedComponent(props: P) {
    const { canAccess, loading } = useRequireAuth(redirectTo)

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!canAccess) {
      return null // Will redirect via useRequireAuth
    }

    return <Component {...props} />
  }
}

// Higher-order component for guest-only routes
export function withGuest<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo = '/dashboard'
) {
  return function GuestOnlyComponent(props: P) {
    const { canAccess, loading } = useRequireGuest(redirectTo)

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!canAccess) {
      return null // Will redirect via useRequireGuest
    }

    return <Component {...props} />
  }
}

export default AuthContext