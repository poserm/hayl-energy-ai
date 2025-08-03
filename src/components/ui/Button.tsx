'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    disabled,
    children,
    ...props
  }, ref) => {
    const baseStyles = [
      'inline-flex items-center justify-center',
      'font-medium text-center',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'relative overflow-hidden',
      fullWidth && 'w-full'
    ]

    const variants = {
      primary: [
        'bg-gradient-to-r from-primary-600 to-secondary-600',
        'text-white shadow-lg shadow-primary-500/25',
        'hover:from-primary-700 hover:to-secondary-700',
        'hover:shadow-xl hover:shadow-primary-500/30',
        'focus:ring-primary-500',
        'active:from-primary-800 active:to-secondary-800',
      ],
      secondary: [
        'bg-neutral-100 text-neutral-900',
        'border border-neutral-200',
        'hover:bg-neutral-200 hover:border-neutral-300',
        'focus:ring-neutral-500',
        'active:bg-neutral-300',
      ],
      outline: [
        'border-2 border-primary-600 text-primary-600',
        'bg-transparent',
        'hover:bg-primary-50 hover:border-primary-700',
        'focus:ring-primary-500',
        'active:bg-primary-100',
      ],
      ghost: [
        'text-neutral-700 bg-transparent',
        'hover:bg-neutral-100 hover:text-neutral-900',
        'focus:ring-neutral-500',
        'active:bg-neutral-200',
      ],
      link: [
        'text-primary-600 bg-transparent',
        'hover:text-primary-700 hover:underline',
        'focus:ring-primary-500',
        'active:text-primary-800',
      ],
      destructive: [
        'bg-error-600 text-white',
        'hover:bg-error-700',
        'focus:ring-error-500',
        'active:bg-error-800',
      ],
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-sm rounded-lg',
      lg: 'px-6 py-3 text-base rounded-lg',
      xl: 'px-8 py-4 text-lg rounded-xl',
    }

    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        
        {children}
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, type ButtonProps }