import type { Team, User } from '~/types/api'

/**
 * Human-friendly name for a team. Falls back to the members' usernames
 * (joined with " & ") for unnamed teams, then to "Team #id".
 */
export function teamDisplayName(team: Pick<Team, 'id' | 'name'>, members?: User[] | null): string {
  if (team.name) return team.name
  if (members && members.length) return members.map(m => m.username).join(' & ')
  return `Team #${team.id}`
}
