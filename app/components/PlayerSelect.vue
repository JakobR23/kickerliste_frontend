<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/composables/useAuthStore'
import type { User } from '~/types/api'
import type { EntitySelectItem } from '~/types/select'

const props = withDefaults(defineProps<{
  modelValue: number | undefined
  players: User[]
  /** A player id to hide from the list (e.g. the opponent already chosen) */
  exclude?: number
  placeholder?: string
  disabled?: boolean
}>(), {
  exclude: undefined,
  placeholder: 'Spieler suchen…',
  disabled: false
})

const emit = defineEmits<{ 'update:modelValue': [value: number | undefined] }>()

const auth = useAuthStore()

const items = computed<EntitySelectItem[]>(() => {
  const myId = auth.claims.value?.userId
  return props.players.map(p => ({
    value: p.id,
    label: p.username,
    preferred: myId != null && p.id === myId,
    preferredLabel: 'Du'
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
    recent-key="recent-player-ids"
    :exclude="exclude"
    :placeholder="placeholder"
    :disabled="disabled"
    icon="i-lucide-user"
  />
</template>
