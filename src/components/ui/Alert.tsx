'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface AlertProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  title?: string
  children: React.ReactNode
  icon?: React.ReactNode
  closable?: boolean
  onClose?: () => void
  className?: string
  actions?: React.ReactNode
}

export function Alert({
  variant = 'default',
  size = 'md',
  title,
  children,
  icon,
  closable = false,
  onClose,
  className,
  actions,
}: AlertProps) {
  const baseStyles = [
    'relative rounded-lg border transition-all duration-200',
    'focus-within:ring-2 focus-within:ring-offset-2',
  ]

  const variantStyles = {
    default: [
      'bg-neutral-50 border-neutral-200 text-neutral-800',
      'focus-within:ring-neutral-500/20',
    ],
    success: [
      'bg-success-50 border-success-200 text-success-800',
      'focus-within:ring-success-500/20',
    ],
    warning: [
      'bg-warning-50 border-warning-200 text-warning-800',
      'focus-within:ring-warning-500/20',
    ],
    error: [
      'bg-error-50 border-error-200 text-error-800',
      'focus-within:ring-error-500/20',
    ],
    info: [
      'bg-primary-50 border-primary-200 text-primary-800',
      'focus-within:ring-primary-500/20',
    ],
  }

  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const iconColorStyles = {
    default: 'text-neutral-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600',
    info: 'text-primary-600',
  }

  const defaultIcons = {
    default: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  const displayIcon = icon || defaultIcons[variant]

  return (
    <div className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}>
      <div className="flex items-start">
        {displayIcon && (
          <div className={cn('flex-shrink-0 mr-3', iconColorStyles[variant])}>
            {displayIcon}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn(
              'font-semibold mb-1',
              size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
            )}>
              {title}
            </h3>
          )}
          
          <div className={cn(
            size === 'sm' ? 'text-sm' : 'text-base'
          )}>
            {children}
          </div>

          {actions && (
            <div className="mt-3 flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>

        {closable && (
          <button
            onClick={onClose}
            className={cn(
              'flex-shrink-0 ml-3 p-1 rounded-md transition-colors duration-200',
              'hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2',
              iconColorStyles[variant],
              variantStyles[variant].includes('ring-neutral') && 'focus:ring-neutral-500/20',
              variantStyles[variant].includes('ring-success') && 'focus:ring-success-500/20',
              variantStyles[variant].includes('ring-warning') && 'focus:ring-warning-500/20',
              variantStyles[variant].includes('ring-error') && 'focus:ring-error-500/20',
              variantStyles[variant].includes('ring-primary') && 'focus:ring-primary-500/20',
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

interface ToastProps extends Omit<AlertProps, 'className'> {
  visible?: boolean
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  onAutoClose?: () => void
}

export function Toast({
  visible = true,
  duration = 5000,
  position = 'top-right',
  onAutoClose,
  onClose,
  ...alertProps
}: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(visible)

  React.useEffect(() => {
    setIsVisible(visible)
  }, [visible])

  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onAutoClose?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onAutoClose])

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      'fixed z-50 max-w-sm w-full transition-all duration-300',
      positionStyles[position],
      isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-2'
    )}>
      <Alert
        {...alertProps}
        closable={true}
        onClose={handleClose}
        className="shadow-lg border-2"
      />
    </div>
  )
}

interface NotificationProps {
  title: string
  message: string
  variant?: 'success' | 'warning' | 'error' | 'info'
  duration?: number
  actions?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }[]
}

export function useNotification() {
  const [notifications, setNotifications] = React.useState<(NotificationProps & { id: string })[]>([])

  const addNotification = React.useCallback((notification: NotificationProps) => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications(prev => [...prev, { ...notification, id }])
    
    if (notification.duration !== 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, notification.duration || 5000)
    }
  }, [])

  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const NotificationContainer = React.useCallback(() => (
    <div className="fixed top-4 right-4 z-50 space-y-4 max-w-sm w-full">
      {notifications.map(notification => (
        <Alert
          key={notification.id}
          variant={notification.variant}
          title={notification.title}
          closable
          onClose={() => removeNotification(notification.id)}
          className="shadow-lg border-2 animate-slide-up"
          actions={notification.actions && (
            <div className="flex space-x-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick()
                    removeNotification(notification.id)
                  }}
                  className={cn(
                    'px-3 py-1 rounded text-sm font-medium transition-colors duration-200',
                    action.variant === 'primary' 
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        >
          {notification.message}
        </Alert>
      ))}
    </div>
  ), [notifications, removeNotification])

  return {
    addNotification,
    removeNotification,
    NotificationContainer,
    notifications,
  }
}

export default Alert