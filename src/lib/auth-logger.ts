import { NextRequest } from 'next/server'

interface AuthLogEntry {
  timestamp: string
  event: AuthEvent
  userId?: string
  email?: string
  ip: string
  userAgent: string
  success: boolean
  error?: string
  metadata?: Record<string, any>
  sessionId?: string
  duration?: number
}

type AuthEvent = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'signup_attempt'
  | 'signup_success'
  | 'signup_failure'
  | 'logout'
  | 'token_refresh'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'account_locked'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'invalid_token'
  | 'token_expired'

interface SecurityAlert {
  level: 'low' | 'medium' | 'high' | 'critical'
  type: string
  message: string
  userId?: string
  ip: string
  timestamp: string
  metadata?: Record<string, any>
}

class AuthLogger {
  private logBuffer: AuthLogEntry[] = []
  private alertBuffer: SecurityAlert[] = []
  private readonly maxBufferSize = 1000
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    // Flush logs every 30 seconds in production
    if (process.env.NODE_ENV === 'production') {
      this.flushInterval = setInterval(() => {
        this.flushLogs()
      }, 30000)
    }
  }

  private extractClientInfo(request: NextRequest) {
    // Extract IP address with fallbacks for different proxy setups
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = request.headers.get('x-client-ip')
    
    let ip = forwarded?.split(',')[0]?.trim() || 
             realIp || 
             clientIp || 
             (request as any).ip ||
             'unknown'

    // Handle IPv6 localhost
    if (ip === '::1') ip = '127.0.0.1'

    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    return { ip, userAgent }
  }

  logAuthEvent(
    event: AuthEvent,
    request: NextRequest,
    data: {
      success: boolean
      userId?: string
      email?: string
      error?: string
      metadata?: Record<string, any>
      sessionId?: string
      duration?: number
    }
  ) {
    const { ip, userAgent } = this.extractClientInfo(request)
    
    const logEntry: AuthLogEntry = {
      timestamp: new Date().toISOString(),
      event,
      ip,
      userAgent,
      ...data
    }

    // Add to buffer
    this.logBuffer.push(logEntry)
    
    // Manage buffer size
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth Event:', logEntry)
    }

    // Check for security alerts
    this.checkSecurityAlerts(logEntry, request)

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry)
    }
  }

  private checkSecurityAlerts(entry: AuthLogEntry, request: NextRequest) {
    // Multiple failed login attempts
    if (entry.event === 'login_failure') {
      const recentFailures = this.getRecentFailures(entry.ip, entry.email)
      if (recentFailures >= 3) {
        this.createSecurityAlert('medium', 'multiple_login_failures', 
          `${recentFailures} failed login attempts`, entry, request)
      }
      if (recentFailures >= 5) {
        this.createSecurityAlert('high', 'potential_brute_force', 
          `${recentFailures} failed login attempts - possible brute force`, entry, request)
      }
    }

    // Rapid signup attempts from same IP
    if (entry.event === 'signup_attempt') {
      const recentSignups = this.getRecentSignups(entry.ip)
      if (recentSignups >= 3) {
        this.createSecurityAlert('medium', 'rapid_signup_attempts', 
          `${recentSignups} signup attempts from same IP`, entry, request)
      }
    }

    // Login from new location/device
    if (entry.event === 'login_success' && entry.userId) {
      const isNewDevice = this.isNewDevice(entry.userId, entry.userAgent, entry.ip)
      if (isNewDevice) {
        this.createSecurityAlert('low', 'new_device_login', 
          'Login from new device/location', entry, request)
      }
    }

    // Suspicious token activities
    if (entry.event === 'invalid_token' || entry.event === 'token_expired') {
      const recentTokenIssues = this.getRecentTokenIssues(entry.ip)
      if (recentTokenIssues >= 5) {
        this.createSecurityAlert('medium', 'token_manipulation', 
          'Multiple token validation failures', entry, request)
      }
    }
  }

  private createSecurityAlert(
    level: SecurityAlert['level'],
    type: string,
    message: string,
    entry: AuthLogEntry,
    request: NextRequest
  ) {
    const alert: SecurityAlert = {
      level,
      type,
      message,
      userId: entry.userId,
      ip: entry.ip,
      timestamp: entry.timestamp,
      metadata: {
        event: entry.event,
        userAgent: entry.userAgent,
        ...entry.metadata
      }
    }

    this.alertBuffer.push(alert)
    
    // Log high and critical alerts immediately
    if (level === 'high' || level === 'critical') {
      console.warn('SECURITY ALERT:', alert)
      this.sendSecurityAlert(alert)
    }

    // Manage alert buffer size
    if (this.alertBuffer.length > 100) {
      this.alertBuffer = this.alertBuffer.slice(-100)
    }
  }

  private getRecentFailures(ip: string, email?: string): number {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    return this.logBuffer.filter(entry => 
      entry.timestamp > fiveMinutesAgo &&
      entry.event === 'login_failure' &&
      (entry.ip === ip || (email && entry.email === email))
    ).length
  }

  private getRecentSignups(ip: string): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    return this.logBuffer.filter(entry => 
      entry.timestamp > oneHourAgo &&
      entry.event === 'signup_attempt' &&
      entry.ip === ip
    ).length
  }

  private getRecentTokenIssues(ip: string): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    return this.logBuffer.filter(entry => 
      entry.timestamp > oneHourAgo &&
      (entry.event === 'invalid_token' || entry.event === 'token_expired') &&
      entry.ip === ip
    ).length
  }

  private isNewDevice(userId: string, userAgent: string, ip: string): boolean {
    // Simple check - in production you'd want a more sophisticated approach
    const userLogins = this.logBuffer.filter(entry => 
      entry.userId === userId &&
      entry.event === 'login_success'
    )

    // If user has logged in before, check if this device/IP combo is new
    if (userLogins.length > 1) {
      const knownDevices = userLogins.map(entry => `${entry.userAgent}:${entry.ip}`)
      return !knownDevices.includes(`${userAgent}:${ip}`)
    }

    return false
  }

  private async sendToLoggingService(entry: AuthLogEntry) {
    // In production, send to your logging service (e.g., Winston, Datadog, etc.)
    try {
      // Example implementation:
      // await fetch('https://api.your-logging-service.com/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // })
    } catch (error) {
      console.error('Failed to send log to external service:', error)
    }
  }

  private async sendSecurityAlert(alert: SecurityAlert) {
    // Send critical security alerts to monitoring system
    try {
      // Example implementation:
      // await fetch('https://api.your-monitoring-service.com/alerts', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(alert)
      // })
      
      // Or send email/Slack notification for critical alerts
      if (alert.level === 'critical') {
        // await sendCriticalAlertNotification(alert)
      }
    } catch (error) {
      console.error('Failed to send security alert:', error)
    }
  }

  private flushLogs() {
    if (this.logBuffer.length > 0) {
      // In production, batch send logs to external service
      const logsToFlush = [...this.logBuffer]
      this.logBuffer = []
      
      // Send to external logging service
      this.batchSendLogs(logsToFlush)
    }
  }

  private async batchSendLogs(logs: AuthLogEntry[]) {
    try {
      // Batch send to logging service
      // await fetch('https://api.your-logging-service.com/batch-logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ logs })
      // })
    } catch (error) {
      console.error('Failed to batch send logs:', error)
      // Re-add logs to buffer on failure
      this.logBuffer.unshift(...logs.slice(-500)) // Keep last 500 logs
    }
  }

  // Public methods for manual logging
  logLogin(request: NextRequest, success: boolean, data: Partial<AuthLogEntry> = {}) {
    this.logAuthEvent(success ? 'login_success' : 'login_failure', request, {
      success,
      ...data
    })
  }

  logSignup(request: NextRequest, success: boolean, data: Partial<AuthLogEntry> = {}) {
    this.logAuthEvent(success ? 'signup_success' : 'signup_failure', request, {
      success,
      ...data
    })
  }

  logLogout(request: NextRequest, data: Partial<AuthLogEntry> = {}) {
    this.logAuthEvent('logout', request, {
      success: true,
      ...data
    })
  }

  logRateLimit(request: NextRequest, data: Partial<AuthLogEntry> = {}) {
    this.logAuthEvent('rate_limit_exceeded', request, {
      success: false,
      ...data
    })
  }

  logSuspiciousActivity(request: NextRequest, reason: string, data: Partial<AuthLogEntry> = {}) {
    this.logAuthEvent('suspicious_activity', request, {
      success: false,
      error: reason,
      ...data
    })
  }

  // Get recent logs for debugging/admin purposes
  getRecentLogs(limit = 100): AuthLogEntry[] {
    return this.logBuffer.slice(-limit)
  }

  getRecentAlerts(limit = 50): SecurityAlert[] {
    return this.alertBuffer.slice(-limit)
  }

  // Get analytics data
  getAuthStats(timeframe: 'hour' | 'day' | 'week' = 'day') {
    const now = new Date()
    const cutoff = new Date()
    
    switch (timeframe) {
      case 'hour':
        cutoff.setHours(now.getHours() - 1)
        break
      case 'day':
        cutoff.setDate(now.getDate() - 1)
        break
      case 'week':
        cutoff.setDate(now.getDate() - 7)
        break
    }

    const recentLogs = this.logBuffer.filter(log => 
      new Date(log.timestamp) > cutoff
    )

    return {
      totalEvents: recentLogs.length,
      successfulLogins: recentLogs.filter(log => log.event === 'login_success').length,
      failedLogins: recentLogs.filter(log => log.event === 'login_failure').length,
      signups: recentLogs.filter(log => log.event === 'signup_success').length,
      uniqueIPs: new Set(recentLogs.map(log => log.ip)).size,
      alerts: this.alertBuffer.filter(alert => 
        new Date(alert.timestamp) > cutoff
      ).length
    }
  }

  // Cleanup method
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flushLogs()
  }
}

// Singleton instance
export const authLogger = new AuthLogger()

// Convenience functions
export function logAuthEvent(
  event: AuthEvent,
  request: NextRequest,
  data: Parameters<typeof authLogger.logAuthEvent>[2]
) {
  return authLogger.logAuthEvent(event, request, data)
}

export function logLogin(request: NextRequest, success: boolean, data?: Partial<AuthLogEntry>) {
  return authLogger.logLogin(request, success, data)
}

export function logSignup(request: NextRequest, success: boolean, data?: Partial<AuthLogEntry>) {
  return authLogger.logSignup(request, success, data)
}

export function logLogout(request: NextRequest, data?: Partial<AuthLogEntry>) {
  return authLogger.logLogout(request, data)
}

export function logSuspiciousActivity(request: NextRequest, reason: string, data?: Partial<AuthLogEntry>) {
  return authLogger.logSuspiciousActivity(request, reason, data)
}

// Export types for external use
export type { AuthLogEntry, AuthEvent, SecurityAlert }