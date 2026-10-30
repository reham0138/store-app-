import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { TextField } from './TextField.tsx'
import type { TextFieldProps } from './TextField.tsx'

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'endAdornment'>

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye

  return (
    <TextField
      {...props}
      dir="ltr"
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          aria-pressed={visible}
          className="inline-flex size-9 items-center justify-center rounded-lg text-text-slate hover:text-brand-navy"
        >
          <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      }
    />
  )
}
