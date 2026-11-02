const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_PASSWORD_LENGTH = 8
export const MAX_NAME_LENGTH = 100
export const MAX_EMAIL_LENGTH = 254

export function validateName(value: string): string | undefined {
  const name = value.trim()
  if (name.length < 2) return 'الرجاء إدخال الاسم (حرفين على الأقل)'
  if (name.length > MAX_NAME_LENGTH) {
    return `الاسم يجب ألا يتجاوز ${MAX_NAME_LENGTH} حرفاً`
  }
  return undefined
}

export function validateEmail(value: string): string | undefined {
  const email = value.trim()
  if (!email) return 'الرجاء إدخال البريد الإلكتروني'
  if (email.length > MAX_EMAIL_LENGTH) {
    return `البريد الإلكتروني يجب ألا يتجاوز ${MAX_EMAIL_LENGTH} حرفاً`
  }
  if (!EMAIL_PATTERN.test(email)) return 'صيغة البريد الإلكتروني غير صحيحة'
  return undefined
}

export function validatePassword(value: string): string | undefined {
  if (!value.trim()) return 'الرجاء إدخال كلمة المرور'
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`
  }
  return undefined
}

export function validateConfirm(password: string, confirm: string): string | undefined {
  if (!confirm.trim()) return 'الرجاء تأكيد كلمة المرور'
  if (confirm !== password) return 'كلمتا المرور غير متطابقتين'
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