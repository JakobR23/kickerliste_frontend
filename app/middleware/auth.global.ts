export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const auth = useAuthStore()
  const publicRoutes = ['/login', '/register']

  if (!auth.isAuthenticated.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
})
