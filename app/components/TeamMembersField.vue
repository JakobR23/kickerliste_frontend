<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { User } from '~/types/api'
import { formatScore } from '~/utils/format'

const props = withDefaults(defineProps<{
  /** current members */
  members: User[]
  /** all users that could be added */
  players: User[]
  /** maximum number of members */
  max?: number
  /** whether the remove buttons are shown */
  canRemove?: boolean
  /** disables the add control while a mutation is in flight */
  busy?: boolean
  /** id of a member currently being mutated (shows a spinner) */
  busyId?: number | null
}>(), {
  max: 2,
  canRemove: true,
  busy: false,
  busyId: null
})

const emit = defineEmits<{
  add: [user: User]
  remove: [userId: number]
}>()

// Players not already on the team.
const available = computed(() => {
  const ids = new Set(props.members.map(m => m.id))
  return props.players.filter(p => !ids.has(p.id))
})

const isFull = computed(() => props.members.length >= props.max)

// Adding a player from the picker emits it and resets the selection.
const addSelection = ref<number | undefined>(undefined)
watch(addSelection, (id) => {
  if (id == null) return
  const user = props.players.find(p => p.id === id)
  if (user) emit('add', user)
  addSelection.value = undefined
})
</script>

<template>
  <div class="space-y-3">
    <!-- Member list -->
    <div
      v-if="members.length"
      class="space-y-2"
    >
      <div
        v-for="member in members"
        :key="member.id"
        class="flex items-center gap-3 px-3 py-2 rounded-lg border border-default bg-elevated"
      >
        <UAvatar
          :alt="member.username"
          size="sm"
          class="ring-1 ring-default shrink-0"
        />
        <div class="flex-1 min-w-0">
          <p class="font-medium text-default truncate">
            {{ member.username }}
          </p>
          <p class="text-xs text-dimmed">
            {{ formatScore(member.totalScore) }} Punkte
          </p>
        </div>
        <UButton
          v-if="canRemove"
          icon="i-lucide-x"
          variant="ghost"
          color="neutral"
          size="xs"
          :loading="busyId === member.id"
          :disabled="busy && busyId !== member.id"
          @click="emit('remove', member.id)"
        />
      </div>
    </div>

    <p
      v-else
      class="text-sm text-muted"
    >
      Noch keine Mitglieder.
    </p>

    <!-- Add control -->
    <PlayerSelect
      v-if="!isFull && available.length"
      v-model="addSelection"
      :players="available"
      :disabled="busy"
      placeholder="Mitglied hinzufügen…"
    />
    <p
      v-else-if="isFull"
      class="text-xs text-dimmed"
    >
      Maximale Anzahl an Mitgliedern erreicht.
    </p>
  </div>
</template>
