<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useAsyncData, useToast, navigateTo } from '#imports'
import { useAuthStore } from '~/composables/useAuthStore'
import { useApi } from '~/composables/useApi'
import { useTeamMap } from '~/composables/useTeamMap'
import { useFixturesByDay } from '~/composables/useFixturesByDay'
import type { Fixture, FixtureStatus, MatchResult, Team } from '~/types/api'
import { formatTime } from '~/utils/format'

const auth = useAuthStore()
const api = useApi()
const toast = useToast()

// Guard: admin only
onMounted(() => {
  if (!auth.isAdmin.value) navigateTo('/')
})

const { data: teams } = useAsyncData<Team[]>('teams-admin-fixtures', () => api.getTeams())
const { teamName, teamNameOrNull, resultLabel } = useTeamMap(teams)

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

// --- Edit ---
const editOpen = ref(false)
const editTarget = ref<Fixture | null>(null)
const editState = reactive({
  result: 'team_1' as MatchResult,
  team1Score: null as number | null,
  team2Score: null as number | null,
  value: 1
})
const editError = ref('')
const editLoading = ref(false)

function hasScore(v: number | null): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

const editScoresComplete = computed(() =>
  hasScore(editState.team1Score) && hasScore(editState.team2Score)
)

// Show the actual team names in the result options, falling back to
// the positional "Team 1"/"Team 2" when a team is unnamed.
function sideLabel(id: number | undefined, fallback: string): string {
  return (id ? teamNameOrNull(id) : null) ?? fallback
}

const resultOptions = computed(() => {
  const t = editTarget.value
  return [
    { label: `${sideLabel(t?.team1Id, 'Team 1')} gewinnt`, value: 'team_1' },
    { label: `${sideLabel(t?.team2Id, 'Team 2')} gewinnt`, value: 'team_2' },
    { label: 'Unentschieden', value: 'draw' }
  ]
})

// Derive the result automatically once both scores are filled in.
watch(
  () => [editState.team1Score, editState.team2Score] as const,
  ([s1, s2]) => {
    if (!hasScore(s1) || !hasScore(s2)) return
    editState.result = s1 > s2 ? 'team_1' : s1 < s2 ? 'team_2' : 'draw'
  }
)

// Reset transient state when the modal closes.
watch(editOpen, (open) => {
  if (!open) {
    editLoading.value = false
    editError.value = ''
  }
})

function openEdit(f: Fixture) {
  editTarget.value = f
  editState.result = f.result
  editState.team1Score = f.team1Score
  editState.team2Score = f.team2Score
  editState.value = f.value
  editError.value = ''
  editOpen.value = true
}

async function saveEdit() {
  if (!editTarget.value) return
  const s1 = editState.team1Score
  const s2 = editState.team2Score
  const bothScores = hasScore(s1) && hasScore(s2)
  const noScores = !hasScore(s1) && !hasScore(s2)
  if (!bothScores && !noScores) {
    editError.value = 'Bitte beide Toranzahlen angeben oder beide leer lassen.'
    return
  }
  editLoading.value = true
  editError.value = ''
  try {
    await api.updateFixture(editTarget.value.id, {
      result: editState.result,
      team1Score: bothScores ? s1 : null,
      team2Score: bothScores ? s2 : null,
      value: editState.value
    })
    await refresh()
    editOpen.value = false
    toast.add({ title: 'Spiel aktualisiert', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { status?: number, data?: { message?: string } }
    editError.value = err.status === 500
      ? 'Serverfehler. Bitte erneut versuchen.'
      : err.status === 422
        ? 'Bitte beide Toranzahlen angeben oder beide leer lassen.'
        : (err.data?.message ?? 'Aktualisierung fehlgeschlagen.')
  } finally {
    editLoading.value = false
  }
}

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
          class="cursor-pointer hover:bg-accented transition-colors"
          title="Zum Bearbeiten klicken"
          @click="openEdit(f)"
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
                  @click.stop="reject(f.id)"
                >
                  Ablehnen
                </UButton>
                <UButton
                  color="success"
                  icon="i-lucide-check"
                  size="sm"
                  :loading="actionLoading === f.id"
                  :disabled="actionLoading !== null"
                  @click.stop="approve(f.id)"
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

    <!-- Edit fixture modal -->
    <UModal
      v-model:open="editOpen"
      :title="editTarget ? `Spiel #${editTarget.id} bearbeiten` : 'Spiel bearbeiten'"
    >
      <template #body>
        <div class="space-y-4">
          <!-- Teams (read-only) -->
          <div
            v-if="editTarget"
            class="flex items-center justify-center gap-2 text-sm font-semibold text-default"
          >
            <span class="truncate">{{ teamName(editTarget.team1Id) }}</span>
            <span class="text-dimmed font-normal">vs</span>
            <span class="truncate">{{ teamName(editTarget.team2Id) }}</span>
          </div>

          <!-- Scores -->
          <div class="grid grid-cols-2 gap-4">
            <UFormField
              label="Tore Team 1"
              name="team1Score"
            >
              <UInput
                v-model.number="editState.team1Score"
                type="number"
                min="0"
                placeholder="Optional"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Tore Team 2"
              name="team2Score"
            >
              <UInput
                v-model.number="editState.team2Score"
                type="number"
                min="0"
                placeholder="Optional"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Result -->
          <UFormField
            label="Ergebnis"
            name="result"
            :help="editScoresComplete ? 'Automatisch aus den Toren ermittelt.' : undefined"
          >
            <USelect
              v-model="editState.result"
              :items="resultOptions"
              :disabled="editScoresComplete"
              class="w-full"
            />
          </UFormField>

          <!-- Value -->
          <UFormField
            label="Spielwert (Punkte)"
            name="value"
          >
            <UInput
              v-model.number="editState.value"
              type="number"
              min="0"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="editError"
            color="error"
            variant="soft"
            :description="editError"
            icon="i-lucide-circle-alert"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 justify-end w-full">
          <UButton
            variant="ghost"
            color="neutral"
            @click="editOpen = false"
          >
            Abbrechen
          </UButton>
          <UButton
            :loading="editLoading"
            @click="saveEdit"
          >
            Speichern
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
