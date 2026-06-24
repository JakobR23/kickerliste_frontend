import { computed } from 'vue'
import type { Ref } from 'vue'
import type { Team, Fixture } from '~/types/api'

export function useTeamMap(teams: Ref<Team[] | null | undefined>) {
  // Maps team id → its configured name, or null when the team is unnamed.
  const nameMap = computed(() => {
    const map = new Map<number, string | null>()
    teams.value?.forEach(t => map.set(t.id, t.name ?? null))
    return map
  })

  const teamOptions = computed(() =>
    (teams.value ?? []).map(t => ({
      label: t.name ?? `Team #${t.id}`,
      value: t.id
    }))
  )

  function teamName(id: number): string {
    return nameMap.value.get(id) ?? `Team #${id}`
  }

  // The configured name, or null when unnamed/unknown — lets callers pick
  // their own fallback (e.g. "Team 1" rather than "Team #5").
  function teamNameOrNull(id: number): string | null {
    return nameMap.value.get(id) ?? null
  }

  function resultLabel(f: Fixture): string {
    if (f.result === 'draw') return 'Unentschieden'
    const winnerName = f.result === 'team_1' ? teamName(f.team1Id) : teamName(f.team2Id)
    return `${winnerName} gewinnt`
  }

  return { teamName, teamNameOrNull, teamOptions, resultLabel }
}
