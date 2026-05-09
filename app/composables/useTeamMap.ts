import { computed } from 'vue'
import type { Ref } from 'vue'
import type { Team, Fixture } from '~/types/api'

export function useTeamMap(teams: Ref<Team[] | null | undefined>) {
  const teamMap = computed(() => {
    const map = new Map<number, string>()
    teams.value?.forEach(t => map.set(t.id, t.name ?? `Team #${t.id}`))
    return map
  })

  function teamName(id: number): string {
    return teamMap.value.get(id) ?? `Team #${id}`
  }

  function resultLabel(f: Fixture): string {
    if (f.result === 'draw') return 'Unentschieden'
    const winnerName = f.result === 'team_1' ? teamName(f.team1Id) : teamName(f.team2Id)
    return `${winnerName} gewinnt`
  }

  return { teamName, resultLabel }
}
