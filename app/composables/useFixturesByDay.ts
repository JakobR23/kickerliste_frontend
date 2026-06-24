import { computed } from 'vue'
import type { Ref } from 'vue'
import type { Fixture } from '~/types/api'

export interface FixtureDay {
  /** Stable YYYY-MM-DD key for v-for keying */
  key: string
  /** ISO timestamp of a fixture on this day, for date display */
  date: string
  /** Fixtures played on this day, newest first */
  fixtures: Fixture[]
}

function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Group a list of fixtures by the calendar day they were played on.
 * Both the day groups and the fixtures within each group are sorted
 * newest first.
 */
export function useFixturesByDay(fixtures: Ref<Fixture[] | null | undefined>) {
  const days = computed<FixtureDay[]>(() => {
    const groups = new Map<string, Fixture[]>()
    for (const f of fixtures.value ?? []) {
      const key = dayKey(f.playedAt)
      const arr = groups.get(key) ?? []
      arr.push(f)
      groups.set(key, arr)
    }

    return [...groups.entries()]
      .map(([key, group]) => ({
        key,
        date: group[0]!.playedAt,
        fixtures: [...group].sort(
          (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
        )
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  return { days }
}
