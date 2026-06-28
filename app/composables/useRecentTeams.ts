import { ref } from 'vue'

// Session-scoped cache of the most recently picked team ids, newest first.
// Persisted in sessionStorage so it survives navigation but resets when the
// browser session ends. Shared as a module-level singleton.

const STORAGE_KEY = 'recent-team-ids'
const MAX_RECENT = 5

function load(): number[] {
  if (typeof sessionStorage === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === 'number') : []
  } catch {
    return []
  }
}

const recentTeamIds = ref<number[]>(load())

function persist() {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(recentTeamIds.value))
  } catch {
    // ignore quota / private-mode errors
  }
}

export function useRecentTeams() {
  function pushRecentTeam(id: number) {
    recentTeamIds.value = [id, ...recentTeamIds.value.filter(x => x !== id)].slice(0, MAX_RECENT)
    persist()
  }

  return { recentTeamIds, pushRecentTeam }
}
