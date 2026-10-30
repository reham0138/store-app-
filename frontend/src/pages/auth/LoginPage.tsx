import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../shared/hooks/useAuth.ts'
import { AuthError } from '../../shared/services/authService.ts'
import { AuthCard } from './components/AuthCard.tsx'
import { FormError } from './components/FormError.tsx'
import { PasswordField } from './components/PasswordField.tsx'
import { SubmitButton } from './components/SubmitButton.tsx'
import { TextField } from './components/TextField.tsx'
import { validateEmail, validatePassword } from './validation.ts'

interface FieldErrors {
  email?: string
  password?: string
}

function getRedirectTarget(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/'
}

export default function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // مسجّل دخول أصلاً (أو لسا خلّص تسجيل الدخول): ارجع للصفحة اللي كان رايحلها
  if (user) return <Navigate to={getRedirectTarget(location.state)} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    const nextErrors: FieldErrors = {
      email: validateEmail(email),
      password: password ? undefined : validatePassword(password),
    }
    setErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) return

    setSubmitting(true)
    try {
      await login({ email, password })
    } catch (error) {
      setFormError(error instanceof AuthError ? error.message : 'حدث خطأ غير متوقع، حاول مرة أخرى')
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="تسجيل الدخول"
      subtitle="أهلاً بعودتك، سجّل دخولك لمتابعة التسوّق"
      footer={
        <>
          ليس لديك حساب؟{' '}
          <Link to="/register" className="font-semibold text-brand-navy underline">
            أنشئ حساباً
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {formError && <FormError message={formError} />}
        <TextField
          label="البريد الإلكتروني"
          type="email"
          dir="ltr"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <PasswordField
          label="كلمة المرور"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <SubmitButton loading={submitting}>تسجيل الدخول</SubmitButton>
      </form>
    </AuthCard>
  )
}
