'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface VerificationState {
  status: 'loading' | 'success' | 'error' | 'already-verified'
  message: string
  userEmail?: string
  userName?: string
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<VerificationState>({
    status: 'loading',
    message: 'Verifying your email...'
  })
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setState({
        status: 'error',
        message: 'Invalid verification link. Please check your email for the correct link.'
      })
      return
    }

    verifyEmail(token)
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`)
      const data = await response.json()

      if (data.success) {
        setState({
          status: data.data.verified ? 'success' : 'already-verified',
          message: data.message,
          userEmail: data.data.email,
          userName: data.data.name
        })

        // Redirect to login after successful verification
        setTimeout(() => {
          router.push('/login?verified=true')
        }, 3000)
      } else {
        setState({
          status: 'error',
          message: data.message || 'Email verification failed'
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
      setState({
        status: 'error',
        message: 'An error occurred during verification. Please try again.'
      })
    }
  }

  const resendVerification = async () => {
    if (!state.userEmail) return

    setResendLoading(true)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: state.userEmail })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Verification email sent! Please check your inbox.')
      } else {
        alert(data.error || 'Failed to resend verification email')
      }
    } catch (error) {
      console.error('Resend error:', error)
      alert('Failed to resend verification email')
    } finally {
      setResendLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (state.status) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        )
      case 'success':
      case 'already-verified':
        return (
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        )
    }
  }

  const getStatusColor = () => {
    switch (state.status) {
      case 'success':
      case 'already-verified':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      default:
        return 'text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ⚡ Hayl Energy AI
              </h1>
              <p className="text-sm text-gray-600">Smart Energy Management Solutions</p>
            </div>

            {/* Status Icon */}
            <div className="mb-6">
              {getStatusIcon()}
            </div>

            {/* Status Message */}
            <div className="mb-6">
              <h2 className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
                {state.status === 'loading' && 'Verifying Email...'}
                {state.status === 'success' && 'Email Verified! 🎉'}
                {state.status === 'already-verified' && 'Already Verified ✅'}
                {state.status === 'error' && 'Verification Failed'}
              </h2>
              
              <p className="text-gray-600">
                {state.message}
              </p>

              {state.userEmail && (
                <p className="text-sm text-gray-500 mt-2">
                  {state.userName ? `Welcome, ${state.userName}!` : `Email: ${state.userEmail}`}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {state.status === 'success' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Redirecting to login in 3 seconds...
                  </p>
                  <Link
                    href="/login?verified=true"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 inline-block text-center"
                  >
                    Continue to Login
                  </Link>
                </div>
              )}

              {state.status === 'already-verified' && (
                <Link
                  href="/login"
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 inline-block text-center"
                >
                  Go to Login
                </Link>
              )}

              {state.status === 'error' && (
                <div className="space-y-3">
                  {state.userEmail && (
                    <button
                      onClick={resendVerification}
                      disabled={resendLoading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    >
                      {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                  )}
                  
                  <Link
                    href="/signup"
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 inline-block text-center"
                  >
                    Back to Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Additional Information */}
            {state.status === 'success' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">What's Next?</h3>
                <ul className="text-xs text-blue-700 space-y-1 text-left">
                  <li>✅ Access your energy dashboard</li>
                  <li>✅ Set up monitoring preferences</li>
                  <li>✅ Explore AI optimization features</li>
                  <li>✅ Start analyzing your energy usage</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          © 2024 Hayl Energy AI - Smart Energy Management Solutions
        </div>
      </div>
    </div>
  )
}