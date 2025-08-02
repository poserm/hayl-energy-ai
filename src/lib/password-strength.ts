interface PasswordStrengthResult {
  score: number // 0-5 (0: very weak, 5: very strong)
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
  feedback: string[]
  isValid: boolean
  entropy: number
  timeToCrack: string
}

interface PasswordCriteria {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  requireMixedCase: boolean
  forbidCommonPasswords: boolean
  forbidPersonalInfo: string[]
  minUniqueChars: number
}

const DEFAULT_CRITERIA: PasswordCriteria = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  requireMixedCase: true,
  forbidCommonPasswords: true,
  forbidPersonalInfo: [],
  minUniqueChars: 4
}

// Common passwords list (subset for demonstration)
const COMMON_PASSWORDS = new Set([
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'login',
  'princess', 'solo', 'qwertyuiop', 'starwars', '12345', '1234567',
  'dragon', 'mustang', 'baseball', 'football', 'shadow', 'master',
  'jordan', 'superman', 'harley', '1234', 'hunter', 'trustno1'
])

// Special characters that are commonly allowed
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

export class PasswordStrengthChecker {
  private criteria: PasswordCriteria

  constructor(criteria: Partial<PasswordCriteria> = {}) {
    this.criteria = { ...DEFAULT_CRITERIA, ...criteria }
  }

  checkPassword(password: string, personalInfo: string[] = []): PasswordStrengthResult {
    const feedback: string[] = []
    let score = 0
    
    // Basic length check
    if (password.length < this.criteria.minLength) {
      feedback.push(`Password must be at least ${this.criteria.minLength} characters long`)
    } else if (password.length >= this.criteria.minLength) {
      score += 1
    }

    if (password.length > this.criteria.maxLength) {
      feedback.push(`Password must not exceed ${this.criteria.maxLength} characters`)
    }

    // Character type checks
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChars = new RegExp(`[${this.escapeRegex(SPECIAL_CHARS)}]`).test(password)

    if (this.criteria.requireUppercase && !hasUppercase) {
      feedback.push('Password must contain at least one uppercase letter')
    } else if (hasUppercase) {
      score += 1
    }

    if (this.criteria.requireLowercase && !hasLowercase) {
      feedback.push('Password must contain at least one lowercase letter')
    } else if (hasLowercase) {
      score += 1
    }

    if (this.criteria.requireNumbers && !hasNumbers) {
      feedback.push('Password must contain at least one number')
    } else if (hasNumbers) {
      score += 1
    }

    if (this.criteria.requireSpecialChars && !hasSpecialChars) {
      feedback.push(`Password must contain at least one special character (${SPECIAL_CHARS})`)
    } else if (hasSpecialChars) {
      score += 1
    }

    // Advanced checks
    const uniqueChars = new Set(password).size
    if (uniqueChars < this.criteria.minUniqueChars) {
      feedback.push(`Password must contain at least ${this.criteria.minUniqueChars} unique characters`)
    }

    // Common password check
    if (this.criteria.forbidCommonPasswords && this.isCommonPassword(password)) {
      feedback.push('Password is too common. Please choose a more unique password')
      score = Math.max(0, score - 2)
    }

    // Personal information check
    const allPersonalInfo = [...personalInfo, ...this.criteria.forbidPersonalInfo]
    if (this.containsPersonalInfo(password, allPersonalInfo)) {
      feedback.push('Password should not contain personal information')
      score = Math.max(0, score - 1)
    }

    // Pattern checks
    if (this.hasRepeatingPatterns(password)) {
      feedback.push('Password contains repeating patterns')
      score = Math.max(0, score - 1)
    }

    if (this.hasKeyboardPatterns(password)) {
      feedback.push('Password contains keyboard patterns')
      score = Math.max(0, score - 1)
    }

    // Bonus points for length and complexity
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1
    if (uniqueChars >= password.length * 0.8) score += 1

    // Calculate entropy
    const entropy = this.calculateEntropy(password)
    const timeToCrack = this.estimateTimeToCrack(entropy)

    // Determine strength level
    const strength = this.getStrengthLevel(score, entropy)
    const isValid = feedback.length === 0 && score >= 3

    // Add positive feedback for strong passwords
    if (score >= 4) {
      feedback.unshift('Good password strength!')
    }

    return {
      score: Math.min(5, score),
      strength,
      feedback,
      isValid,
      entropy,
      timeToCrack
    }
  }

  private isCommonPassword(password: string): boolean {
    const lowerPassword = password.toLowerCase()
    return COMMON_PASSWORDS.has(lowerPassword) || 
           this.isSequentialPattern(lowerPassword) ||
           this.isRepeatingPattern(lowerPassword)
  }

  private containsPersonalInfo(password: string, personalInfo: string[]): boolean {
    const lowerPassword = password.toLowerCase()
    return personalInfo.some(info => 
      info.length >= 3 && lowerPassword.includes(info.toLowerCase())
    )
  }

  private hasRepeatingPatterns(password: string): boolean {
    // Check for 3+ repeating characters
    if (/(.)\1{2,}/.test(password)) return true
    
    // Check for repeating substrings
    for (let i = 2; i <= password.length / 2; i++) {
      const pattern = password.substring(0, i)
      const repeated = pattern.repeat(Math.floor(password.length / i))
      if (password.startsWith(repeated) && repeated.length >= password.length * 0.5) {
        return true
      }
    }
    
    return false
  }

