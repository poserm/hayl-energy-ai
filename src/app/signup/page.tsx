'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PasswordStrength, calculatePasswordStrength, type PasswordStrength as PasswordStrengthType } from '@/components/ui/PasswordStrength'
import { cn } from '@/lib/utils'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthType | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  
  const { signup, loading, error, clearError, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const validateForm = () => {
    const errors: string[] = []
    
    if (!formData.email) {
      errors.push('Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Invalid email format')
    }
    
    if (!formData.password) {
      errors.push('Password is required')
    } else {
      const strength = calculatePasswordStrength(formData.password)
      if (strength.score < 3) {
        errors.push('Password is too weak. Please choose a stronger password.')
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match')
    }

    if (!acceptTerms) {
      errors.push('You must accept the Terms of Service and Privacy Policy')
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || isSubmitting) {
      return
    }
    
    setIsSubmitting(true)
    clearError()
    
    try {
      await signup(formData.email, formData.password, formData.name || undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
    if (error) {
      clearError()
    }
  }

  const getPasswordConfirmError = () => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      return 'Passwords do not match'
    }
    return undefined
  }

  const getPasswordConfirmSuccess = () => {
    if (formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length > 0) {
      return 'Passwords match'
    }
    return undefined
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <LoadingSpinner size="lg" fullScreen>
          <span className="text-lg font-medium">Loading...</span>
        </LoadingSpinner>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">H</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">
            Create your account
          </h2>
          <p className="text-neutral-600">
            Join Hayl Energy AI and start optimizing your energy usage
          </p>
        </div>
        
        {/* Signup Form */}
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-neutral-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Alert */}
            {(validationErrors.length > 0 || error) && (
              <Alert variant="error" title="Please fix the following errors:" closable onClose={() => {
                setValidationErrors([])
                clearError()
              }}>
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {error && <li>{error}</li>}
                </ul>
              </Alert>
            )}

            {/* Name Input */}
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name (optional)"
              autoComplete="name"
              startIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              helperText="Optional, but helps personalize your experience"
            />

            {/* Email Input */}
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              autoComplete="email"
              required
              startIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            {/* Password Input */}
            <div className="space-y-3">
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
                showPasswordToggle
                startIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <PasswordStrength 
                  password={formData.password} 
                  onStrengthChange={setPasswordStrength}
                />
              )}
            </div>

            {/* Confirm Password Input */}
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
              showPasswordToggle
              error={getPasswordConfirmError()}
              success={getPasswordConfirmSuccess()}
              startIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="accept-terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded mt-1 transition-colors duration-200"
              />
              <label htmlFor="accept-terms" className="ml-3 text-sm text-neutral-600">
                I agree to the{' '}
                <Link href="/terms" className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isSubmitting}
              disabled={!formData.email || !formData.password || !formData.confirmPassword || !acceptTerms}
              className="mt-6"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Login Link */}
            <div className="text-center">
              <span className="text-sm text-neutral-600">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
                >
                  Sign in here
                </Link>
              </span>
            </div>
          </form>

          {/* Benefits Section */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-700 mb-4 text-center">
              What you'll get with Hayl Energy AI:
            </h3>
            <div className="space-y-3">
              {[
                { icon: '⚡', text: 'Real-time energy monitoring and analytics' },
                { icon: '🤖', text: 'AI-powered optimization recommendations' },
                { icon: '📊', text: 'Detailed consumption reports and insights' },
                { icon: '💰', text: 'Cost-saving suggestions and tracking' }
              ].map((benefit, index) => (
                <div key={index} className="flex items-center text-sm text-neutral-600">
                  <span className="text-lg mr-3">{benefit.icon}</span>
                  {benefit.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-neutral-500">
          © 2024 Hayl Energy AI. All rights reserved.
        </div>
      </div>
    </div>
  )
}