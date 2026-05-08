<script setup lang="ts">
import type { User } from '~/types/api'

const api = useApi()

const { data: users, pending, error, refresh } = useAsyncData<User[]>(
  'users-leaderboard',
  () => api.getUsers()
)

const sorted = computed(() => {
  if (!users.value) return []
  return [...users.value].sort((a, b) => b.totalScore - a.totalScore)
})

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

const medalColors = ['text-amber-400', 'text-zinc-400', 'text-amber-700']
const medalIcons = ['i-lucide-medal', 'i-lucide-medal', 'i-lucide-medal']
</script>

<template>
  <div class="p-4 lg:p-8 max-w-3xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <UIcon name="i-lucide-trophy" class="w-6 h-6 text-amber-500" />
      <h1 class="text-2xl font-bold text-(--ui-text)">
        Rangliste
      </h1>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-3">
      <div
        v-for="i in 5"
        :key="i"
        class="h-16 rounded-xl bg-(--ui-bg-elevated) animate-pulse"
      />
    </div>

    <!-- Error -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      title="Fehler beim Laden"
      :description="error.message"
      icon="i-lucide-circle-alert"
    >
      <template #footer>
        <UButton size="sm" variant="soft" color="error" @click="() => refresh()">
          Erneut versuchen
        </UButton>
      </template>
    </UAlert>

    <!-- Leaderboard -->
    <div v-else-if="sorted.length" class="space-y-2">
      <div
        v-for="(user, index) in sorted"
        :key="user.id"
        :class="[
          'flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors',
          index === 0
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-(--ui-bg-elevated) border-(--ui-border) hover:bg-(--ui-bg-accented)'
        ]"
      >
        <!-- Rank -->
        <div class="w-8 flex-shrink-0 flex justify-center">
          <UIcon
            v-if="index < 3"
            :name="medalIcons[index]"
            :class="['w-5 h-5', medalColors[index]]"
          />
          <span v-else class="text-sm font-semibold text-(--ui-text-dimmed)">
            {{ index + 1 }}
          </span>
        </div>

        <!-- Avatar + Name -->
        <UAvatar
          :alt="user.username"
          size="sm"
          class="flex-shrink-0 ring-1 ring-(--ui-border)"
        />
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-(--ui-text) truncate">
            {{ user.username }}
          </p>
          <p class="text-xs text-(--ui-text-muted)">
            <UBadge
              v-if="user.role === 'admin'"
              label="Admin"
              color="primary"
              variant="soft"
              size="xs"
            />
          </p>
        </div>

        <!-- Score -->
        <div class="text-right flex-shrink-0">
          <p
            :class="[
              'text-xl font-bold tabular-nums',
              index === 0 ? 'text-amber-500' : 'text-(--ui-text)'
            ]"
          >
            {{ formatScore(user.totalScore) }}
          </p>
          <p class="text-xs text-(--ui-text-dimmed)">
            Punkte
          </p>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="text-center py-16 text-(--ui-text-muted)">
      <UIcon name="i-lucide-users" class="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p>
        Noch keine Spieler vorhanden.
      </p>
    </div>
  </div>
</template>
