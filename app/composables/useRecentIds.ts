import { ref } from 'vue'
import type { Ref } from 'vue'

// Session-scoped cache of recently picked ids, newest first, keyed by an
// arbitrary storage key so it can back multiple pickers (teams, players, …).
// Each key gets a shared singleton ref, persisted in sessionStorage.

const DEFAULT_MAX = 5
const caches = new Map<string, Ref<number[]>>()

function load(key: string): number[] {
  if (typeof sessionStorage === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === 'number') : []
  } catch {
    return []
  }
}

export function useRecentIds(key: string, max = DEFAULT_MAX) {
  let recentIds = caches.get(key)
  if (!recentIds) {
    recentIds = ref<number[]>(load(key))
    caches.set(key, recentIds)
  }
  const ids = recentIds

  function persist() {
    if (typeof sessionStorage === 'undefined') return
    try {
      sessionStorage.setItem(key, JSON.stringify(ids.value))
    } catch {
      // ignore quota / private-mode errors
    }
  }

  function pushRecent(id: number) {
    ids.value = [id, ...ids.value.filter(x => x !== id)].slice(0, max)
    persist()
  }

  return { recentIds: ids, pushRecent }
}
