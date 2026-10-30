const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_PASSWORD_LENGTH = 8

export function validateName(value: string): string | undefined {
  if (value.trim().length < 2) return 'الرجاء إدخال الاسم (حرفين على الأقل)'
  return undefined
}

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'الرجاء إدخال البريد الإلكتروني'
  if (!EMAIL_PATTERN.test(value.trim())) return 'صيغة البريد الإلكتروني غير صحيحة'
  return undefined
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'الرجاء إدخال كلمة المرور'
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`
  }
  return undefined
}

export function validateConfirm(password: string, confirm: string): string | undefined {
  if (!confirm) return 'الرجاء تأكيد كلمة المرور'
  if (confirm !== password) return 'كلمتا المرور غير متطابقتين'
  return undefined
}