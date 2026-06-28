<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/composables/useAuthStore'
import { useRecentTeams } from '~/composables/useRecentTeams'
import type { TeamWithMembers } from '~/composables/useTeamsWithMembers'
import { teamDisplayName } from '~/utils/team'

const props = withDefaults(defineProps<{
  modelValue: number | undefined
  teams: TeamWithMembers[]
  /** A team id to hide from the list (e.g. the opponent already chosen) */
  exclude?: number
  placeholder?: string
  disabled?: boolean
}>(), {
  exclude: undefined,
  placeholder: 'Team suchen…',
  disabled: false
})

const emit = defineEmits<{ 'update:modelValue': [value: number | undefined] }>()

const auth = useAuthStore()
const { recentTeamIds, pushRecentTeam } = useRecentTeams()

interface TeamItem {
  value: number
  label: string
  /** space-joined member usernames, included so search matches players too */
  players: string
  recent: boolean
  mine: boolean
}

const items = computed<TeamItem[]>(() => {
  const myId = auth.claims.value?.userId
  const recentRank = (id: number) => {
    const i = recentTeamIds.value.indexOf(id)
    return i === -1 ? Number.POSITIVE_INFINITY : i
  }

  return props.teams
    .filter(t => t.id !== props.exclude)
    .map<TeamItem>(t => ({
      value: t.id,
      label: teamDisplayName(t, t.members),
      players: t.members.map(m => m.username).join(' '),
      recent: recentTeamIds.value.includes(t.id),
      mine: myId != null && t.members.some(m => m.id === myId)
    }))
    .sort((a, b) => {
      // recently used first (by recency), then own teams, then alphabetical
      const ra = recentRank(a.value)
      const rb = recentRank(b.value)
      if (ra !== rb) return ra - rb
      if (a.mine !== b.mine) return a.mine ? -1 : 1
      return a.label.localeCompare(b.label, 'de')
    })
})

const selected = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value)
    if (typeof value === 'number') pushRecentTeam(value)
  }
})
</script>

<template>
  <USelectMenu
    v-model="selected"
    :items="items"
    value-key="value"
    :filter-fields="['label', 'players']"
    :placeholder="placeholder"
    :disabled="disabled"
    icon="i-lucide-users"
    class="w-full"
  >
    <template #item="{ item }">
      <div class="flex items-center gap-2 w-full">
        <UAvatar
          :alt="item.label"
          size="2xs"
          class="ring-1 ring-default shrink-0"
        />
        <span class="truncate">{{ item.label }}</span>
        <UBadge
          v-if="item.recent"
          label="Zuletzt"
          color="neutral"
          variant="soft"
          size="xs"
          class="ml-auto shrink-0"
        />
        <UBadge
          v-else-if="item.mine"
          label="Dein Team"
          color="primary"
          variant="soft"
          size="xs"
          class="ml-auto shrink-0"
        />
      </div>
    </template>
  </USelectMenu>
</template>
