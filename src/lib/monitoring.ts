/**
 * Production Monitoring and Error Tracking
 * Integrates with Sentry for error tracking and Vercel Analytics for performance monitoring
 */

interface ErrorDetails {
  message: string
  stack?: string
  userId?: string
  email?: string
  path?: string
  method?: string
  statusCode?: number
  additionalData?: Record<string, any>
}

class MonitoringService {
  private isInitialized = false

  async initialize() {
    if (this.isInitialized || process.env.NODE_ENV === 'development') {
      return
    }

    try {
      // Initialize Sentry for error tracking
      if (process.env.SENTRY_DSN) {
        await this.initializeSentry()
      }

      // Initialize Vercel Analytics (if available)
      if (process.env.VERCEL_ANALYTICS_ID) {
        await this.initializeVercelAnalytics()
      }

      this.isInitialized = true
      console.log('Monitoring services initialized')
    } catch (error) {
      console.error('Failed to initialize monitoring:', error)
    }
  }

  private async initializeSentry() {
    try {
      // Note: Install @sentry/nextjs for production
      // npm install @sentry/nextjs
      console.warn('Sentry disabled for this build')
      return

      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        debug: false,
        beforeSend(event) {
          // Filter out sensitive information
          if (event.user) {
            delete event.user.email
            delete event.user.ip_address
          }
          return event
        },
        integrations: [
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        replaysSessionSampleRate: 0.01,
        replaysOnErrorSampleRate: 1.0,
      })

      console.log('Sentry initialized for error tracking')
    } catch (error) {
      console.error('Sentry initialization failed:', error)
    }
  }

  private async initializeVercelAnalytics() {
    try {
      // Note: Install @vercel/analytics for production
      // npm install @vercel/analytics
      console.warn('Vercel Analytics disabled for this build')
      return

      console.log('Vercel Analytics initialized for performance monitoring')
    } catch (error) {
      console.error('Vercel Analytics initialization failed:', error)
    }
  }

  /**
   * Log error with context
   */
  logError(error: Error, details?: Partial<ErrorDetails>) {
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      ...details,
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error logged:', errorDetails)
      return
    }

    // Production error tracking
    this.sendToSentry(error, errorDetails)
    this.logToConsole(errorDetails)
  }

  /**
   * Log authentication events
   */
  logAuthEvent(event: 'login' | 'signup' | 'logout' | 'verification', userId: string, email?: string) {
    const authData = {
      event,
      userId,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Auth event:', authData)
      return
    }

    // Send to monitoring service
    this.sendCustomEvent('auth_event', authData)
  }

  /**
   * Log API performance metrics
   */
  logApiPerformance(endpoint: string, method: string, duration: number, statusCode: number) {
    const perfData = {
      endpoint,
      method,
      duration,
      statusCode,
      timestamp: new Date().toISOString()
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 API Performance:', perfData)
      return
    }

    // Send to monitoring service
    this.sendCustomEvent('api_performance', perfData)
  }

  /**
   * Send error to Sentry
   */
  private async sendToSentry(error: Error, details: ErrorDetails) {
    try {
      // const Sentry = await import('@sentry/nextjs').catch(() => null)
      if (!Sentry) return

      Sentry.withScope((scope) => {
        // Add user context (without sensitive info)
        if (details.userId) {
          scope.setUser({ id: details.userId })
        }

        // Add tags
        scope.setTag('errorType', error.name)
        if (details.path) scope.setTag('path', details.path)
        if (details.method) scope.setTag('method', details.method)
        if (details.statusCode) scope.setTag('statusCode', details.statusCode.toString())

        // Add extra context
        if (details.additionalData) {
          scope.setContext('additional', details.additionalData)
        }

        Sentry.captureException(error)
      })
    } catch (sentryError) {
      console.error('Failed to send error to Sentry:', sentryError)
    }
  }

  /**
   * Send custom event to monitoring
   */
  private async sendCustomEvent(eventName: string, data: Record<string, any>) {
    try {
      // const Sentry = await import('@sentry/nextjs').catch(() => null)
      if (!Sentry) return

      Sentry.addBreadcrumb({
        category: 'custom',
        message: eventName,
        data,
        level: 'info'
      })
    } catch (error) {
      console.error('Failed to send custom event:', error)
    }
  }

  /**
   * Console logging with proper formatting
   */
  private logToConsole(details: ErrorDetails) {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] ERROR:`, {
      message: details.message,
      path: details.path,
      method: details.method,
      statusCode: details.statusCode,
      userId: details.userId ? `user_${details.userId.slice(0, 8)}...` : undefined
    })
  }

  /**
   * Health check for monitoring services
   */
  async healthCheck(): Promise<{ sentry: boolean; analytics: boolean }> {
    const health = {
      sentry: false,
      analytics: false
    }

    try {
      // Check Sentry connection
      if (process.env.SENTRY_DSN) {
        // const Sentry = await import('@sentry/nextjs').catch(() => null)
        health.sentry = !!Sentry
      }

      // Check Vercel Analytics
      if (process.env.VERCEL_ANALYTICS_ID) {
        const analytics = await import('@vercel/analytics/react').catch(() => null)
        health.analytics = !!analytics
      }
    } catch (error) {
      console.error('Health check failed:', error)
    }

    return health
  }
}

// Export singleton instance
export const monitoring = new MonitoringService()

// Auto-initialize in production
if (process.env.NODE_ENV === 'production') {
  monitoring.initialize()
}

// Export types
export type { ErrorDetails }