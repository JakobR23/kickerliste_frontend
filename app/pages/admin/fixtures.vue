<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAsyncData, useToast, navigateTo } from '#imports'
import { useAuthStore } from '~/composables/useAuthStore'
import { useApi } from '~/composables/useApi'
import { useTeamMap } from '~/composables/useTeamMap'
import { useFixturesByDay } from '~/composables/useFixturesByDay'
import type { Fixture, FixtureStatus, Team } from '~/types/api'
import { formatTime } from '~/utils/format'

const auth = useAuthStore()
const api = useApi()
const toast = useToast()

// Guard: admin only
onMounted(() => {
  if (!auth.isAdmin.value) navigateTo('/')
})

const { data: teams } = useAsyncData<Team[]>('teams-admin-fixtures', () => api.getTeams())
const { teamName, resultLabel } = useTeamMap(teams)

const { data: fixtures, pending: loading, refresh } = useAsyncData<Fixture[]>(
  'admin-fixtures',
  () => api.getFixtures()
)

// --- Status filter ---
type StatusFilter = FixtureStatus | 'all'

const filterOptions = [
  { value: 'pending', label: 'Ausstehend' },
  { value: 'approved', label: 'Genehmigt' },
  { value: 'rejected', label: 'Abgelehnt' },
  { value: 'all', label: 'Alle' }
] as const

const statusFilter = ref<StatusFilter>('pending')

const counts = computed(() => {
  const all = fixtures.value ?? []
  return {
    pending: all.filter(f => f.status === 'pending').length,
    approved: all.filter(f => f.status === 'approved').length,
    rejected: all.filter(f => f.status === 'rejected').length,
    all: all.length
  }
})

const filtered = computed(() => {
  const all = fixtures.value ?? []
  return statusFilter.value === 'all'
    ? all
    : all.filter(f => f.status === statusFilter.value)
})

const { days } = useFixturesByDay(filtered)

function statusLabel(s: FixtureStatus): string {
  return s === 'approved' ? 'Genehmigt' : s === 'rejected' ? 'Abgelehnt' : 'Ausstehend'
}

function statusColor(s: FixtureStatus): 'success' | 'error' | 'warning' {
  return s === 'approved' ? 'success' : s === 'rejected' ? 'error' : 'warning'
}

const emptyText = computed(() =>
  statusFilter.value === 'all'
    ? 'Keine Spiele vorhanden.'
    : `Keine Spiele mit Status „${statusLabel(statusFilter.value)}“.`
)

// --- Actions ---
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
          Spiele
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

    <!-- Status filter -->
    <div class="flex gap-1 p-1 bg-elevated rounded-lg border border-default mb-4">
      <button
        v-for="opt in filterOptions"
        :key="opt.value"
        :class="[
          'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-sm font-medium transition-colors',
          statusFilter === opt.value ? 'bg-default text-default shadow-sm' : 'text-muted hover:text-default'
        ]"
        @click="statusFilter = opt.value"
      >
        <span class="truncate">{{ opt.label }}</span>
        <UBadge
          :label="String(counts[opt.value])"
          :color="statusFilter === opt.value ? 'primary' : 'neutral'"
          variant="soft"
          size="xs"
        />
      </button>
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

    <!-- Fixture list grouped by day -->
    <div
      v-else-if="days.length"
      class="space-y-3"
    >
      <FixtureDayGroup
        v-for="day in days"
        :key="day.key"
        :date="day.date"
        :count="day.fixtures.length"
      >
        <UCard
          v-for="f in day.fixtures"
          :key="f.id"
        >
          <div class="flex items-start gap-4">
            <!-- Time + ID -->
            <div class="shrink-0 text-center w-16">
              <p class="text-xs text-dimmed font-medium leading-snug">
                {{ formatTime(f.playedAt) }}
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
                {{ resultLabel(f) }} · Wert: {{ f.value }}
                <span v-if="f.team1Score !== null && f.team2Score !== null">
                  · {{ f.team1Score }}:{{ f.team2Score }}
                </span>
              </p>
            </div>

            <!-- Actions / status -->
            <div class="flex items-center gap-2 shrink-0">
              <template v-if="f.status === 'pending'">
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
              </template>
              <UBadge
                v-else
                :label="statusLabel(f.status)"
                :color="statusColor(f.status)"
                variant="soft"
              />
            </div>
          </div>
        </UCard>
      </FixtureDayGroup>
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
      <p>{{ emptyText }}</p>
    </div>
  </div>
</template>
