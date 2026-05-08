<script setup lang="ts">
import type { Team, User } from '~/types/api'

const route = useRoute()
const api = useApi()
const toast = useToast()

const teamId = computed(() => Number(route.params.id))

const { data: team, refresh: refreshTeam } = useAsyncData<Team>(
  `team-${teamId.value}`,
  () => api.getTeam(teamId.value)
)

const { data: members, refresh: refreshMembers } = useAsyncData<User[]>(
  `team-members-${teamId.value}`,
  () => api.getTeamMembers(teamId.value)
)

const { data: allUsers } = useAsyncData<User[]>('all-users-team', () => api.getUsers())

// Edit name
const editNameOpen = ref(false)
const newName = ref('')
const editLoading = ref(false)

function openEditName() {
  newName.value = team.value?.name ?? ''
  editNameOpen.value = true
}

async function saveTeamName() {
  editLoading.value = true
  try {
    await api.updateTeam(teamId.value, { name: newName.value.trim() || null })
    await refreshTeam()
    editNameOpen.value = false
    toast.add({ title: 'Teamname geändert', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.add({
      title: 'Fehler',
      description: err.data?.message ?? 'Name konnte nicht geändert werden.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    editLoading.value = false
  }
}

// Add member
const addMemberOpen = ref(false)
const selectedUserId = ref<number | null>(null)
const addMemberLoading = ref(false)

const memberIds = computed(() => new Set(members.value?.map(m => m.id) ?? []))

const availableUsers = computed(() =>
  (allUsers.value ?? [])
    .filter(u => !memberIds.value.has(u.id))
    .map(u => ({ label: u.username, value: u.id }))
)

const teamFull = computed(() => (members.value?.length ?? 0) >= 2)

async function addMember() {
  if (!selectedUserId.value) return
  addMemberLoading.value = true
  try {
    await api.addTeamMember(teamId.value, { userId: selectedUserId.value })
    selectedUserId.value = null
    addMemberOpen.value = false
    await refreshMembers()
    toast.add({ title: 'Mitglied hinzugefügt', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    toast.add({
      title: 'Fehler',
      description: err.status === 409
        ? 'Spieler ist bereits im Team oder das Team ist voll.'
        : (err.data?.message ?? 'Mitglied konnte nicht hinzugefügt werden.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    addMemberLoading.value = false
  }
}

// Remove member
const removingId = ref<number | null>(null)

async function removeMember(userId: number) {
  removingId.value = userId
  try {
    await api.removeTeamMember(teamId.value, userId)
    await refreshMembers()
    toast.add({ title: 'Mitglied entfernt', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.add({
      title: 'Fehler',
      description: err.data?.message ?? 'Mitglied konnte nicht entfernt werden.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    removingId.value = null
  }
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}
</script>

<template>
  <div class="p-4 lg:p-8 max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" to="/teams" />
      <UIcon name="i-lucide-users" class="w-6 h-6 text-amber-500" />
      <h1 class="text-2xl font-bold text-(--ui-text) truncate">
        {{ team?.name ?? `Team #${teamId}` }}
      </h1>
      <UButton
        icon="i-lucide-pencil"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="openEditName"
      />
    </div>

    <!-- Members card -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-(--ui-text)">
            Mitglieder ({{ members?.length ?? 0 }}/2)
          </h2>
          <UButton
            v-if="!teamFull"
            icon="i-lucide-user-plus"
            size="sm"
            variant="soft"
            @click="addMemberOpen = true"
          >
            Hinzufügen
          </UButton>
        </div>
      </template>

      <div v-if="members?.length" class="space-y-3">
        <div
          v-for="member in members"
          :key="member.id"
          class="flex items-center gap-3"
        >
          <UAvatar
            :alt="member.username"
            size="sm"
            class="ring-1 ring-(--ui-border)"
          />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-(--ui-text) truncate">{{ member.username }}</p>
            <p class="text-xs text-(--ui-text-dimmed)">{{ formatScore(member.totalScore) }} Punkte</p>
          </div>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            color="neutral"
            size="xs"
            :loading="removingId === member.id"
            @click="removeMember(member.id)"
          />
        </div>
      </div>

      <div v-else class="py-6 text-center text-(--ui-text-muted)">
        <UIcon name="i-lucide-user-x" class="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p class="text-sm">Noch keine Mitglieder.</p>
        <UButton
          v-if="!teamFull"
          size="sm"
          variant="soft"
          class="mt-3"
          @click="addMemberOpen = true"
        >
          Ersten Spieler hinzufügen
        </UButton>
      </div>
    </UCard>

    <!-- Edit name modal -->
    <UModal v-model:open="editNameOpen" title="Teamname bearbeiten">
      <template #body>
        <UFormField label="Teamname" name="name">
          <UInput
            v-model="newName"
            placeholder="Name (optional, leer = kein Name)"
            class="w-full"
            @keydown.enter="saveTeamName"
          />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex gap-3 justify-end w-full">
          <UButton variant="ghost" color="neutral" @click="editNameOpen = false">
            Abbrechen
          </UButton>
          <UButton :loading="editLoading" @click="saveTeamName">
            Speichern
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Add member modal -->
    <UModal v-model:open="addMemberOpen" title="Mitglied hinzufügen">
      <template #body>
        <UFormField label="Spieler" name="userId">
          <USelect
            v-model="selectedUserId"
            :items="availableUsers"
            placeholder="Spieler auswählen"
            class="w-full"
          />
        </UFormField>
        <p v-if="availableUsers.length === 0" class="text-sm text-(--ui-text-muted) mt-2">
          Keine weiteren Spieler verfügbar.
        </p>
      </template>
      <template #footer>
        <div class="flex gap-3 justify-end w-full">
          <UButton variant="ghost" color="neutral" @click="addMemberOpen = false">
            Abbrechen
          </UButton>
          <UButton
            :loading="addMemberLoading"
            :disabled="!selectedUserId"
            @click="addMember"
          >
            Hinzufügen
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
