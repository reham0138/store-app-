import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  endAdornment?: ReactNode
}

export function TextField({
  label,
  error,
  endAdornment,
  className = '',
  ...rest
}: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-text-main">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          // حدود الحقل text-slate (تباين كافي)، و border-subtle فقط للبطاقات والفواصل
          className={[
            'h-11 w-full rounded-lg border bg-surface-white px-3 text-text-main',
            'placeholder:text-text-slate focus:border-brand-navy',
            error ? 'border-status-error' : 'border-text-slate',
            endAdornment ? 'pe-11' : '',
            className,
          ].join(' ')}
          {...rest}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 end-1 flex items-center">{endAdornment}</div>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-status-error">
          {error}
        </p>
      )}
    </div>
  )
}
