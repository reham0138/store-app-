import { Route } from 'react-router-dom'
import LoginPage from './LoginPage.tsx'
import RegisterPage from './RegisterPage.tsx'

/**
 * مسارات المصادقة (نسبية): حطها داخل <Route path="/" element={<MainLayout />}>
 * بـ App.tsx بسطر واحد:  {authRoutes}
 */
export const authRoutes = (
  <>
    <Route path="login" element={<LoginPage />} />
    <Route path="register" element={<RegisterPage />} />
  </>
)
