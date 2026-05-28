<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAsyncData } from '#imports'
import { useApi } from '~/composables/useApi'
import type { Fixture, User, Team } from '~/types/api'
import { formatDate, resultColor } from '~/utils/format'

interface H2HResult {
  winsA: number
  winsB: number
  draws: number
  played: number
  goalsA: number
  goalsB: number
  pointsA: number
  pointsB: number
  fixtures: Fixture[]
}

interface PageData {
  fixtures: Fixture[]
  users: User[]
  teams: Team[]
  membersByTeam: Record<number, User[]>
}

const api = useApi()

const { data, pending, error, refresh } = useAsyncData<PageData>('statistik-data', async () => {
  const [fixtures, users, teams] = await Promise.all([
    api.getFixtures(undefined, 'approved'),
    api.getUsers(),
    api.getTeams()
  ])

  const membersByTeam: Record<number, User[]> = Object.fromEntries(
    await Promise.all(
      teams.map(async (t: Team) => [t.id, await api.getTeamMembers(t.id)])
    )
  )

  return { fixtures, users, teams, membersByTeam }
})

// Reverse lookup: player ID → array of team IDs
const teamsByPlayer = computed(() => {
  const map = new Map<number, number[]>()
  if (!data.value?.membersByTeam) return map
  for (const [teamId, members] of Object.entries(data.value.membersByTeam)) {
    for (const member of members as User[]) {
      const existing = map.get(member.id) ?? []
      map.set(member.id, [...existing, Number(teamId)])
    }
  }
  return map
})

// Team name with member-name fallback
function getTeamName(teamId: number): string {
  const team = data.value?.teams.find(t => t.id === teamId)
  if (!team) return `Team #${teamId}`
  if (team.name) return team.name
  const members = data.value?.membersByTeam[teamId] ?? []
  if (members.length > 0) return members.map(m => m.username).join(' & ')
  return `Team #${teamId}`
}

const teamOptions = computed(() =>
  (data.value?.teams ?? []).map(t => ({
    label: getTeamName(t.id),
    value: t.id
  }))
)

const playerOptions = computed(() =>
  (data.value?.users ?? []).map(u => ({
    label: u.username,
    value: u.id
  }))
)

// --- Tabs ---
const activeTab = ref<'teams' | 'spieler'>('teams')

// Team tab state
const teamAId = ref<number | undefined>(undefined)
const teamBId = ref<number | undefined>(undefined)

// Player tab state
const playerAId = ref<number | undefined>(undefined)
const playerBId = ref<number | undefined>(undefined)

// Fixture list expand state
const teamFixturesExpanded = ref(false)
const playerFixturesExpanded = ref(false)

// --- H2H logic ---
function calcExtras(relevant: Fixture[], aIsTeam1Fn: (f: Fixture) => boolean) {
  let winsA = 0, winsB = 0, draws = 0, goalsA = 0, goalsB = 0, pointsA = 0, pointsB = 0
  for (const f of relevant) {
    const aIsTeam1 = aIsTeam1Fn(f)
    // goals
    if (f.team1Score !== null && f.team2Score !== null) {
      goalsA += aIsTeam1 ? f.team1Score : f.team2Score
      goalsB += aIsTeam1 ? f.team2Score : f.team1Score
    }
    // wins & points
    if (f.result === 'draw') {
      draws++
    } else if ((f.result === 'team_1') === aIsTeam1) {
      winsA++
      pointsA += f.value
    } else {
      winsB++
      pointsB += f.value
    }
  }
  return { winsA, winsB, draws, goalsA, goalsB, pointsA, pointsB }
}

function teamHeadToHead(idA: number, idB: number): H2HResult {
  const allFixtures = data.value?.fixtures ?? []
  const relevant = allFixtures.filter(f =>
    (f.team1Id === idA && f.team2Id === idB)
    || (f.team1Id === idB && f.team2Id === idA)
  )
  const extras = calcExtras(relevant, f => f.team1Id === idA)
  return { ...extras, played: relevant.length, fixtures: relevant }
}

