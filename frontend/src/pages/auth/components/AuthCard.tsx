import type { ReactNode } from 'react'

interface AuthCardProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    // dir="rtl" محلي لحد ما الفريق يحدد اتجاه الصفحة globally (احذفو وقتها)
    <div dir="rtl" className="mx-auto flex w-full max-w-md flex-col px-4 py-10">
      <div className="rounded-xl border border-border-subtle bg-surface-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-brand-navy">{title}</h1>
        <p className="mt-1 text-sm text-text-slate">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
      <p className="mt-4 text-center text-sm text-text-main">{footer}</p>
    </div>
  )
}
