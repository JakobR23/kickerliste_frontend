<script setup lang="ts">
import type { Fixture, Team } from '~/types/api'

const auth = useAuthStore()
const api = useApi()
const toast = useToast()

// Guard: admin only
onMounted(() => {
  if (!auth.isAdmin.value) navigateTo('/')
})

// Pending fixtures: the current API only returns approved fixtures via GET /fixtures.
// We store submitted fixture IDs in a local list so admins can look them up.
// When the backend adds a GET /fixtures?status=pending endpoint, this page can be updated.

const lookupId = ref<number | null>(null)
const lookedUpFixture = ref<Fixture | null>(null)
const lookupLoading = ref(false)
const lookupError = ref('')

const { data: teams } = useAsyncData<Team[]>('teams-admin-fixtures', () => api.getTeams())

const teamMap = computed(() => {
  const map = new Map<number, string>()
  teams.value?.forEach(t => map.set(t.id, t.name ?? `Team #${t.id}`))
  return map
})

function teamName(id: number): string {
  return teamMap.value.get(id) ?? `Team #${id}`
}

async function lookupFixture() {
  if (!lookupId.value) return
  lookupLoading.value = true
  lookupError.value = ''
  lookedUpFixture.value = null
  try {
    const f = await api.getFixture(lookupId.value)
    lookedUpFixture.value = f
  } catch (e: unknown) {
    const err = e as { status?: number, data?: { message?: string } }
    lookupError.value = err.status === 404
      ? 'Kein Spiel mit dieser ID gefunden.'
      : (err.data?.message ?? 'Fehler beim Laden.')
  } finally {
    lookupLoading.value = false
  }
}

const actionLoading = ref<'approve' | 'reject' | null>(null)

async function approve(id: number) {
  actionLoading.value = 'approve'
  try {
    const updated = await api.approveFixture(id)
    lookedUpFixture.value = updated
    toast.add({ title: 'Spiel genehmigt', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { status?: number, data?: { message?: string } }
    toast.add({
      title: 'Fehler',
      description: err.status === 409
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
  actionLoading.value = 'reject'
  try {
    const updated = await api.rejectFixture(id)
    lookedUpFixture.value = updated
    toast.add({ title: 'Spiel abgelehnt', color: 'neutral', icon: 'i-lucide-x-circle' })
  } catch (e: unknown) {
    const err = e as { status?: number, data?: { message?: string } }
    toast.add({
      title: 'Fehler',
      description: err.status === 409
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

const statusConfig = {
  pending: { label: 'Ausstehend', color: 'amber' as const },
  approved: { label: 'Genehmigt', color: 'success' as const },
  rejected: { label: 'Abgelehnt', color: 'error' as const }
}

const resultLabels = {
  team_1: 'Team 1 gewinnt',
  team_2: 'Team 2 gewinnt',
  draw: 'Unentschieden'
}
</script>

<template>
  <div class="p-4 lg:p-8 max-w-2xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <UIcon name="i-lucide-clipboard-check" class="w-6 h-6 text-amber-500" />
      <h1 class="text-2xl font-bold text-(--ui-text)">Spielüberprüfung</h1>
    </div>

    <UAlert
      color="neutral"
      variant="soft"
      icon="i-lucide-info"
      title="Spiel nachschlagen"
      description="Gib die ID eines eingereichten Spiels ein, um es zu überprüfen, genehmigen oder abzulehnen."
      class="mb-6"
    />

    <!-- Lookup form -->
    <UCard class="mb-6">
      <div class="flex gap-3">
        <UFormField label="Spiel-ID" name="fixtureId" class="flex-1">
          <UInput
            v-model.number="lookupId"
            type="number"
            min="1"
            placeholder="z.B. 42"
            class="w-full"
            @keydown.enter="lookupFixture"
          />
        </UFormField>
        <div class="flex items-end">
          <UButton
            :loading="lookupLoading"
            :disabled="!lookupId"
            icon="i-lucide-search"
            @click="lookupFixture"
          >
            Suchen
          </UButton>
        </div>
      </div>
      <UAlert
        v-if="lookupError"
        color="error"
        variant="soft"
        :description="lookupError"
        icon="i-lucide-circle-alert"
        class="mt-4"
      />
    </UCard>

    <!-- Found fixture -->
    <UCard v-if="lookedUpFixture">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-(--ui-text)">Spiel #{{ lookedUpFixture.id }}</h2>
          <UBadge
            :label="statusConfig[lookedUpFixture.status].label"
            :color="statusConfig[lookedUpFixture.status].color"
            variant="soft"
          />
        </div>
      </template>

      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-(--ui-text-dimmed) text-xs mb-1">Team 1</p>
            <p class="font-medium text-(--ui-text)">{{ teamName(lookedUpFixture.team1Id) }}</p>
          </div>
          <div>
            <p class="text-(--ui-text-dimmed) text-xs mb-1">Team 2</p>
            <p class="font-medium text-(--ui-text)">{{ teamName(lookedUpFixture.team2Id) }}</p>
          </div>
          <div>
            <p class="text-(--ui-text-dimmed) text-xs mb-1">Ergebnis</p>
            <p class="font-medium text-(--ui-text)">{{ resultLabels[lookedUpFixture.result] }}</p>
          </div>
          <div>
            <p class="text-(--ui-text-dimmed) text-xs mb-1">Spielwert</p>
            <p class="font-medium text-(--ui-text)">{{ lookedUpFixture.value }} Punkte</p>
          </div>
          <div v-if="lookedUpFixture.team1Score !== null">
            <p class="text-(--ui-text-dimmed) text-xs mb-1">Score</p>
            <p class="font-medium text-(--ui-text)">
              {{ lookedUpFixture.team1Score }} : {{ lookedUpFixture.team2Score }}
            </p>
          </div>
          <div>
            <p class="text-(--ui-text-dimmed) text-xs mb-1">Gespielt am</p>
            <p class="font-medium text-(--ui-text)">{{ formatDate(lookedUpFixture.playedAt) }}</p>
          </div>
        </div>

        <!-- Actions (only for pending) -->
        <div v-if="lookedUpFixture.status === 'pending'" class="flex gap-3 pt-4 border-t border-(--ui-border)">
          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-x"
            :loading="actionLoading === 'reject'"
            :disabled="actionLoading !== null"
            @click="reject(lookedUpFixture.id)"
          >
            Ablehnen
          </UButton>
          <UButton
            color="success"
            icon="i-lucide-check"
            :loading="actionLoading === 'approve'"
            :disabled="actionLoading !== null"
            @click="approve(lookedUpFixture.id)"
          >
            Genehmigen
          </UButton>
        </div>

        <UAlert
          v-else-if="lookedUpFixture.status === 'approved'"
          color="success"
          variant="soft"
          description="Dieses Spiel wurde bereits genehmigt und zählt zur Wertung."
          icon="i-lucide-check-circle"
        />
        <UAlert
          v-else
          color="neutral"
          variant="soft"
          description="Dieses Spiel wurde abgelehnt."
          icon="i-lucide-x-circle"
        />
      </div>
    </UCard>
  </div>
</template>
