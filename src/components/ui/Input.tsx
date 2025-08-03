'use client'

import React, { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  helperText?: string
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  variant?: 'default' | 'filled' | 'outlined'
  inputSize?: 'sm' | 'md' | 'lg'
  showPasswordToggle?: boolean
  loading?: boolean
  onClear?: () => void
  showClearButton?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    label,
    error,
    success,
    helperText,
    startIcon,
    endIcon,
    variant = 'default',
    inputSize = 'md',
    showPasswordToggle = false,
    loading = false,
    disabled,
    placeholder,
    value,
    onClear,
    showClearButton = false,
    id,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const isPassword = type === 'password'
    const actualType = isPassword && showPassword ? 'text' : type
    const hasValue = value != null && value !== ''
    const hasError = !!error
    const hasSuccess = !!success && !hasError
    const showClear = showClearButton && hasValue && !disabled && !loading

    const baseStyles = [
      'block w-full rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'placeholder:text-neutral-400',
    ]

    const variantStyles = {
      default: [
        'border border-neutral-300 bg-white',
        'hover:border-neutral-400',
        hasError && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
        hasSuccess && 'border-success-500 focus:border-success-500 focus:ring-success-500/20',
        !hasError && !hasSuccess && isFocused && 'border-primary-500 focus:border-primary-500 focus:ring-primary-500/20',
        !hasError && !hasSuccess && !isFocused && 'focus:border-primary-500 focus:ring-primary-500/20',
      ],
      filled: [
        'border-0 bg-neutral-100',
        'hover:bg-neutral-200',
        'focus:bg-white focus:ring-primary-500/20',
        hasError && 'focus:ring-error-500/20',
        hasSuccess && 'focus:ring-success-500/20',
      ],
      outlined: [
        'border-2 border-neutral-300 bg-transparent',
        'hover:border-neutral-400',
        hasError && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
        hasSuccess && 'border-success-500 focus:border-success-500 focus:ring-success-500/20',
        !hasError && !hasSuccess && 'focus:border-primary-500 focus:ring-primary-500/20',
      ],
    }

    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    }

    const iconSizeStyles = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }

    const paddingWithIcons = cn(
      sizeStyles[inputSize],
      startIcon && {
        sm: 'pl-10',
        md: 'pl-12',
        lg: 'pl-14',
      }[inputSize],
      (endIcon || showPasswordToggle || showClear || loading) && {
        sm: 'pr-10',
        md: 'pr-12',
        lg: 'pr-14',
      }[inputSize]
    )

    const PasswordToggleIcon = showPassword ? (
      <svg className={iconSizeStyles[inputSize]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ) : (
      <svg className={iconSizeStyles[inputSize]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
      </svg>
    )

    const LoadingIcon = (
      <svg className={cn(iconSizeStyles[inputSize], 'animate-spin')} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    )

    const ClearIcon = (
      <svg className={iconSizeStyles[inputSize]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium transition-colors duration-200',
              hasError ? 'text-error-700' : hasSuccess ? 'text-success-700' : 'text-neutral-700',
              disabled && 'opacity-50'
            )}
          >
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {/* Start Icon */}
          {startIcon && (
            <div className={cn(
              'absolute left-0 top-0 h-full flex items-center justify-center pointer-events-none',
              {
                sm: 'w-10',
                md: 'w-12',
                lg: 'w-14',
              }[inputSize],
              hasError ? 'text-error-400' : hasSuccess ? 'text-success-400' : 'text-neutral-400'
            )}>
              {startIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={actualType}
            id={inputId}
            className={cn(
              baseStyles,
              variantStyles[variant],
              paddingWithIcons,
              className
            )}
            placeholder={placeholder}
            disabled={disabled}
            value={value}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />

          {/* End Icons Container */}
          <div className={cn(
            'absolute right-0 top-0 h-full flex items-center',
            {
              sm: 'pr-3 space-x-1',
              md: 'pr-4 space-x-2',
              lg: 'pr-5 space-x-2',
            }[inputSize]
          )}>
            {/* Loading Spinner */}
            {loading && (
              <div className="text-neutral-400">
                {LoadingIcon}
              </div>
            )}

            {/* Clear Button */}
            {showClear && !loading && (
              <button
                type="button"
                onClick={onClear}
                className={cn(
                  'text-neutral-400 hover:text-neutral-600 focus:text-neutral-600',
                  'focus:outline-none transition-colors duration-200'
                )}
                tabIndex={-1}
              >
                {ClearIcon}
              </button>
            )}

            {/* Password Toggle */}
            {showPasswordToggle && isPassword && !loading && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  'text-neutral-400 hover:text-neutral-600 focus:text-neutral-600',
                  'focus:outline-none transition-colors duration-200'
                )}
                tabIndex={-1}
              >
                {PasswordToggleIcon}
              </button>
            )}

            {/* Custom End Icon */}
            {endIcon && !loading && (
              <div className={cn(
                hasError ? 'text-error-400' : hasSuccess ? 'text-success-400' : 'text-neutral-400'
              )}>
                {endIcon}
              </div>
            )}
          </div>
        </div>

        {/* Helper Text / Error / Success */}
        {(helperText || error || success) && (
          <div className={cn(
            'text-sm transition-colors duration-200',
            hasError ? 'text-error-600' : hasSuccess ? 'text-success-600' : 'text-neutral-500'
          )}>
            {error || success || helperText}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }