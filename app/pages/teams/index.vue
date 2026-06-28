<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAsyncData, useToast } from '#imports'
import { useAuthStore } from '~/composables/useAuthStore'
import { useApi } from '~/composables/useApi'
import type { Team, User } from '~/types/api'

const api = useApi()
const auth = useAuthStore()
const toast = useToast()

const { data: teams, pending, error, refresh } = useAsyncData<Team[]>(
  'teams-list',
  () => api.getTeams()
)

const { data: usersData, refresh: refreshUsers } = useAsyncData<User[]>('users-for-teams', () => api.getUsers())
const players = computed(() => usersData.value ?? [])

const canRemoveMembers = computed(() => auth.isAdmin.value)

// ---------- Create ----------
const createModalOpen = ref(false)
const newTeamName = ref('')
const draftMembers = ref<User[]>([])
const createError = ref('')
const createLoading = ref(false)

const hasMember = computed(() => draftMembers.value.length > 0)

watch(createModalOpen, (open) => {
  if (!open) {
    newTeamName.value = ''
    draftMembers.value = []
    createError.value = ''
  }
})

function draftAdd(user: User) {
  draftMembers.value = [...draftMembers.value, user]
  createError.value = ''
}
function draftRemove(id: number) {
  draftMembers.value = draftMembers.value.filter(u => u.id !== id)
}

async function createTeam() {
  if (!hasMember.value) {
    createError.value = 'Bitte mindestens ein Mitglied auswählen.'
    return
  }
  createLoading.value = true
  createError.value = ''
  try {
    // The team and its members are created in a single request.
    await api.createTeam({
      name: newTeamName.value.trim() || null,
      members: draftMembers.value.map(u => u.id)
    })
    createModalOpen.value = false
    await refresh()
    toast.add({ title: 'Team erstellt', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    if (err.status === 422) {
      // A selected user no longer exists; no team was created. Refresh the
      // user list, drop stale picks, and ask the user to reselect.
      await refreshUsers()
      const valid = new Set(players.value.map(p => p.id))
      draftMembers.value = draftMembers.value.filter(u => valid.has(u.id))
      createError.value = 'Ein ausgewählter Spieler existiert nicht mehr. Bitte Auswahl prüfen und erneut versuchen.'
    } else {
      toast.add({
        title: 'Fehler',
        description: err.status === 500
          ? 'Serverfehler. Bitte erneut versuchen.'
          : (err.data?.message ?? 'Team konnte nicht erstellt werden.'),
        color: 'error',
        icon: 'i-lucide-circle-alert'
      })
    }
  } finally {
    createLoading.value = false
  }
}

// ---------- Edit (detail-in-modal) ----------
const editModalOpen = ref(false)
const editTeamId = ref<number | null>(null)
// Derive from the list so members stay fresh after each refresh.
const editTeam = computed(() => teams.value?.find(t => t.id === editTeamId.value) ?? null)
const editMembers = computed(() => editTeam.value?.members ?? [])

const editName = ref('')
const nameLoading = ref(false)
const nameChanged = computed(() => editName.value.trim() !== (editTeam.value?.name ?? ''))

const memberMutating = ref(false)
const mutatingId = ref<number | null>(null)

function openEdit(team: Team) {
  editTeamId.value = team.id
  editName.value = team.name ?? ''
  editModalOpen.value = true
}

async function saveName() {
  if (editTeamId.value == null || !nameChanged.value) return
  nameLoading.value = true
  try {
    await api.updateTeam(editTeamId.value, { name: editName.value.trim() || null })
    await refresh()
    toast.add({ title: 'Teamname geändert', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    toast.add({
      title: 'Fehler',
      description: err.status === 500
        ? 'Serverfehler. Bitte erneut versuchen.'
        : (err.data?.message ?? 'Name konnte nicht geändert werden.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    nameLoading.value = false
  }
}

async function addMemberLive(user: User) {
  if (editTeamId.value == null) return
  memberMutating.value = true
  mutatingId.value = user.id
  try {
    await api.addTeamMember(editTeamId.value, { userId: user.id })
    await refresh()
    toast.add({ title: 'Mitglied hinzugefügt', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    toast.add({
      title: 'Fehler',
      description: err.status === 500
        ? 'Serverfehler. Bitte erneut versuchen.'
        : err.status === 409
          ? 'Spieler ist bereits im Team oder das Team ist voll.'
          : (err.data?.message ?? 'Mitglied konnte nicht hinzugefügt werden.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    memberMutating.value = false
    mutatingId.value = null
  }
}

async function removeMemberLive(userId: number) {
  if (editTeamId.value == null) return
  memberMutating.value = true
  mutatingId.value = userId
  try {
    await api.removeTeamMember(editTeamId.value, userId)
    await refresh()
    toast.add({ title: 'Mitglied entfernt', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    toast.add({
      title: 'Fehler',
      description: err.status === 500
        ? 'Serverfehler. Bitte erneut versuchen.'
        : (err.data?.message ?? 'Mitglied konnte nicht entfernt werden.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    memberMutating.value = false
    mutatingId.value = null
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
      <UCard
        v-for="team in teams"
        :key="team.id"
        class="hover:bg-accented transition-colors cursor-pointer h-full"
        @click="openEdit(team)"
      >
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
            name="i-lucide-pencil"
            class="w-4 h-4 text-dimmed shrink-0 mt-1"
          />
        </div>
      </UCard>
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
        <div class="space-y-5">
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

          <div>
            <p class="text-sm font-medium text-default mb-2">
              Mitglieder ({{ draftMembers.length }}/2)
            </p>
            <TeamMembersField
              :members="draftMembers"
              :players="players"
              @add="draftAdd"
              @remove="draftRemove"
            />
            <p class="text-xs text-muted mt-2">
              Mindestens ein Mitglied erforderlich.
            </p>
          </div>

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

    <!-- Edit team modal -->
    <UModal
      v-model:open="editModalOpen"
      :title="editTeam ? (editTeam.name ?? `Team #${editTeam.id}`) : 'Team'"
    >
      <template #body>
        <div class="space-y-5">
          <UFormField
            label="Teamname"
            name="name"
            help="Leer lassen für ein namenloses Team."
          >
            <div class="flex gap-2">
              <UInput
                v-model="editName"
                placeholder="Name (optional)"
                class="flex-1"
                @keydown.enter="saveName"
              />
              <UButton
                icon="i-lucide-check"
                color="primary"
                :loading="nameLoading"
                :disabled="!nameChanged"
                title="Name speichern"
                @click="saveName"
              />
            </div>
          </UFormField>

          <div>
            <p class="text-sm font-medium text-default mb-2">
              Mitglieder ({{ editMembers.length }}/2)
            </p>
            <TeamMembersField
              :members="editMembers"
              :players="players"
              :can-remove="canRemoveMembers"
              :busy="memberMutating"
              :busy-id="mutatingId"
              @add="addMemberLive"
              @remove="removeMemberLive"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end w-full">
          <UButton
            variant="ghost"
            color="neutral"
            @click="editModalOpen = false"
          >
            Schließen
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
