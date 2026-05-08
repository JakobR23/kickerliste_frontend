import type { JwtClaims } from '~/types/api'

function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as JwtClaims
  } catch {
    return null
  }
}

export const useAuthStore = () => {
  const token = useState<string | null>('auth:token', () => {
    if (import.meta.client) {
      return localStorage.getItem('auth:token')
    }
    return null
  })

  const claims = computed(() => token.value ? decodeJwt(token.value) : null)
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => claims.value?.role === 'admin')
  const mustChangePassword = computed(() => claims.value?.forcePasswordChange === true)

  function setToken(newToken: string) {
    token.value = newToken
    if (import.meta.client) {
      localStorage.setItem('auth:token', newToken)
    }
  }

  function clear() {
    token.value = null
    if (import.meta.client) {
      localStorage.removeItem('auth:token')
    }
  }

  return { token, claims, isAuthenticated, isAdmin, mustChangePassword, setToken, clear }
}