function playerHeadToHead(idA: number, idB: number): H2HResult {
  const allFixtures = data.value?.fixtures ?? []
  const teamsA = new Set(teamsByPlayer.value.get(idA) ?? [])
  const teamsB = new Set(teamsByPlayer.value.get(idB) ?? [])
  const relevant = allFixtures.filter((f) => {
    const aOnTeam1 = teamsA.has(f.team1Id) && teamsB.has(f.team2Id)
    const aOnTeam2 = teamsA.has(f.team2Id) && teamsB.has(f.team1Id)
    return aOnTeam1 || aOnTeam2
  })
  const extras = calcExtras(relevant, f => teamsA.has(f.team1Id))
  return { ...extras, played: relevant.length, fixtures: relevant }
}

// --- Computed results ---
const sameTeam = computed(() =>
  teamAId.value !== undefined && teamAId.value === teamBId.value
)
const teamResult = computed<H2HResult | null>(() => {
  if (!teamAId.value || !teamBId.value || sameTeam.value) return null
  return teamHeadToHead(teamAId.value, teamBId.value)
})
const teamNameA = computed(() => teamAId.value ? getTeamName(teamAId.value) : '')
const teamNameB = computed(() => teamBId.value ? getTeamName(teamBId.value) : '')

const samePlayer = computed(() =>
  playerAId.value !== undefined && playerAId.value === playerBId.value
)
const playerResult = computed<H2HResult | null>(() => {
  if (!playerAId.value || !playerBId.value || samePlayer.value) return null
  return playerHeadToHead(playerAId.value, playerBId.value)
})
const playerNameA = computed(() =>
  data.value?.users.find(u => u.id === playerAId.value)?.username ?? ''
)
const playerNameB = computed(() =>
  data.value?.users.find(u => u.id === playerBId.value)?.username ?? ''
)

// Sorted fixture lists (newest first)
const teamFixturesSorted = computed(() =>
  [...(teamResult.value?.fixtures ?? [])].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  )
)
const playerFixturesSorted = computed(() =>
  [...(playerResult.value?.fixtures ?? [])].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  )
)
</script>

