import type { LoginInput, RegisterInput, User } from '../types/auth.ts'
import { apiClient, getAuthToken, setAuthToken, USE_MOCK } from '../api/index.ts'
import { normalizeError } from '../api/errors.ts'

/*
 * Auth service — single entry point for pages.
 * Mock mode (VITE_USE_MOCK != "false"): users live in localStorage with seeded dev accounts.
 * API mode: talks to /api/auth with JWT.
 */

const USERS_KEY = 'crown-anchor:mock-users'
const SESSION_KEY = 'crown-anchor:session'
const FAKE_DELAY_MS = 250

interface StoredUser extends User {
  password: string
}

export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'EMAIL_TAKEN'

export class AuthError extends Error {
  code: AuthErrorCode

  constructor(code: AuthErrorCode, message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

// ---------- Mock implementation (localStorage) ----------

const SEED_USERS: StoredUser[] = [
  {
    id: 'mock-admin',
    name: 'Admin Demo',
    email: 'admin@crown-anchor.dev',
    password: 'admin12345',
    role: 'admin',
  },
  {
    id: 'mock-manager',
    name: 'Manager Demo',
    email: 'manager@crown-anchor.dev',
    password: 'manager12345',
    role: 'branchManager',
    branchId: 'damascus',
  },
  {
    id: 'mock-customer',
    name: 'Customer Demo',
    email: 'customer@crown-anchor.dev',
    password: 'customer12345',
    role: 'customer',
  },
]

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (raw === null) {
      localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS))
      return SEED_USERS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function toPublicUser(stored: StoredUser): User {
  return {
    id: stored.id,
    name: stored.name,
    email: stored.email,
    role: stored.role,
    ...(stored.branchId ? { branchId: stored.branchId } : {}),
  }
}

async function mockLogin({ email, password }: LoginInput): Promise<User> {
  await wait(FAKE_DELAY_MS)
  const found = readUsers().find(
    (u) => u.email === normalizeEmail(email) && u.password === password,
  )
  if (!found) {
    throw new AuthError('INVALID_CREDENTIALS', 'The email or password is incorrect.')
  }
  localStorage.setItem(SESSION_KEY, found.id)
  return toPublicUser(found)
}

async function mockRegister({ name, email, password }: RegisterInput): Promise<User> {
  await wait(FAKE_DELAY_MS)
  if (password.length < 8 || password.length > 72) {
    throw new Error('Password must be between 8 and 72 characters.')
  }
  const users = readUsers()
  const normalized = normalizeEmail(email)
  if (users.some((u) => u.email === normalized)) {
    throw new AuthError('EMAIL_TAKEN', 'An account with this email already exists.')
  }
  const created: StoredUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalized,
    role: 'customer',
    password,
  }
  writeUsers([...users, created])
  localStorage.setItem(SESSION_KEY, created.id)
  return toPublicUser(created)
}

function mockLogout(): void {
  localStorage.removeItem(SESSION_KEY)
}

function mockGetCurrentUser(): User | null {
  try {
    const id = localStorage.getItem(SESSION_KEY)
    if (!id) return null
    const found = readUsers().find((u) => u.id === id)
    return found ? toPublicUser(found) : null
  } catch {
    return null
  }
}

// ---------- API implementation (JWT) ----------

interface ApiAuthResponse {
  id: string
  name: string
  email: string
  role: User['role']
  branchId?: string
  token: string
}

function toUser(data: ApiAuthResponse | User): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    ...(data.branchId ? { branchId: data.branchId } : {}),
  }
}

async function apiLogin(input: LoginInput): Promise<User> {
  try {
    const { data } = await apiClient.post<ApiAuthResponse>('/auth/login', {
      email: normalizeEmail(input.email),
      password: input.password,
    })
    setAuthToken(data.token)
    return toUser(data)
  } catch (error) {
    const normalized = normalizeError(error, 'Login failed.')
    if (normalized.code === 'INVALID_CREDENTIALS' || normalized.status === 401) {
      throw new AuthError('INVALID_CREDENTIALS', 'The email or password is incorrect.')
    }
    throw new AuthError('INVALID_CREDENTIALS', normalized.message)
  }
}

async function apiRegister(input: RegisterInput): Promise<User> {
  try {
    const { data } = await apiClient.post<ApiAuthResponse>('/auth/register', {
      name: input.name.trim(),
      email: normalizeEmail(input.email),
      password: input.password,
    })
    setAuthToken(data.token)
    return toUser(data)
  } catch (error) {
    const normalized = normalizeError(error, 'Registration failed.')
    if (normalized.code === 'EMAIL_TAKEN' || normalized.status === 409) {
      throw new AuthError('EMAIL_TAKEN', 'An account with this email already exists.')
    }
    throw new Error(normalized.message, { cause: error })
  }
}

function apiLogout(): void {
  setAuthToken(null)
}

// ---------- Public API ----------

let cachedUser: User | null | undefined

async function login(input: LoginInput): Promise<User> {
  const user = USE_MOCK ? await mockLogin(input) : await apiLogin(input)
  cachedUser = user
  return user
}

async function register(input: RegisterInput): Promise<User> {
  const user = USE_MOCK ? await mockRegister(input) : await apiRegister(input)
  cachedUser = user
  return user
}

function logout(): void {
  cachedUser = null
  if (USE_MOCK) mockLogout()
  else apiLogout()
}

/** Sync read of the last known user (for initial render). */
function getCurrentUser(): User | null {
  if (cachedUser !== undefined) return cachedUser
  cachedUser = USE_MOCK ? mockGetCurrentUser() : null
  return cachedUser
}

/** Async session restore — call once on app start. */
async function refreshSession(): Promise<User | null> {
  if (USE_MOCK) {
    cachedUser = mockGetCurrentUser()
    return cachedUser
  }
  if (!getAuthToken()) {
    cachedUser = null
    return null
  }
  try {
    const { data } = await apiClient.get<User>('/auth/me')
    cachedUser = toUser(data)
    return cachedUser
  } catch {
    cachedUser = null
    setAuthToken(null)
    return null
  }
}

export const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  refreshSession,
}
