import { computed } from 'vue'
import { useAsyncData } from '#imports'
import { useApi } from '~/composables/useApi'
import type { User } from '~/types/api'

export interface TeamWithMembers {
  id: number
  name: string | null
  members: User[]
}

/**
 * Fetch all teams together with their members. Used by the team picker so
 * teams can be searched by player name and unnamed teams can show their
 * members. Members are loaded with a per-team fan-out.
 */
export function useTeamsWithMembers(key = 'teams-with-members') {
  const api = useApi()

  const { data, pending, error, refresh } = useAsyncData<TeamWithMembers[]>(key, async () => {
    const teams = await api.getTeams()
    return Promise.all(
      teams.map(async (t): Promise<TeamWithMembers> => ({
        id: t.id,
        name: t.name,
        members: (await api.getTeamMembers(t.id)) ?? []
      }))
    )
  })

  const teams = computed(() => data.value ?? [])

  return { teams, pending, error, refresh }
}
