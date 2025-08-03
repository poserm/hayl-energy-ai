'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Alert } from '@/components/ui/Alert'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'sent' | 'resend'>('request')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || isSubmitting) {
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStep('sent')
    } catch (err) {
      setError('Failed to send reset email. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setIsSubmitting(true)
    setError('')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStep('sent')
    } catch (err) {
      setError('Failed to resend email. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderRequestStep = () => (
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Forgot your password?
        </h1>
        <p className="text-neutral-600 text-sm mb-8">
          Don't worry, we will send you instructions for reset
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" title="Error" closable onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            required
            className="block w-full px-3 py-3 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!email || isSubmitting}
          className="w-full bg-neutral-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? 'Sending...' : 'Reset password'}
        </button>

        {/* Back to Login */}
        <button
          type="button"
          onClick={() => window.history.back()}
          className="w-full bg-white text-neutral-900 py-3 px-4 rounded-lg font-medium border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors duration-200"
        >
          Return to log in
        </button>
      </form>
    </div>
  )

  const renderSentStep = () => (
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Forgot your password?
        </h1>
        <p className="text-neutral-600 text-sm mb-2">
          We've sent a password reset link to your email
        </p>
        <p className="text-neutral-900 text-sm font-medium mb-8">
          {email}
        </p>
      </div>

      <div className="space-y-4">
        {/* Continue Button */}
        <Link href="/login">
          <button className="w-full bg-neutral-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors duration-200">
            Continue
          </button>
        </Link>

        {/* Back to Login */}
        <Link href="/login">
          <button className="w-full bg-white text-neutral-900 py-3 px-4 rounded-lg font-medium border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors duration-200">
            Return to log in
          </button>
        </Link>

        {/* Resend Link */}
        <div className="text-center">
          <span className="text-sm text-neutral-600">
            Didn't receive the email?{' '}
            <button 
              onClick={handleResend}
              disabled={isSubmitting}
              className="font-medium text-neutral-900 hover:text-primary-600 transition-colors duration-200 underline disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Click to resend'}
            </button>
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-sm w-full">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center shadow-lg mr-2">
                <span className="text-white text-sm font-bold">H</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">Hayl Energy AI</span>
            </Link>
            <div className="flex items-center ml-auto text-sm text-neutral-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              United States
            </div>
          </div>

          {step === 'request' && renderRequestStep()}
          {step === 'sent' && renderSentStep()}
        </div>
      </div>

      {/* Right side - Illustration/Background */}
      <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-gradient-to-br from-primary-50 to-secondary-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-secondary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Placeholder for illustration */}
        <div className="relative z-10 w-80 h-80 bg-white rounded-2xl shadow-2xl flex items-center justify-center border border-neutral-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Secure Reset</h3>
            <p className="text-neutral-600 text-sm">Your account security is our priority</p>
          </div>
        </div>
      </div>
    </div>
  )
}