'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
  className?: string
  showRequirements?: boolean
  onStrengthChange?: (strength: PasswordStrength) => void
}

export interface PasswordStrength {
  score: number // 0-4
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong'
  feedback: string[]
  requirements: {
    minLength: boolean
    hasLowercase: boolean
    hasUppercase: boolean
    hasNumber: boolean
    hasSpecial: boolean
  }
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const metRequirements = Object.values(requirements).filter(Boolean).length
  const feedback: string[] = []

  // Generate feedback
  if (!requirements.minLength) {
    feedback.push('Password must be at least 8 characters long')
  }
  if (!requirements.hasLowercase) {
    feedback.push('Add lowercase letters')
  }
  if (!requirements.hasUppercase) {
    feedback.push('Add uppercase letters')
  }
  if (!requirements.hasNumber) {
    feedback.push('Add numbers')
  }
  if (!requirements.hasSpecial) {
    feedback.push('Add special characters (!@#$%^&*)')
  }

  // Calculate score and level
  let score = 0
  let level: PasswordStrength['level'] = 'very-weak'

  if (password.length === 0) {
    score = 0
    level = 'very-weak'
  } else if (metRequirements < 2) {
    score = 1
    level = 'very-weak'
  } else if (metRequirements < 3) {
    score = 2
    level = 'weak'
  } else if (metRequirements < 4) {
    score = 3
    level = 'fair'
  } else if (metRequirements < 5) {
    score = 4
    level = 'good'
  } else {
    score = 5
    level = 'strong'
  }

  // Additional checks for strong passwords
  if (password.length >= 12 && metRequirements === 5) {
    score = 5
    level = 'strong'
  }

  return {
    score,
    level,
    feedback,
    requirements,
  }
}

export function PasswordStrength({ 
  password, 
  className, 
  showRequirements = true,
  onStrengthChange 
}: PasswordStrengthProps) {
  const strength = calculatePasswordStrength(password)

  React.useEffect(() => {
    onStrengthChange?.(strength)
  }, [strength, onStrengthChange])

  const strengthConfig = {
    'very-weak': {
      color: 'bg-error-500',
      textColor: 'text-error-600',
      label: 'Very Weak',
      width: '20%',
    },
    'weak': {
      color: 'bg-error-400',
      textColor: 'text-error-600',
      label: 'Weak',
      width: '40%',
    },
    'fair': {
      color: 'bg-warning-500',
      textColor: 'text-warning-600',
      label: 'Fair',
      width: '60%',
    },
    'good': {
      color: 'bg-secondary-500',
      textColor: 'text-secondary-600',
      label: 'Good',
      width: '80%',
    },
    'strong': {
      color: 'bg-success-500',
      textColor: 'text-success-600',
      label: 'Strong',
      width: '100%',
    },
  }

  const config = strengthConfig[strength.level]

  if (!password) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-neutral-700">
            Password Strength
          </span>
          <span className={cn('text-sm font-medium', config.textColor)}>
            {config.label}
          </span>
        </div>
        
        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300 ease-out rounded-full',
              config.color
            )}
            style={{ width: config.width }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-neutral-700">
            Requirements:
          </span>
          <div className="grid grid-cols-1 gap-1">
            <RequirementItem 
              met={strength.requirements.minLength}
              text="At least 8 characters"
            />
            <RequirementItem 
              met={strength.requirements.hasLowercase}
              text="One lowercase letter"
            />
            <RequirementItem 
              met={strength.requirements.hasUppercase}
              text="One uppercase letter"
            />
            <RequirementItem 
              met={strength.requirements.hasNumber}
              text="One number"
            />
            <RequirementItem 
              met={strength.requirements.hasSpecial}
              text="One special character"
            />
          </div>
        </div>
      )}

      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((feedback, index) => (
            <div key={index} className="text-sm text-warning-600 flex items-center">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {feedback}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface RequirementItemProps {
  met: boolean
  text: string
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <div className={cn(
      'flex items-center text-sm transition-colors duration-200',
      met ? 'text-success-600' : 'text-neutral-500'
    )}>
      <div className={cn(
        'w-4 h-4 mr-2 rounded-full flex items-center justify-center transition-colors duration-200',
        met ? 'bg-success-100' : 'bg-neutral-100'
      )}>
        {met ? (
          <svg className="w-3 h-3 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
        )}
      </div>
      {text}
    </div>
  )
}

export default PasswordStrength