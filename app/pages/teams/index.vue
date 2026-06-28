<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAsyncData, useToast } from '#imports'
import { useApi } from '~/composables/useApi'
import type { Team, User } from '~/types/api'

const api = useApi()
const toast = useToast()

const { data: teams, pending, error, refresh } = useAsyncData<Team[]>(
  'teams-list',
  () => api.getTeams()
)

const { data: usersData } = useAsyncData<User[]>('users-for-teams', () => api.getUsers())
const players = computed(() => usersData.value ?? [])

const createModalOpen = ref(false)
const newTeamName = ref('')
const member1Id = ref<number | undefined>(undefined)
const member2Id = ref<number | undefined>(undefined)
const createLoading = ref(false)
const createError = ref('')

// At least one member is required (not enforced by the backend).
const hasMember = computed(() =>
  typeof member1Id.value === 'number' || typeof member2Id.value === 'number'
)

// Reset the form whenever the modal closes.
watch(createModalOpen, (open) => {
  if (!open) {
    newTeamName.value = ''
    member1Id.value = undefined
    member2Id.value = undefined
    createError.value = ''
  }
})

async function createTeam() {
  if (!hasMember.value) {
    createError.value = 'Bitte mindestens ein Mitglied auswählen.'
    return
  }
  createLoading.value = true
  createError.value = ''
  try {
    const team = await api.createTeam({ name: newTeamName.value.trim() || null })

    // POST /teams only takes a name, so add the chosen members afterwards.
    const memberIds = [...new Set([member1Id.value, member2Id.value])]
      .filter((v): v is number => typeof v === 'number')
    const results = await Promise.allSettled(
      memberIds.map(userId => api.addTeamMember(team.id, { userId }))
    )
    const failed = results.filter(r => r.status === 'rejected').length

    createModalOpen.value = false
    await refresh()

    if (failed > 0) {
      toast.add({
        title: 'Team erstellt',
        description: `${failed} Mitglied${failed === 1 ? '' : 'er'} konnte${failed === 1 ? '' : 'n'} nicht hinzugefügt werden.`,
        color: 'warning',
        icon: 'i-lucide-triangle-alert'
      })
    } else {
      toast.add({ title: 'Team erstellt', color: 'success', icon: 'i-lucide-check-circle' })
    }
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    toast.add({
      title: 'Fehler',
      description: err.status === 500
        ? 'Serverfehler. Bitte erneut versuchen.'
        : (err.data?.message ?? 'Team konnte nicht erstellt werden.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    createLoading.value = false
  }
}
</script>

<template>
  <div class="p-4 lg:p-8 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <UIcon
          name="i-lucide-users"
          class="w-6 h-6 text-amber-500"
        />
        <h1 class="text-2xl font-bold text-default">
          Teams
        </h1>
      </div>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        @click="createModalOpen = true"
      >
        Team erstellen
      </UButton>
    </div>

    <!-- Loading -->
    <div
      v-if="pending"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="h-28 rounded-xl bg-elevated animate-pulse"
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

    <!-- Team grid -->
    <div
      v-else-if="teams?.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <NuxtLink
        v-for="team in teams"
        :key="team.id"
        :to="`/teams/${team.id}`"
        class="block"
      >
        <UCard class="hover:bg-accented transition-colors cursor-pointer h-full">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <UIcon
                name="i-lucide-users"
                class="w-5 h-5 text-amber-500"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-default truncate">
                {{ team.name ?? `Team #${team.id}` }}
              </p>

              <!-- Members -->
              <div
                v-if="team.members.length"
                class="flex items-center gap-2 mt-2"
              >
                <div class="flex -space-x-2">
                  <UAvatar
                    v-for="m in team.members"
                    :key="m.id"
                    :alt="m.username"
                    size="2xs"
                    class="ring-2 ring-default"
                  />
                </div>
                <span class="text-xs text-muted truncate">
                  {{ team.members.map(m => m.username).join(' & ') }}
                </span>
              </div>
              <p
                v-else
                class="text-xs text-dimmed italic mt-2"
              >
                Noch keine Mitglieder
              </p>

              <p class="text-xs text-dimmed mt-1">
                Erstellt: {{ formatDate(team.created_at) }}
              </p>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="w-4 h-4 text-dimmed shrink-0 mt-1"
            />
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Empty -->
    <div
      v-else
      class="text-center py-16 text-muted"
    >
      <UIcon
        name="i-lucide-users"
        class="w-10 h-10 mx-auto mb-3 opacity-40"
      />
      <p class="mb-4">
        Noch keine Teams vorhanden.
      </p>
      <UButton
        icon="i-lucide-plus"
        variant="soft"
        @click="createModalOpen = true"
      >
        Erstes Team erstellen
      </UButton>
    </div>

    <!-- Create team modal -->
    <UModal
      v-model:open="createModalOpen"
      title="Team erstellen"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            label="Teamname"
            name="name"
            help="Leer lassen für ein namenloses Team."
          >
            <UInput
              v-model="newTeamName"
              placeholder="Name (optional)"
              class="w-full"
              @keydown.enter="createTeam"
            />
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField
              label="Mitglied 1"
              name="member1"
              required
            >
              <PlayerSelect
                v-model="member1Id"
                :players="players"
                :exclude="member2Id"
                placeholder="Spieler suchen…"
              />
            </UFormField>
            <UFormField
              label="Mitglied 2"
              name="member2"
            >
              <PlayerSelect
                v-model="member2Id"
                :players="players"
                :exclude="member1Id"
                placeholder="Spieler suchen…"
              />
            </UFormField>
          </div>
          <p class="text-xs text-muted">
            Mindestens ein, höchstens zwei Mitglieder – weitere können später ergänzt werden.
          </p>

          <UAlert
            v-if="createError"
            color="error"
            variant="soft"
            :description="createError"
            icon="i-lucide-circle-alert"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 justify-end w-full">
          <UButton
            variant="ghost"
            color="neutral"
            @click="createModalOpen = false"
          >
            Abbrechen
          </UButton>
          <UButton
            :loading="createLoading"
            :disabled="!hasMember"
            @click="createTeam"
          >
            Erstellen
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
