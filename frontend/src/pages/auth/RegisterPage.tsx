import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../shared/hooks/useAuth.ts'
import { AuthError } from '../../shared/services/authService.ts'
import { AuthCard } from './components/AuthCard.tsx'
import { FormError } from './components/FormError.tsx'
import { PasswordField } from './components/PasswordField.tsx'
import { SubmitButton } from './components/SubmitButton.tsx'
import { TextField } from './components/TextField.tsx'
import {
  MIN_PASSWORD_LENGTH,
  validateConfirm,
  validateEmail,
  validateName,
  validatePassword,
} from './validation.ts'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  confirm?: string
}

export default function RegisterPage() {
  const { user, register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    const nextErrors: FieldErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: validateConfirm(password, confirm),
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setSubmitting(true)
    try {
      await register({ name, email, password })
    } catch (error) {
      if (error instanceof AuthError && error.code === 'EMAIL_TAKEN') {
        setErrors({ email: error.message })
      } else {
        setFormError('حدث خطأ غير متوقع، حاول مرة أخرى')
      }
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="إنشاء حساب"
      subtitle="سجّل بياناتك لتبدأ التسوّق وتتابع طلباتك"
      footer={
        <>
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="font-semibold text-brand-navy underline">
            سجّل الدخول
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {formError && <FormError message={formError} />}
        <TextField
          label="الاسم"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
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
          autoComplete="new-password"
          placeholder={`${MIN_PASSWORD_LENGTH} أحرف على الأقل`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <PasswordField
          label="تأكيد كلمة المرور"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <SubmitButton loading={submitting}>إنشاء الحساب</SubmitButton>
      </form>
    </AuthCard>
  )
}
