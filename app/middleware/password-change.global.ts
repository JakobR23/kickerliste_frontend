export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const auth = useAuthStore()

  if (auth.mustChangePassword.value && to.path !== '/change-password') {
    return navigateTo('/change-password')
  }
})
