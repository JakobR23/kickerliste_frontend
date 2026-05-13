import { ref } from 'vue'
import { useApi } from '~/composables/useApi'

// Module-level singleton — one ref shared by every caller.
// Safe for SPA (ssr: false): no per-request isolation needed.
const pendingCount = ref(0)

export function usePendingUsers() {
  const api = useApi()

  async function refreshPendingCount() {
    try {
      const pending = await api.getUsers(false)
      pendingCount.value = pending.length
    } catch {
      // non-critical — badge simply won't show
    }
  }

  return { pendingCount, refreshPendingCount }
}
