'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (error) {
      setError('')
    }
  }

  const validateForm = () => {
    if (!formData.password) {
      setError('Password is required')
      return false
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || isSubmitting) {
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(true)
    } catch (err) {
      setError('Failed to reset password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex relative">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <Image
            src="/background.png"
            alt="Clean energy background"
            fill
            className="object-cover opacity-15"
            priority
          />
        </div>
        
        {/* Left side - Success message */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-sm relative z-10">
          <div className="max-w-sm w-full text-center">
            {/* Header */}
            <div className="flex items-center justify-center mb-8">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Hayl Energy AI Logo"
                  width={32}
                  height={32}
                  className="rounded-lg shadow-md mr-3"
                />
                <span className="text-xl font-bold text-neutral-900">Hayl Energy AI</span>
              </Link>
            </div>

            <div className="space-y-6">
              {/* Success icon */}
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                  Password Reset Successful
                </h1>
                <p className="text-neutral-600 text-sm">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
              </div>

              <Link href="/login">
                <button className="w-full bg-neutral-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors duration-200">
                  Continue to Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right side - Illustration/Background */}
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-gradient-to-br from-primary-50/80 to-secondary-50/80 relative overflow-hidden backdrop-blur-sm">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-secondary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          </div>
          
          {/* Illustration with logo */}
          <div className="relative z-10 w-80 h-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl flex items-center justify-center border border-neutral-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Image
                  src="/logo.png"
                  alt="Hayl Energy AI Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">All Set!</h3>
              <p className="text-neutral-600 text-sm">Your account is ready to go</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex relative">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/background.png"
          alt="Clean energy background"
          fill
          className="object-cover opacity-15"
          priority
        />
      </div>
      
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-sm relative z-10">
        <div className="max-w-sm w-full">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Hayl Energy AI Logo"
                width={32}
                height={32}
                className="rounded-lg shadow-md mr-3"
              />
              <span className="text-xl font-bold text-neutral-900">Hayl Energy AI</span>
            </Link>
            <div className="flex items-center ml-auto text-sm text-neutral-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              United States
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-left">
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                Set a new password
              </h1>
              <p className="text-neutral-600 text-sm mb-8">
                New password must be different from your previously used password.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="error" title="Error" closable onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••••"
                    autoComplete="new-password"
                    required
                    className="block w-full px-3 py-3 pr-10 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
                  Retype password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••••"
                    autoComplete="new-password"
                    required
                    className="block w-full px-3 py-3 pr-10 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!formData.password || !formData.confirmPassword || isSubmitting}
                className="w-full bg-neutral-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right side - Illustration/Background */}
      <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-gradient-to-br from-primary-50/80 to-secondary-50/80 relative overflow-hidden backdrop-blur-sm">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-secondary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Illustration with logo */}
        <div className="relative z-10 w-80 h-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl flex items-center justify-center border border-neutral-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Image
                src="/logo.png"
                alt="Hayl Energy AI Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">New Password</h3>
            <p className="text-neutral-600 text-sm">Create a strong, secure password</p>
          </div>
        </div>
      </div>
    </div>
  )
}