import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../shared/hooks/useAuth.ts'
import { AuthError } from '../shared/services/authService.ts'
import { AuthCard } from '../shared/components/AuthCard.tsx'
import { FormError } from '../shared/components/FormError.tsx'
import { PasswordField } from '../shared/components/PasswordField.tsx'
import { SubmitButton } from '../shared/components/SubmitButton.tsx'
import { TextField } from '../shared/components/TextField.tsx'
import { getDashboardPath } from '../shared/utils/dashboardRoute.ts'
import {
	MAX_EMAIL_LENGTH,
	validateEmail,
	validatePassword,
} from '../shared/utils/authValidation.ts'

interface FieldErrors {
	email?: string
	password?: string
}

function getRedirectTarget(state: unknown, role: 'customer' | 'branchManager' | 'admin'): string {
	const from = (state as { from?: unknown } | null)?.from
	const dashboardPath = getDashboardPath(role)
	if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')) {
		if (!from.startsWith('/dashboard')) return from
		if (dashboardPath && from.startsWith(dashboardPath)) return from
	}
	return dashboardPath ?? '/'
}

export default function LoginPage() {
	const { user, login, loginAsRole } = useAuth()
	const location = useLocation()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [errors, setErrors] = useState<FieldErrors>({})
	const [formError, setFormError] = useState('')
	const [submitting, setSubmitting] = useState(false)

	if (user) return <Navigate to={getRedirectTarget(location.state, user.role)} replace />

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setFormError('')

		const nextErrors: FieldErrors = {
			email: validateEmail(email),
			password: password.trim() ? undefined : validatePassword(password),
		}
		setErrors(nextErrors)
		if (nextErrors.email || nextErrors.password) return

		setSubmitting(true)
		try {
			await login({ email, password })
		} catch (error) {
			setFormError(error instanceof AuthError ? error.message : 'Something went wrong. Please try again.')
			setSubmitting(false)
		}
	}

	return (
		<AuthCard
			title="Sign in"
			subtitle="Welcome back. Sign in to continue shopping."
			footer={
				<>
					Don't have an account?{' '}
					<Link to="/register" className="font-semibold text-brand-navy underline">
						Create an account
					</Link>
				</>
			}
		>
			<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
				{formError && <FormError message={formError} />}
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
					autoComplete="current-password"
					value={password}
					onChange={(e) => {
						setPassword(e.target.value)
						setErrors((previous) => ({ ...previous, password: undefined }))
						setFormError('')
					}}
					error={errors.password}
				/>
				<SubmitButton loading={submitting}>Sign in</SubmitButton>
			</form>
			{import.meta.env.DEV && (
				<div className="mt-6 border-t border-border-subtle pt-5">
					<p className="mb-3 text-sm font-semibold text-brand-navy">Development access</p>
					<div className="grid gap-2 sm:grid-cols-2">
						<button
							type="button"
							onClick={() => loginAsRole('admin')}
							className="rounded-lg border border-border-subtle px-3 py-2 text-sm font-medium text-brand-navy hover:bg-surface-cream"
						>
							Continue as admin
						</button>
						<button
							type="button"
							onClick={() => loginAsRole('branchManager')}
							className="rounded-lg border border-border-subtle px-3 py-2 text-sm font-medium text-brand-navy hover:bg-surface-cream"
						>
							Continue as branch manager
						</button>
					</div>
					<p className="mt-2 text-xs text-text-slate">
						Development-only mock sessions. These controls are disabled in production.
					</p>
				</div>
			)}
		</AuthCard>
	)
}
