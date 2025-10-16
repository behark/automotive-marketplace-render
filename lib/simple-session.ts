// Simple session management without complex contexts
export interface User {
  id: string
  email: string
  name: string
  role: string
}

// Check if user is logged in by testing the auth cookie
export async function checkAuthStatus(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    })

    if (response.ok) {
      const data = await response.json()
      return data.user
    }
    return null
  } catch {
    return null
  }
}

// Simple client-side auth check
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false

  // Simple check for auth status in localStorage
  const authStatus = localStorage.getItem('auth-status')
  return authStatus === 'logged-in'
}

// Set logged in status
export function setLoggedIn(user: User) {
  if (typeof window === 'undefined') return

  localStorage.setItem('auth-status', 'logged-in')
  localStorage.setItem('user-data', JSON.stringify(user))
}

// Clear logged in status
export function clearAuth() {
  if (typeof window === 'undefined') return

  localStorage.removeItem('auth-status')
  localStorage.removeItem('user-data')
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null

  const userData = localStorage.getItem('user-data')
  if (!userData) return null

  try {
    return JSON.parse(userData)
  } catch {
    return null
  }
}