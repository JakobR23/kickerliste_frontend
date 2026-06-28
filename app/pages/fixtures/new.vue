<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { useToast, navigateTo } from '#imports'
import { useApi } from '~/composables/useApi'
import { useTeamsWithMembers } from '~/composables/useTeamsWithMembers'

const api = useApi()
const toast = useToast()

const { teams, pending: teamsLoading } = useTeamsWithMembers('teams-for-new-fixture')

const teamsById = computed(() => new Map(teams.value.map(t => [t.id, t])))

// Label for a side in the result options: real team name, else member names,
// else the positional "Team 1"/"Team 2" fallback.
function sideLabel(id: number | undefined, fallback: string): string {
  const t = id != null ? teamsById.value.get(id) : undefined
  if (!t) return fallback
  if (t.name) return t.name
  if (t.members.length) return t.members.map(m => m.username).join(' & ')
  return fallback
}

const resultOptions = computed(() => [
  { label: `${sideLabel(state.team1Id, 'Team 1')} gewinnt`, value: 'team_1' },
  { label: `${sideLabel(state.team2Id, 'Team 2')} gewinnt`, value: 'team_2' },
  { label: 'Unentschieden', value: 'draw' }
])

// datetime-local value in the browser's local timezone (not UTC)
function localDatetimeValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const state = reactive({
  team1Id: undefined as number | undefined,
  team2Id: undefined as number | undefined,
  result: 'team_1' as 'team_1' | 'team_2' | 'draw',
  team1Score: null as number | null,
  team2Score: null as number | null,
  value: 1,
  playedAt: localDatetimeValue()
})

const errorMsg = ref('')
const loading = ref(false)

function hasScore(v: number | null): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

const scoresComplete = computed(() =>
  hasScore(state.team1Score) && hasScore(state.team2Score)
)

// Derive the result automatically once both scores are filled in.
watch(
  () => [state.team1Score, state.team2Score] as const,
  ([s1, s2]) => {
    if (!hasScore(s1) || !hasScore(s2)) return
    state.result = s1 > s2 ? 'team_1' : s1 < s2 ? 'team_2' : 'draw'
  }
)

async function onSubmit() {
  if (!state.team1Id || !state.team2Id) {
    errorMsg.value = 'Bitte beide Teams auswählen.'
    return
  }
  if (state.team1Id === state.team2Id) {
    errorMsg.value = 'Team 1 und Team 2 dürfen nicht identisch sein.'
    return
  }
  const bothScores = state.team1Score !== null && state.team2Score !== null
  const noScores = state.team1Score === null && state.team2Score === null
  if (!bothScores && !noScores) {
    errorMsg.value = 'Bitte beide Toranzahlen angeben oder beide leer lassen.'
    return
  }

  loading.value = true
  errorMsg.value = ''
  try {
    await api.createFixture({
      team1Id: state.team1Id,
      team2Id: state.team2Id,
      result: state.result,
      team1Score: state.team1Score,
      team2Score: state.team2Score,
      value: state.value,
      playedAt: new Date(state.playedAt).toISOString()
    })
    toast.add({
      title: 'Spiel eingereicht',
      description: 'Das Spiel wurde zur Genehmigung eingereicht.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    await navigateTo('/fixtures')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    errorMsg.value = err.status === 500
      ? 'Serverfehler. Bitte erneut versuchen.'
      : (err.data?.message ?? 'Fehler beim Einreichen des Spiels.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-4 lg:p-8 max-w-xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <UButton
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
        to="/fixtures"
      />
      <UIcon
        name="i-lucide-plus-circle"
        class="w-6 h-6 text-amber-500"
      />
      <h1 class="text-2xl font-bold text-default">
        Spiel einreichen
      </h1>
    </div>

    <UCard>
      <div
        v-if="teamsLoading"
        class="py-8 text-center text-muted"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-6 h-6 animate-spin mx-auto"
        />
      </div>

      <form
        v-else
        class="space-y-5"
        @submit.prevent="onSubmit"
      >
        <!-- Teams -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="Team 1"
            name="team1Id"
            required
          >
            <TeamSelect
              v-model="state.team1Id"
              :teams="teams"
              :exclude="state.team2Id"
              placeholder="Team 1 suchen…"
            />
          </UFormField>
          <UFormField
            label="Team 2"
            name="team2Id"
            required
          >
            <TeamSelect
              v-model="state.team2Id"
              :teams="teams"
              :exclude="state.team1Id"
              placeholder="Team 2 suchen…"
            />
          </UFormField>
        </div>

        <!-- Result -->
        <UFormField
          label="Ergebnis"
          name="result"
          required
          :help="scoresComplete ? 'Automatisch aus den Toren ermittelt.' : undefined"
        >
          <USelect
            v-model="state.result"
            :items="resultOptions"
            :disabled="scoresComplete"
            class="w-full"
          />
        </UFormField>

        <!-- Scores -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Tore Team 1"
            name="team1Score"
          >
            <UInput
              v-model.number="state.team1Score"
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
              v-model.number="state.team2Score"
              type="number"
              min="0"
              placeholder="Optional"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Value + Date -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Spielwert (Punkte)"
            name="value"
          >
            <UInput
              v-model.number="state.value"
              type="number"
              min="0"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Gespielt am"
            name="playedAt"
          >
            <UInput
              v-model="state.playedAt"
              type="datetime-local"
              class="w-full"
            />
          </UFormField>
        </div>

        <UAlert
          color="neutral"
          variant="soft"
          description="Das Spiel wird nach dem Einreichen von einem Administrator geprüft."
          icon="i-lucide-info"
        />

        <UAlert
          v-if="errorMsg"
          color="error"
          variant="soft"
          :description="errorMsg"
          icon="i-lucide-circle-alert"
        />

        <div class="flex gap-3 pt-2">
          <UButton
            variant="ghost"
            color="neutral"
            to="/fixtures"
          >
            Abbrechen
          </UButton>
          <UButton
            type="submit"
            :loading="loading"
            class="flex-1"
          >
            Einreichen
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
