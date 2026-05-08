<script setup lang="ts">
import { computed } from 'vue'
import { useAsyncData } from '#imports'
import { useApi } from '~/composables/useApi'
import type { Fixture, Team } from '~/types/api'

const api = useApi()

const { data: fixtures, pending, error, refresh } = useAsyncData<Fixture[]>(
  'fixtures-list',
  () => api.getFixtures()
)

const { data: teams } = useAsyncData<Team[]>('teams-for-fixtures', () => api.getTeams())

const teamMap = computed(() => {
  const map = new Map<number, string>()
  teams.value?.forEach(t => map.set(t.id, t.name ?? `Team #${t.id}`))
  return map
})

function teamName(id: number): string {
  return teamMap.value.get(id) ?? `Team #${id}`
}

const sorted = computed(() => {
  if (!fixtures.value) return []
  return [...fixtures.value].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  )
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function resultLabel(f: Fixture): string {
  if (f.result === 'draw') return 'Unentschieden'
  const winnerName = f.result === 'team_1' ? teamName(f.team1Id) : teamName(f.team2Id)
  return `${winnerName} gewinnt`
}

function resultColor(result: string): 'success' | 'neutral' {
  if (result === 'draw') return 'neutral'
  return 'success'
}
</script>

<template>
  <div class="p-4 lg:p-8 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <UIcon
          name="i-lucide-calendar-days"
          class="w-6 h-6 text-amber-500"
        />
        <h1 class="text-2xl font-bold text-(--ui-text)">
          Spielpläne
        </h1>
      </div>
      <UButton
        to="/fixtures/new"
        icon="i-lucide-plus"
        color="primary"
      >
        Spiel einreichen
      </UButton>
    </div>

    <!-- Loading -->
    <div
      v-if="pending"
      class="space-y-3"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="h-20 rounded-xl bg-(--ui-bg-elevated) animate-pulse"
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
        <UButton
          size="sm"
          variant="soft"
          color="error"
          @click="() => refresh()"
        >
          Erneut versuchen
        </UButton>
      </template>
    </UAlert>

    <!-- Fixture list -->
    <div
      v-else-if="sorted.length"
      class="space-y-3"
    >
      <UCard
        v-for="f in sorted"
        :key="f.id"
        class="hover:bg-(--ui-bg-accented) transition-colors"
      >
        <div class="flex items-center gap-4">
          <!-- Date + Value -->
          <div class="shrink-0 text-center w-16">
            <p class="text-xs text-(--ui-text-dimmed) font-medium">
              {{ formatDate(f.playedAt) }}
            </p>
            <p class="text-xs text-(--ui-text-dimmed) mt-0.5">
              Wert: {{ f.value }}
            </p>
          </div>

          <USeparator
            orientation="vertical"
            class="h-10"
          />

          <!-- Teams -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'font-semibold text-sm truncate',
                  f.result === 'team_1' ? 'text-amber-500' : 'text-(--ui-text)'
                ]"
              >
                {{ teamName(f.team1Id) }}
              </span>
              <span class="text-(--ui-text-dimmed) text-sm shrink-0">vs</span>
              <span
                :class="[
                  'font-semibold text-sm truncate',
                  f.result === 'team_2' ? 'text-amber-500' : 'text-(--ui-text)'
                ]"
              >
                {{ teamName(f.team2Id) }}
              </span>
            </div>

            <!-- Scores -->
            <div
              v-if="f.team1Score !== null && f.team2Score !== null"
              class="flex items-center gap-2 mt-1"
            >
              <span class="text-lg font-bold tabular-nums text-(--ui-text)">{{ f.team1Score }}</span>
              <span class="text-(--ui-text-dimmed) text-sm">:</span>
              <span class="text-lg font-bold tabular-nums text-(--ui-text)">{{ f.team2Score }}</span>
            </div>
          </div>

          <!-- Result badge -->
          <div class="shrink-0">
            <UBadge
              :label="resultLabel(f)"
              :color="resultColor(f.result)"
              variant="soft"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty -->
    <div
      v-else
      class="text-center py-16 text-(--ui-text-muted)"
    >
      <UIcon
        name="i-lucide-calendar-days"
        class="w-10 h-10 mx-auto mb-3 opacity-40"
      />
      <p class="mb-4">
        Noch keine genehmigten Spiele vorhanden.
      </p>
      <UButton
        to="/fixtures/new"
        icon="i-lucide-plus"
        variant="soft"
      >
        Erstes Spiel einreichen
      </UButton>
    </div>
  </div>
</template>
