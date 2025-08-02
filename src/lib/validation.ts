export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export interface SignupData {
  email: string
  password: string
  name?: string
}

export interface LoginData {
  email: string
  password: string
}

export function validateSignupData(data: any): { isValid: boolean; errors: string[]; data?: SignupData } {
  const errors: string[] = []
  
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required')
  } else if (!validateEmail(data.email)) {
    errors.push('Invalid email format')
  }
  
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required')
  } else {
    const passwordValidation = validatePassword(data.password)
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors)
    }
  }
  
  if (data.name && typeof data.name !== 'string') {
    errors.push('Name must be a string')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      email: data.email.toLowerCase().trim(),
      password: data.password,
      name: data.name?.trim() || undefined
    } : undefined
  }
}

export function validateLoginData(data: any): { isValid: boolean; errors: string[]; data?: LoginData } {
  const errors: string[] = []
  
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required')
  } else if (!validateEmail(data.email)) {
    errors.push('Invalid email format')
  }
  
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      email: data.email.toLowerCase().trim(),
      password: data.password
    } : undefined
  }
}