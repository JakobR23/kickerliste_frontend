<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAsyncData, useToast, navigateTo } from '#imports'
import { useAuthStore } from '~/composables/useAuthStore'
import { useApi } from '~/composables/useApi'
import type { Fixture, Team } from '~/types/api'

const auth = useAuthStore()
const api = useApi()
const toast = useToast()

// Guard: admin only
onMounted(() => {
  if (!auth.isAdmin.value) navigateTo('/')
})

const { data: teams } = useAsyncData<Team[]>('teams-admin-fixtures', () => api.getTeams())

const teamMap = computed(() => {
  const map = new Map<number, string>()
  teams.value?.forEach(t => map.set(t.id, t.name ?? `Team #${t.id}`))
  return map
})

function teamName(id: number): string {
  return teamMap.value.get(id) ?? `Team #${id}`
}

const { data: pendingFixtures, pending: loading, refresh } = useAsyncData<Fixture[]>(
  'admin-pending-fixtures',
  () => api.getFixtures(undefined, 'pending')
)

const sorted = computed(() =>
  [...(pendingFixtures.value ?? [])].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  )
)

const actionLoading = ref<number | null>(null)

async function approve(id: number) {
  actionLoading.value = id
  try {
    await api.approveFixture(id)
    await refresh()
    toast.add({ title: 'Spiel genehmigt', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { status?: number, data?: { message?: string } }
    toast.add({
      title: 'Fehler',
      description: err.status === 500
        ? 'Serverfehler. Bitte erneut versuchen.'
        : err.status === 409
          ? 'Das Spiel wurde bereits überprüft.'
          : (err.data?.message ?? 'Genehmigung fehlgeschlagen.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    actionLoading.value = null
  }
}

async function reject(id: number) {
  actionLoading.value = id
  try {
    await api.rejectFixture(id)
    await refresh()
    toast.add({ title: 'Spiel abgelehnt', color: 'neutral', icon: 'i-lucide-x-circle' })
  } catch (e: unknown) {
    const err = e as { status?: number, data?: { message?: string } }
    toast.add({
      title: 'Fehler',
      description: err.status === 500
        ? 'Serverfehler. Bitte erneut versuchen.'
        : err.status === 409
          ? 'Das Spiel wurde bereits überprüft.'
          : (err.data?.message ?? 'Ablehnung fehlgeschlagen.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    actionLoading.value = null
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const resultLabels: Record<string, string> = {
  team_1: 'Team 1 gewinnt',
  team_2: 'Team 2 gewinnt',
  draw: 'Unentschieden'
}
</script>

<template>
  <div class="p-4 lg:p-8 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <UIcon
          name="i-lucide-clipboard-check"
          class="w-6 h-6 text-amber-500"
        />
        <h1 class="text-2xl font-bold text-default">
          Ausstehende Spiele
        </h1>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="ghost"
        color="neutral"
        :loading="loading"
        @click="() => refresh()"
      />
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="space-y-3"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="h-24 rounded-xl bg-elevated animate-pulse"
      />
    </div>

    <!-- Pending list -->
    <div
      v-else-if="sorted.length"
      class="space-y-3"
    >
      <UCard
        v-for="f in sorted"
        :key="f.id"
      >
        <div class="flex items-start gap-4">
          <!-- Date + ID -->
          <div class="shrink-0 text-center w-16">
            <p class="text-xs text-dimmed font-medium leading-snug">
              {{ formatDate(f.playedAt) }}
            </p>
            <p class="text-xs text-dimmed mt-1">
              #{{ f.id }}
            </p>
          </div>

          <USeparator
            orientation="vertical"
            class="h-12"
          />

          <!-- Teams + result -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-sm text-default truncate">
                {{ teamName(f.team1Id) }}
              </span>
              <span class="text-dimmed text-sm shrink-0">vs</span>
              <span class="font-semibold text-sm text-default truncate">
                {{ teamName(f.team2Id) }}
              </span>
            </div>
            <p class="text-xs text-dimmed mt-1">
              {{ resultLabels[f.result] }} · Wert: {{ f.value }}
              <span v-if="f.team1Score !== null && f.team2Score !== null">
                · {{ f.team1Score }}:{{ f.team2Score }}
              </span>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 shrink-0">
            <UButton
              color="error"
              variant="soft"
              icon="i-lucide-x"
              size="sm"
              :loading="actionLoading === f.id"
              :disabled="actionLoading !== null"
              @click="reject(f.id)"
            >
              Ablehnen
            </UButton>
            <UButton
              color="success"
              icon="i-lucide-check"
              size="sm"
              :loading="actionLoading === f.id"
              :disabled="actionLoading !== null"
              @click="approve(f.id)"
            >
              Genehmigen
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty -->
    <div
      v-else
      class="text-center py-16 text-muted"
    >
      <UIcon
        name="i-lucide-clipboard-check"
        class="w-10 h-10 mx-auto mb-3 opacity-40"
      />
      <p>Keine ausstehenden Spiele.</p>
    </div>
  </div>
</template>
