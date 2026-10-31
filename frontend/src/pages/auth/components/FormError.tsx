interface FormErrorProps {
  message: string
}

export function FormError({ message }: FormErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error"
    >
      {message}
    </div>
  )
}
