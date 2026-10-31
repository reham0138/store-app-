import type { ReactNode } from 'react'

interface SubmitButtonProps {
  loading: boolean
  children: ReactNode
}

export function SubmitButton({ loading, children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-6 font-semibold text-surface-white transition-colors hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
}
