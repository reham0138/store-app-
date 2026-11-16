import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../shared/hooks/useAuth.ts'
import { AuthError } from '../shared/services/authService.ts'
import { AuthCard } from '../shared/components/AuthCard.tsx'
import { FormError } from '../shared/components/FormError.tsx'
import { PasswordField } from '../shared/components/PasswordField.tsx'
import { SubmitButton } from '../shared/components/SubmitButton.tsx'
import { TextField } from '../shared/components/TextField.tsx'
import { getDashboardPath } from '../shared/utils/dashboardRoute.ts'
import {
  MIN_PASSWORD_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  validateConfirm,
  validateEmail,
  validateName,
  validatePassword,
} from '../shared/utils/authValidation.ts'

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

  if (user) return <Navigate to={getDashboardPath(user.role) ?? '/'} replace />

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
        setFormError(
          error instanceof Error && error.message
            ? error.message
            : 'Something went wrong. Please try again.',
        )
      }
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Create an account"
      subtitle="Enter your details to start shopping and track your orders."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-navy underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {formError && <FormError message={formError} />}
        <TextField
          label="Name"
          maxLength={MAX_NAME_LENGTH}
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setErrors((previous) => ({ ...previous, name: undefined }))
            setFormError('')
          }}
          error={errors.name}
        />
        <TextField
          label="Email address"
          type="email"
          dir="ltr"
          maxLength={MAX_EMAIL_LENGTH}
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setErrors((previous) => ({ ...previous, email: undefined }))
            setFormError('')
          }}
          error={errors.email}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setErrors((previous) => ({
              ...previous,
              password: undefined,
              confirm: undefined,
            }))
            setFormError('')
          }}
          error={errors.password}
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value)
            setErrors((previous) => ({ ...previous, confirm: undefined }))
            setFormError('')
          }}
          error={errors.confirm}
        />
        <SubmitButton loading={submitting}>Create account</SubmitButton>
      </form>
    </AuthCard>
  )
}