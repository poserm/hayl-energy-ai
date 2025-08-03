'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'neutral' | 'white'
  className?: string
  children?: React.ReactNode
  fullScreen?: boolean
  overlay?: boolean
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary', 
  className,
  children,
  fullScreen = false,
  overlay = false,
}: LoadingSpinnerProps) {
  const sizeStyles = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  const variantStyles = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    neutral: 'text-neutral-600',
    white: 'text-white',
  }

  const spinner = (
    <div className={cn(
      'animate-spin rounded-full border-2 border-transparent',
      sizeStyles[size],
      'border-t-current border-r-current',
      variantStyles[variant],
      className
    )} />
  )

  if (fullScreen) {
    return (
      <div className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        overlay && 'bg-black/20 backdrop-blur-sm'
      )}>
        <div className="flex flex-col items-center space-y-4">
          {spinner}
          {children && (
            <div className="text-center text-neutral-600">
              {children}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (children) {
    return (
      <div className="flex flex-col items-center space-y-3">
        {spinner}
        <div className="text-center text-neutral-600">
          {children}
        </div>
      </div>
    )
  }

  return spinner
}

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({ 
  className, 
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-neutral-200 dark:bg-neutral-700'
  
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseStyles,
              variantStyles.text,
              index === lines - 1 && 'w-3/4', // Last line is shorter
              className
            )}
            style={{ width, height }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        className
      )}
      style={{ width, height }}
    />
  )
}

interface LoadingStateProps {
  loading: boolean
  error?: string | null
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  className?: string
}

export function LoadingState({
  loading,
  error,
  children,
  loadingComponent,
  errorComponent,
  className,
}: LoadingStateProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        {loadingComponent || (
          <LoadingSpinner size="lg">
            <span className="text-lg font-medium">Loading...</span>
          </LoadingSpinner>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        {errorComponent || (
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Something went wrong</h3>
            <p className="text-neutral-600">{error}</p>
          </div>
        )}
      </div>
    )
  }

  return <>{children}</>
}

interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  label?: string
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const variantStyles = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600',
  }

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-neutral-700">
            {label || 'Progress'}
          </span>
          <span className="text-sm text-neutral-500">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={cn(
        'w-full bg-neutral-200 rounded-full overflow-hidden',
        sizeStyles[size]
      )}>
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            variantStyles[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'neutral'
  className?: string
}

export function PulseLoader({ 
  size = 'md', 
  variant = 'primary', 
  className 
}: PulseLoaderProps) {
  const sizeStyles = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  const variantStyles = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    neutral: 'bg-neutral-600',
  }

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'rounded-full animate-pulse',
            sizeStyles[size],
            variantStyles[variant]
          )}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  )
}

export default LoadingSpinner