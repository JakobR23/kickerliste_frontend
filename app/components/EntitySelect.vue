<script setup lang="ts">
import { computed } from 'vue'
import { useRecentIds } from '~/composables/useRecentIds'
import type { EntitySelectItem } from '~/types/select'

const props = withDefaults(defineProps<{
  modelValue: number | undefined
  items: EntitySelectItem[]
  /** sessionStorage key for the "recently picked" cache */
  recentKey: string
  /** an id to hide from the list (e.g. the other side already chosen) */
  exclude?: number
  placeholder?: string
  disabled?: boolean
  icon?: string
}>(), {
  exclude: undefined,
  placeholder: 'Suchen…',
  disabled: false,
  icon: undefined
})

const emit = defineEmits<{ 'update:modelValue': [value: number | undefined] }>()

const { recentIds, pushRecent } = useRecentIds(props.recentKey)

interface DisplayItem extends EntitySelectItem {
  search: string
  recent: boolean
}

const displayItems = computed<DisplayItem[]>(() => {
  const recentRank = (id: number) => {
    const i = recentIds.value.indexOf(id)
    return i === -1 ? Number.POSITIVE_INFINITY : i
  }

  return props.items
    .filter(it => it.value !== props.exclude)
    .map<DisplayItem>(it => ({
      ...it,
      search: it.search ?? '',
      recent: recentIds.value.includes(it.value)
    }))
    .sort((a, b) => {
      // recently used first (by recency), then preferred, then alphabetical
      const ra = recentRank(a.value)
      const rb = recentRank(b.value)
      if (ra !== rb) return ra - rb
      if (!!a.preferred !== !!b.preferred) return a.preferred ? -1 : 1
      return a.label.localeCompare(b.label, 'de')
    })
})

const selected = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value)
    if (typeof value === 'number') pushRecent(value)
  }
})
</script>

<template>
  <USelectMenu
    v-model="selected"
    :items="displayItems"
    value-key="value"
    :filter-fields="['label', 'search']"
    :placeholder="placeholder"
    :disabled="disabled"
    :icon="icon"
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
          v-else-if="item.preferred"
          :label="item.preferredLabel ?? ''"
          color="primary"
          variant="soft"
          size="xs"
          class="ml-auto shrink-0"
        />
      </div>
    </template>
  </USelectMenu>
</template>