  private hasKeyboardPatterns(password: string): boolean {
    const keyboardRows = [
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
      '1234567890'
    ]
    
    const lowerPassword = password.toLowerCase()
    
    return keyboardRows.some(row => {
      for (let i = 0; i <= row.length - 3; i++) {
        const pattern = row.substring(i, i + 3)
        if (lowerPassword.includes(pattern) || lowerPassword.includes(pattern.split('').reverse().join(''))) {
          return true
        }
      }
      return false
    })
  }

  private isSequentialPattern(password: string): boolean {
    let sequentialCount = 0
    for (let i = 0; i < password.length - 1; i++) {
      const current = password.charCodeAt(i)
      const next = password.charCodeAt(i + 1)
      if (Math.abs(current - next) === 1) {
        sequentialCount++
        if (sequentialCount >= 2) return true
      } else {
        sequentialCount = 0
      }
    }
    return false
  }

  private isRepeatingPattern(password: string): boolean {
    if (password.length <= 2) return false
    const firstChar = password[0]
    return password.split('').every(char => char === firstChar)
  }

  private calculateEntropy(password: string): number {
    let charsetSize = 0
    
    if (/[a-z]/.test(password)) charsetSize += 26
    if (/[A-Z]/.test(password)) charsetSize += 26
    if (/\d/.test(password)) charsetSize += 10
    if (new RegExp(`[${this.escapeRegex(SPECIAL_CHARS)}]`).test(password)) charsetSize += SPECIAL_CHARS.length

    return password.length * Math.log2(charsetSize)
  }

  private estimateTimeToCrack(entropy: number): string {
    // Assuming 1 billion guesses per second
    const guessesPerSecond = 1e9
    const secondsToCrack = Math.pow(2, entropy - 1) / guessesPerSecond
    
    if (secondsToCrack < 1) return 'Instant'
    if (secondsToCrack < 60) return `${Math.round(secondsToCrack)} seconds`
    if (secondsToCrack < 3600) return `${Math.round(secondsToCrack / 60)} minutes`
    if (secondsToCrack < 86400) return `${Math.round(secondsToCrack / 3600)} hours`
    if (secondsToCrack < 31536000) return `${Math.round(secondsToCrack / 86400)} days`
    if (secondsToCrack < 31536000000) return `${Math.round(secondsToCrack / 31536000)} years`
    
    return 'Centuries'
  }

  private getStrengthLevel(score: number, entropy: number): PasswordStrengthResult['strength'] {
    if (score <= 1 || entropy < 30) return 'very-weak'
    if (score <= 2 || entropy < 40) return 'weak'
    if (score <= 3 || entropy < 50) return 'fair'
    if (score <= 4 || entropy < 60) return 'good'
    if (score <= 5 || entropy < 70) return 'strong'
    return 'very-strong'
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  // Generate secure password suggestions
  generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    let charset = ''
    let password = ''
    
    // Ensure at least one character from each required type
    if (this.criteria.requireLowercase) {
      charset += lowercase
      password += lowercase[Math.floor(Math.random() * lowercase.length)]
    }
    
    if (this.criteria.requireUppercase) {
      charset += uppercase
      password += uppercase[Math.floor(Math.random() * uppercase.length)]
    }
    
    if (this.criteria.requireNumbers) {
      charset += numbers
      password += numbers[Math.floor(Math.random() * numbers.length)]
    }
    
    if (this.criteria.requireSpecialChars) {
      charset += symbols
      password += symbols[Math.floor(Math.random() * symbols.length)]
    }
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
    
    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }
}

// Default instance for easy use
export const passwordChecker = new PasswordStrengthChecker()

// Convenience functions
export function checkPasswordStrength(
  password: string, 
  personalInfo: string[] = [],
  criteria?: Partial<PasswordCriteria>
): PasswordStrengthResult {
  const checker = criteria ? new PasswordStrengthChecker(criteria) : passwordChecker
  return checker.checkPassword(password, personalInfo)
}

export function generateSecurePassword(length: number = 16, criteria?: Partial<PasswordCriteria>): string {
  const checker = criteria ? new PasswordStrengthChecker(criteria) : passwordChecker
  return checker.generateSecurePassword(length)
}

// React hook for password strength checking
export function usePasswordStrength(password: string, personalInfo: string[] = []) {
  const result = checkPasswordStrength(password, personalInfo)
  
  const getStrengthColor = () => {
    switch (result.strength) {
      case 'very-weak': return '#dc2626' // red-600
      case 'weak': return '#ea580c' // orange-600
      case 'fair': return '#d97706' // amber-600
      case 'good': return '#65a30d' // lime-600
      case 'strong': return '#16a34a' // green-600
      case 'very-strong': return '#059669' // emerald-600
      default: return '#6b7280' // gray-500
    }
  }
  
  const getStrengthText = () => {
    return result.strength.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  
  return {
    ...result,
    strengthColor: getStrengthColor(),
    strengthText: getStrengthText()
  }
}