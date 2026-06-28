<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/composables/useAuthStore'
import type { Team } from '~/types/api'
import type { EntitySelectItem } from '~/types/select'
import { teamDisplayName } from '~/utils/team'

const props = withDefaults(defineProps<{
  modelValue: number | undefined
  teams: Team[]
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

const items = computed<EntitySelectItem[]>(() => {
  const myId = auth.claims.value?.userId
  return props.teams.map(t => ({
    value: t.id,
    label: teamDisplayName(t, t.members),
    // include member usernames so search matches players too
    search: t.members.map(m => m.username).join(' '),
    preferred: myId != null && t.members.some(m => m.id === myId),
    preferredLabel: 'Dein Team'
  }))
})

const model = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => emit('update:modelValue', value)
})
</script>

<template>
  <EntitySelect
    v-model="model"
    :items="items"
    recent-key="recent-team-ids"
    :exclude="exclude"
    :placeholder="placeholder"
    :disabled="disabled"
    icon="i-lucide-users"
  />
</template>
