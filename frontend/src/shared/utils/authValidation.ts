const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_PASSWORD_LENGTH = 8
export const MAX_NAME_LENGTH = 100
export const MAX_EMAIL_LENGTH = 254

export function validateName(value: string): string | undefined {
  const name = value.trim()
  if (name.length < 2) return 'Enter a name with at least 2 characters.'
  if (name.length > MAX_NAME_LENGTH) {
    return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`
  }
  return undefined
}

export function validateEmail(value: string): string | undefined {
  const email = value.trim()
  if (!email) return 'Enter your email address.'
  if (email.length > MAX_EMAIL_LENGTH) {
    return `Email must be ${MAX_EMAIL_LENGTH} characters or fewer.`
  }
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.'
  return undefined
}

export function validatePassword(value: string): string | undefined {
  if (!value.trim()) return 'Enter your password.'
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  return undefined
}

export function validateConfirm(password: string, confirm: string): string | undefined {
  if (!confirm.trim()) return 'Confirm your password.'
  if (confirm !== password) return 'Passwords do not match.'
  return undefined
}

export function sanitizePhoneInput(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[^\d+()\s-]/g, '')
    .replace(/(?!^)\+/g, '')
}

export function validatePhone(value: string): string | undefined {
  const phone = value.trim()
  if (!phone) return 'Enter your phone number.'
  if (!/^\+?[0-9()\s-]+$/.test(phone)) {
    return 'Use digits and optional +, spaces, parentheses, or hyphens.'
  }

  const digitCount = phone.replace(/\D/g, '').length
  if (digitCount < 7 || digitCount > 15) {
    return 'Enter a phone number containing 7 to 15 digits.'
  }
  return undefined
}