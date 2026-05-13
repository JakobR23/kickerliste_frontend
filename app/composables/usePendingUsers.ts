import { useApi } from '~/composables/useApi'

export function usePendingUsers() {
  // useState keeps the same ref across all component instances
  const pendingCount = useState<number>('pending-users-count', () => 0)
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
