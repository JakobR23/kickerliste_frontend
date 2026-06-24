<script setup lang="ts">
import { ref } from 'vue'
import { formatDate } from '~/utils/format'

const props = withDefaults(defineProps<{
  /** ISO timestamp of the day this group represents */
  date: string
  /** Number of fixtures in this group */
  count: number
  /** Whether the group starts expanded */
  defaultOpen?: boolean
}>(), {
  defaultOpen: true
})

const open = ref(props.defaultOpen)
</script>

<template>
  <div class="rounded-xl border border-default overflow-hidden">
    <!-- Day header -->
    <button
      class="flex items-center gap-3 w-full px-4 py-3 bg-elevated hover:bg-accented transition-colors text-left"
      :aria-expanded="open"
      @click="open = !open"
    >
      <UIcon
        :name="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
        class="w-4 h-4 text-dimmed shrink-0"
      />
      <UIcon
        name="i-lucide-calendar-days"
        class="w-4 h-4 text-amber-500 shrink-0"
      />
      <span class="font-semibold text-sm text-default">
        {{ formatDate(date) }}
      </span>
      <UBadge
        :label="`${count} ${count === 1 ? 'Spiel' : 'Spiele'}`"
        color="neutral"
        variant="soft"
        size="xs"
        class="ml-auto shrink-0"
      />
    </button>

    <!-- Fixture cards -->
    <div
      v-if="open"
      class="p-3 space-y-3"
    >
      <slot />
    </div>
  </div>
</template>
