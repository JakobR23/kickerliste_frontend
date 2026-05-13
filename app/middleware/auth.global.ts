import { defineNuxtRouteMiddleware, navigateTo } from '#imports'
import { useAuthStore } from '~/composables/useAuthStore'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const auth = useAuthStore()
  const publicRoutes = ['/login', '/register', '/impressum', '/datenschutz', '/register/pending']

  if (to.path === '/login' || to.path === '/register') {
    auth.clear()
  } else if (!auth.isAuthenticated.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
})
