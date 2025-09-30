'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PasswordStrength, calculatePasswordStrength, type PasswordStrength as PasswordStrengthType } from '@/components/ui/PasswordStrength'
import { cn } from '@/lib/utils'

type Step = 'account' | 'role' | 'experience' | 'complete'

interface SignupData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: string
  experienceLevel: string
}

const cleanEnergyRoles = [
  'Project Development',
  'Project Sales', 
  'Policy',
  'Finance',
  'Engineering',
  'Operations & Maintenance',
  'Business Development',
  'Regulatory Affairs',
  'Other, please specify'
]

const experienceLevels = [
  'Entry Level',
  'Mid-Level',
  'Senior or Executive Level'
]

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<Step>('account')
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    experienceLevel: ''
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

  const validateAccountStep = () => {
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

  const handleNext = () => {
    if (currentStep === 'account' && validateAccountStep()) {
      setCurrentStep('role')
    } else if (currentStep === 'role' && formData.role) {
      setCurrentStep('experience')
    } else if (currentStep === 'experience' && formData.experienceLevel) {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep === 'role') {
      setCurrentStep('account')
    } else if (currentStep === 'experience') {
      setCurrentStep('role')
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    clearError()
    
    try {
      await signup(formData.email, formData.password, formData.name || undefined)
      setCurrentStep('complete')
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

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role }))
  }

  const handleExperienceSelect = (experienceLevel: string) => {
    setFormData(prev => ({ ...prev, experienceLevel }))
  }

  const getStepProgress = () => {
    const steps = ['account', 'role', 'experience']
    const currentIndex = steps.indexOf(currentStep)
    return ((currentIndex + 1) / steps.length) * 100
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <Image
            src="/background.png"
            alt="Clean energy background"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/90 to-secondary-50/90"></div>
        </div>
        <LoadingSpinner size="lg" fullScreen>
          <span className="text-lg font-medium">Loading...</span>
        </LoadingSpinner>
      </div>
    )
  }

  const renderAccountStep = () => (
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Get started
        </h1>
        <p className="text-neutral-600 text-sm mb-8">
          Create your account now.
        </p>
      </div>

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

      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        {/* Name Input */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="John Doe"
            autoComplete="name"
            className="block w-full px-3 py-3 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
          />
        </div>

        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            autoComplete="email"
            required
            className="block w-full px-3 py-3 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
          />
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••••"
            autoComplete="new-password"
            required
            className="block w-full px-3 py-3 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
          />
          {formData.password && (
            <PasswordStrength 
              password={formData.password} 
              onStrengthChange={setPasswordStrength}
            />
          )}
        </div>

        {/* Confirm Password Input */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="••••••••••"
            autoComplete="new-password"
            required
            className="block w-full px-3 py-3 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
          />
        </div>

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
        <button
          type="submit"
          disabled={!formData.email || !formData.password || !formData.confirmPassword || !acceptTerms}
          className="w-full bg-neutral-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Sign up
        </button>

        {/* Admin Signup Option */}
        <button
          type="button"
          className="w-full bg-white text-neutral-900 py-3 px-4 rounded-lg font-medium border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors duration-200"
        >
          Sign up as Company admin
        </button>

        {/* Login Link */}
        <div className="text-center">
          <span className="text-sm text-neutral-600">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-medium text-neutral-900 hover:text-primary-600 transition-colors duration-200 underline"
            >
              Log in
            </Link>
          </span>
        </div>
      </form>
    </div>
  )

  const renderRoleStep = () => (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm text-neutral-600 mb-8">
        <span>Step 1</span>
        <div className="flex-1 mx-4">
          <div className="h-1 bg-neutral-200 rounded-full">
            <div className="h-1 bg-neutral-900 rounded-full" style={{ width: '33%' }}></div>
          </div>
        </div>
        <span>of 3</span>
      </div>

      <div className="text-left">
        <h1 className="text-2xl font-bold text-neutral-900 mb-8">
          What best describes your primary role in the energy industry?
        </h1>
      </div>

      <div className="space-y-3">
        {cleanEnergyRoles.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => handleRoleSelect(role)}
            className={cn(
              "w-full p-4 text-left border rounded-lg transition-colors duration-200 hover:bg-neutral-50",
              formData.role === role
                ? "border-primary-500 bg-primary-50 text-primary-900"
                : "border-neutral-300"
            )}
          >
            <div className="flex items-center">
              <div className={cn(
                "w-4 h-4 rounded border-2 mr-3 flex items-center justify-center",
                formData.role === role
                  ? "border-primary-500 bg-primary-500"
                  : "border-neutral-300"
              )}>
                {formData.role === role && (
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                    <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
                  </svg>
                )}
              </div>
              <span className="font-medium">{role}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-4 pt-6">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 bg-white text-neutral-900 py-3 px-4 rounded-lg font-medium border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors duration-200"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!formData.role}
          className="flex-1 bg-neutral-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderExperienceStep = () => (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm text-neutral-600 mb-8">
        <span>Step 2</span>
        <div className="flex-1 mx-4">
          <div className="h-1 bg-neutral-200 rounded-full">
            <div className="h-1 bg-neutral-900 rounded-full" style={{ width: '66%' }}></div>
          </div>
        </div>
        <span>of 3</span>
      </div>

      <div className="text-left">
        <h1 className="text-2xl font-bold text-neutral-900 mb-8">
          Which level best describes your category of expertise in the industry?
        </h1>
      </div>

      <div className="space-y-3">
        {experienceLevels.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => handleExperienceSelect(level)}
            className={cn(
              "w-full p-4 text-left border rounded-lg transition-colors duration-200 hover:bg-neutral-50",
              formData.experienceLevel === level
                ? "border-primary-500 bg-primary-50 text-primary-900"
                : "border-neutral-300"
            )}
          >
            <div className="flex items-center">
              <div className={cn(
                "w-4 h-4 rounded border-2 mr-3 flex items-center justify-center",
                formData.experienceLevel === level
                  ? "border-primary-500 bg-primary-500"
                  : "border-neutral-300"
              )}>
                {formData.experienceLevel === level && (
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                    <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
                  </svg>
                )}
              </div>
              <span className="font-medium">{level}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-4 pt-6">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 bg-white text-neutral-900 py-3 px-4 rounded-lg font-medium border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors duration-200"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!formData.experienceLevel || isSubmitting}
          className="flex-1 bg-neutral-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? 'Creating Account...' : 'Continue'}
        </button>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      {/* Success icon */}
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Account Created Successfully!
        </h1>
        <p className="text-neutral-600 text-sm">
          Please check your email to verify your account before signing in.
        </p>
      </div>

      <Link href="/login?signup=success">
        <button className="w-full bg-neutral-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors duration-200">
          Continue to Sign In
        </button>
      </Link>
    </div>
  )

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
                src="/hayl-logo-new.svg"
                alt="Hayl Energy AI Logo"
                width={32}
                height={32}
                className="rounded-lg shadow-md mr-3"
              />
              <span className="text-xl font-bold text-neutral-900">Hayl Energy AI</span>
            </Link>
            <div className="flex items-center ml-auto text-sm text-neutral-500">
              <Image
                src="/hayl-logo-new.svg"
                alt="Hayl Energy AI Logo"
                width={16}
                height={16}
                className="mr-1"
              />
              HAYL
            </div>
          </div>

          {currentStep === 'account' && renderAccountStep()}
          {currentStep === 'role' && renderRoleStep()}
          {currentStep === 'experience' && renderExperienceStep()}
          {currentStep === 'complete' && renderCompleteStep()}
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
                src="/hayl-logo-new.svg"
                alt="Hayl Energy AI Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Join the Community</h3>
            <p className="text-neutral-600 text-sm">Connect with energy market professionals</p>
          </div>
        </div>
      </div>
    </div>
  )
}