<template>
  <div class="p-4 lg:p-8 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <UIcon
        name="i-lucide-bar-chart-2"
        class="w-6 h-6 text-amber-500"
      />
      <h1 class="text-2xl font-bold text-default">
        Statistik
      </h1>
    </div>

    <!-- Loading -->
    <div
      v-if="pending"
      class="space-y-4"
    >
      <div class="h-12 rounded-lg bg-elevated animate-pulse" />
      <div class="h-48 rounded-xl bg-elevated animate-pulse" />
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

    <template v-else>
      <!-- Tab toggle -->
      <div class="flex gap-1 p-1 bg-elevated rounded-lg border border-default mb-6">
        <button
          :class="[
            'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'teams' ? 'bg-default text-default shadow-sm' : 'text-muted hover:text-default'
          ]"
          @click="activeTab = 'teams'"
        >
          <UIcon
            name="i-lucide-users"
            class="w-4 h-4"
          />
          Teams
        </button>
        <button
          :class="[
            'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'spieler' ? 'bg-default text-default shadow-sm' : 'text-muted hover:text-default'
          ]"
          @click="activeTab = 'spieler'"
        >
          <UIcon
            name="i-lucide-user"
            class="w-4 h-4"
          />
          Spieler
        </button>
      </div>

      <!-- ===== TEAMS TAB ===== -->
      <div v-if="activeTab === 'teams'">
        <!-- Selectors -->
        <UCard class="mb-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <UFormField
              label="Team A"
              name="teamA"
            >
              <USelect
                v-model="teamAId"
                :items="teamOptions"
                placeholder="Team auswählen"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Team B"
              name="teamB"
            >
              <USelect
                v-model="teamBId"
                :items="teamOptions"
                placeholder="Team auswählen"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Same team warning -->
        <UAlert
          v-if="sameTeam"
          color="warning"
          variant="soft"
          icon="i-lucide-triangle-alert"
          description="Bitte zwei verschiedene Teams auswählen."
          class="mb-4"
        />

        <!-- Result -->
        <template v-else-if="teamAId && teamBId && teamResult">
          <!-- No games -->
          <div
            v-if="teamResult.played === 0"
            class="text-center py-12 text-muted"
          >
            <UIcon
              name="i-lucide-calendar-x"
              class="w-10 h-10 mx-auto mb-3 opacity-40"
            />
            <p>Noch keine Spiele zwischen diesen Teams.</p>
          </div>

          <!-- Summary -->
          <UCard v-else>
            <template #header>
              <p class="text-sm text-dimmed text-center">
                {{ teamResult.played }} {{ teamResult.played === 1 ? 'Spiel' : 'Spiele' }} gesamt
              </p>
            </template>

            <!-- Win bar -->
            <div class="flex items-center gap-3 py-2">
              <span class="font-semibold text-default text-right flex-1 truncate">{{ teamNameA }}</span>
              <div class="shrink-0 text-center px-2">
                <span class="text-2xl font-bold tabular-nums text-amber-500">{{ teamResult.winsA }}</span>
                <span class="text-dimmed mx-1">–</span>
                <span class="text-lg font-semibold tabular-nums text-muted">{{ teamResult.draws }}</span>
                <span class="text-dimmed mx-1">–</span>
                <span class="text-2xl font-bold tabular-nums text-amber-500">{{ teamResult.winsB }}</span>
              </div>
              <span class="font-semibold text-default flex-1 truncate">{{ teamNameB }}</span>
            </div>

            <!-- Progress bar -->
            <div
              v-if="teamResult.winsA + teamResult.winsB > 0"
              class="mt-3 h-2 rounded-full bg-elevated overflow-hidden"
            >
              <div
                class="h-full bg-amber-500 rounded-full transition-all"
                :style="{ width: `${(teamResult.winsA / (teamResult.winsA + teamResult.winsB)) * 100}%` }"
              />
            </div>

            <!-- Goals & Points -->
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-lg bg-elevated px-4 py-3 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 text-sm text-dimmed">
                  <UIcon
                    name="i-lucide-goal"
                    class="w-4 h-4"
                  />
                  Tore
                </div>
                <div class="tabular-nums text-sm font-semibold text-default">
                  {{ teamResult.goalsA }}
                  <span class="text-dimmed font-normal mx-1">:</span>
                  {{ teamResult.goalsB }}
                </div>
              </div>
              <div class="rounded-lg bg-elevated px-4 py-3 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 text-sm text-dimmed">
                  <UIcon
                    name="i-lucide-coins"
                    class="w-4 h-4"
                  />
                  Punkte
                </div>
                <div class="tabular-nums text-sm font-semibold text-default">
                  {{ teamResult.pointsA }}
                  <span class="text-dimmed font-normal mx-1">:</span>
                  {{ teamResult.pointsB }}
                </div>
              </div>
            </div>

            <!-- Fixture list toggle -->
            <template #footer>
              <button
                class="flex items-center gap-2 text-sm text-muted hover:text-default transition-colors w-full"
                @click="teamFixturesExpanded = !teamFixturesExpanded"
              >
                <UIcon
                  :name="teamFixturesExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="w-4 h-4"
                />
                {{ teamFixturesExpanded ? 'Spiele ausblenden' : 'Alle Spiele anzeigen' }}
              </button>
            </template>
          </UCard>

          <!-- Fixture list -->
          <div
            v-if="teamFixturesExpanded && teamResult.played > 0"
            class="mt-3 space-y-2"
          >
            <UCard
              v-for="f in teamFixturesSorted"
              :key="f.id"
            >
              <div class="flex items-center gap-4">
                <div class="shrink-0 text-center w-16">
                  <p class="text-xs text-dimmed font-medium">
                    {{ formatDate(f.playedAt) }}
                  </p>
                  <p class="text-xs text-dimmed mt-0.5">
                    Wert: {{ f.value }}
                  </p>
                </div>

                <USeparator
                  orientation="vertical"
                  class="h-10"
                />

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'font-semibold text-sm truncate',
                        f.result === 'team_1' ? 'text-amber-500' : 'text-default'
                      ]"
                    >
                      {{ getTeamName(f.team1Id) }}
                    </span>
                    <span class="text-dimmed text-sm shrink-0">vs</span>
                    <span
                      :class="[
                        'font-semibold text-sm truncate',
                        f.result === 'team_2' ? 'text-amber-500' : 'text-default'
                      ]"
                    >
                      {{ getTeamName(f.team2Id) }}
                    </span>
                  </div>

                  <div
                    v-if="f.team1Score !== null && f.team2Score !== null"
                    class="flex items-center gap-2 mt-1"
                  >
                    <span class="text-lg font-bold tabular-nums text-default">{{ f.team1Score }}</span>
                    <span class="text-dimmed text-sm">:</span>
                    <span class="text-lg font-bold tabular-nums text-default">{{ f.team2Score }}</span>
                  </div>
                </div>

                <div class="shrink-0">
                  <UBadge
                    :label="f.result === 'draw' ? 'Unentschieden' : `${getTeamName(f.result === 'team_1' ? f.team1Id : f.team2Id)} gewinnt`"
                    :color="resultColor(f.result)"
                    variant="soft"
                  />
                </div>
              </div>
            </UCard>
          </div>
        </template>

        <!-- Prompt -->
        <div
          v-else-if="!teamAId || !teamBId"
          class="text-center py-12 text-muted"
        >
          <UIcon
            name="i-lucide-bar-chart-2"
            class="w-10 h-10 mx-auto mb-3 opacity-40"
          />
          <p>Wähle zwei Teams aus, um ihre Bilanz zu sehen.</p>
        </div>
      </div>

      <!-- ===== SPIELER TAB ===== -->
      <div v-else>
        <!-- Selectors -->
        <UCard class="mb-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <UFormField
              label="Spieler A"
              name="playerA"
            >
              <USelect
                v-model="playerAId"
                :items="playerOptions"
                placeholder="Spieler auswählen"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Spieler B"
              name="playerB"
            >
              <USelect
                v-model="playerBId"
                :items="playerOptions"
                placeholder="Spieler auswählen"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Same player warning -->
        <UAlert
          v-if="samePlayer"
          color="warning"
          variant="soft"
          icon="i-lucide-triangle-alert"
          description="Bitte zwei verschiedene Spieler auswählen."
          class="mb-4"
        />

        <!-- Result -->
        <template v-else-if="playerAId && playerBId && playerResult">
          <!-- No games -->
          <div
            v-if="playerResult.played === 0"
            class="text-center py-12 text-muted"
          >
            <UIcon
              name="i-lucide-calendar-x"
              class="w-10 h-10 mx-auto mb-3 opacity-40"
            />
            <p>Noch keine Spiele zwischen diesen Spielern.</p>
          </div>

          <!-- Summary -->
          <UCard v-else>
            <template #header>
              <p class="text-sm text-dimmed text-center">
                {{ playerResult.played }} {{ playerResult.played === 1 ? 'Spiel' : 'Spiele' }} gesamt
              </p>
            </template>

            <!-- Win bar -->
            <div class="flex items-center gap-3 py-2">
              <span class="font-semibold text-default text-right flex-1 truncate">{{ playerNameA }}</span>
              <div class="shrink-0 text-center px-2">
                <span class="text-2xl font-bold tabular-nums text-amber-500">{{ playerResult.winsA }}</span>
                <span class="text-dimmed mx-1">–</span>
                <span class="text-lg font-semibold tabular-nums text-muted">{{ playerResult.draws }}</span>
                <span class="text-dimmed mx-1">–</span>
                <span class="text-2xl font-bold tabular-nums text-amber-500">{{ playerResult.winsB }}</span>
              </div>
              <span class="font-semibold text-default flex-1 truncate">{{ playerNameB }}</span>
            </div>

            <!-- Progress bar -->
            <div
              v-if="playerResult.winsA + playerResult.winsB > 0"
              class="mt-3 h-2 rounded-full bg-elevated overflow-hidden"
            >
              <div
                class="h-full bg-amber-500 rounded-full transition-all"
                :style="{ width: `${(playerResult.winsA / (playerResult.winsA + playerResult.winsB)) * 100}%` }"
              />
            </div>

            <!-- Goals & Points -->
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-lg bg-elevated px-4 py-3 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 text-sm text-dimmed">
                  <UIcon
                    name="i-lucide-goal"
                    class="w-4 h-4"
                  />
                  Tore
                </div>
                <div class="tabular-nums text-sm font-semibold text-default">
                  {{ playerResult.goalsA }}
                  <span class="text-dimmed font-normal mx-1">:</span>
                  {{ playerResult.goalsB }}
                </div>
              </div>
              <div class="rounded-lg bg-elevated px-4 py-3 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 text-sm text-dimmed">
                  <UIcon
                    name="i-lucide-coins"
                    class="w-4 h-4"
                  />
                  Punkte
                </div>
                <div class="tabular-nums text-sm font-semibold text-default">
                  {{ playerResult.pointsA }}
                  <span class="text-dimmed font-normal mx-1">:</span>
                  {{ playerResult.pointsB }}
                </div>
              </div>
            </div>

            <!-- Fixture list toggle -->
            <template #footer>
              <button
                class="flex items-center gap-2 text-sm text-muted hover:text-default transition-colors w-full"
                @click="playerFixturesExpanded = !playerFixturesExpanded"
              >
                <UIcon
                  :name="playerFixturesExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="w-4 h-4"
                />
                {{ playerFixturesExpanded ? 'Spiele ausblenden' : 'Alle Spiele anzeigen' }}
              </button>
            </template>
          </UCard>

          <!-- Fixture list -->
          <div
            v-if="playerFixturesExpanded && playerResult.played > 0"
            class="mt-3 space-y-2"
          >
            <UCard
              v-for="f in playerFixturesSorted"
              :key="f.id"
            >
              <div class="flex items-center gap-4">
                <div class="shrink-0 text-center w-16">
                  <p class="text-xs text-dimmed font-medium">
                    {{ formatDate(f.playedAt) }}
                  </p>
                  <p class="text-xs text-dimmed mt-0.5">
                    Wert: {{ f.value }}
                  </p>
                </div>

                <USeparator
                  orientation="vertical"
                  class="h-10"
                />

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'font-semibold text-sm truncate',
                        f.result === 'team_1' ? 'text-amber-500' : 'text-default'
                      ]"
                    >
                      {{ getTeamName(f.team1Id) }}
                    </span>
                    <span class="text-dimmed text-sm shrink-0">vs</span>
                    <span
                      :class="[
                        'font-semibold text-sm truncate',
                        f.result === 'team_2' ? 'text-amber-500' : 'text-default'
                      ]"
                    >
                      {{ getTeamName(f.team2Id) }}
                    </span>
                  </div>

                  <div
                    v-if="f.team1Score !== null && f.team2Score !== null"
                    class="flex items-center gap-2 mt-1"
                  >
                    <span class="text-lg font-bold tabular-nums text-default">{{ f.team1Score }}</span>
                    <span class="text-dimmed text-sm">:</span>
                    <span class="text-lg font-bold tabular-nums text-default">{{ f.team2Score }}</span>
                  </div>
                </div>

                <div class="shrink-0">
                  <UBadge
                    :label="f.result === 'draw' ? 'Unentschieden' : `${getTeamName(f.result === 'team_1' ? f.team1Id : f.team2Id)} gewinnt`"
                    :color="resultColor(f.result)"
                    variant="soft"
                  />
                </div>
              </div>
            </UCard>
          </div>
        </template>

        <!-- Prompt -->
        <div
          v-else-if="!playerAId || !playerBId"
          class="text-center py-12 text-muted"
        >
          <UIcon
            name="i-lucide-bar-chart-2"
            class="w-10 h-10 mx-auto mb-3 opacity-40"
          />
          <p>Wähle zwei Spieler aus, um ihre Bilanz zu sehen.</p>
        </div>
      </div>
    </template>
  </div>
</template>
