<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAsyncData, useToast, navigateTo } from '#imports'
import { useAuthStore } from '~/composables/useAuthStore'
import { useApi } from '~/composables/useApi'
import { usePendingUsers } from '~/composables/usePendingUsers'
import type { User, ScoreAdjustment } from '~/types/api'
import { formatDate, formatScore } from '~/utils/format'

const auth = useAuthStore()
const api = useApi()
const toast = useToast()
const { refreshPendingCount } = usePendingUsers()

// Guard: admin only
onMounted(() => {
  if (!auth.isAdmin.value) navigateTo('/')
})

// --- Tabs ---
const activeTab = ref<'active' | 'pending'>('active')

const { data: users, refresh: refreshUsers } = useAsyncData<User[]>(
  'admin-users',
  () => api.getUsers()
)

const { data: pendingUsers, refresh: refreshPending, status: pendingStatus } = useAsyncData<User[]>(
  'admin-users-pending',
  () => api.getUsers(false)
)

const sorted = computed(() =>
  [...(users.value ?? [])].sort((a, b) => b.totalScore - a.totalScore)
)

const pendingCount = computed(() => pendingUsers.value?.length ?? 0)

// --- Activate user ---
const activatingId = ref<number | null>(null)

async function activateUser(user: User) {
  activatingId.value = user.id
  try {
    await api.activateUser(user.id)
    await Promise.all([refreshUsers(), refreshPending()])
    await refreshPendingCount()
    toast.add({ title: `${user.username} aktiviert`, color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    toast.add({
      title: 'Fehler',
      description: err.status === 500
        ? 'Serverfehler. Bitte erneut versuchen.'
        : (err.data?.message ?? 'Aktivierung fehlgeschlagen.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    activatingId.value = null
  }
}

// --- Create user ---
const createOpen = ref(false)
const createState = reactive({ username: '', password: '' })
const createError = ref('')
const createLoading = ref(false)

async function createUser() {
  if (createState.password.length < 8) {
    createError.value = 'Das Passwort muss mindestens 8 Zeichen lang sein.'
    return
  }
  createLoading.value = true
  createError.value = ''
  try {
    await api.createUser({ username: createState.username, password: createState.password })
    toast.add({
      title: 'Benutzer erstellt',
      description: `${createState.username} muss beim ersten Login ein neues Passwort setzen.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    Object.assign(createState, { username: '', password: '' })
    createOpen.value = false
    await refreshUsers()
  } catch (e: unknown) {
    const err = e as { status?: number, data?: { message?: string } }
    createError.value = err.status === 500
      ? 'Serverfehler. Bitte erneut versuchen.'
      : err.status === 409
        ? 'Dieser Benutzername ist bereits vergeben.'
        : (err.data?.message ?? 'Fehler beim Erstellen des Benutzers.')
  } finally {
    createLoading.value = false
  }
}

// --- Edit username ---
const editOpen = ref(false)
const editTarget = ref<User | null>(null)
const editUsername = ref('')
const editLoading = ref(false)

function openEdit(user: User) {
  editTarget.value = user
  editUsername.value = user.username
  editOpen.value = true
}

async function saveUsername() {
  if (!editTarget.value) return
  editLoading.value = true
  try {
    await api.updateUser(editTarget.value.id, { username: editUsername.value.trim() })
    await refreshUsers()
    editOpen.value = false
    toast.add({ title: 'Benutzername geändert', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { status?: number, data?: { message?: string } }
    toast.add({
      title: 'Fehler',
      description: err.status === 500
        ? 'Serverfehler. Bitte erneut versuchen.'
        : err.status === 409
          ? 'Benutzername bereits vergeben.'
          : (err.data?.message ?? 'Fehler beim Speichern.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    editLoading.value = false
  }
}

// --- Delete user ---
const deleteOpen = ref(false)
const deleteTarget = ref<User | null>(null)
const deleteLoading = ref(false)

function openDelete(user: User) {
  deleteTarget.value = user
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await api.deleteUser(deleteTarget.value.id)
    await Promise.all([refreshUsers(), refreshPending()])
    await refreshPendingCount()
    deleteOpen.value = false
    toast.add({ title: 'Benutzer gelöscht', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    toast.add({
      title: 'Fehler',
      description: err.status === 500
        ? 'Serverfehler. Bitte erneut versuchen.'
        : (err.data?.message ?? 'Benutzer konnte nicht gelöscht werden.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    deleteLoading.value = false
  }
}

// --- Score adjustment ---
const adjOpen = ref(false)
const adjTarget = ref<User | null>(null)
const adjState = reactive({ amount: 0, reason: '' })
const adjError = ref('')
const adjLoading = ref(false)
const adjHistory = ref<ScoreAdjustment[]>([])
const adjHistoryLoading = ref(false)

// Reset loading/error state whenever the modal is dismissed
watch(adjOpen, (isOpen) => {
  if (!isOpen) {
    adjLoading.value = false
    adjHistoryLoading.value = false
    adjError.value = ''
    adjHistory.value = []
  }
})

async function openAdjustment(user: User) {
  adjTarget.value = user
  Object.assign(adjState, { amount: 0, reason: '' })
  adjError.value = ''
  adjOpen.value = true
  adjHistoryLoading.value = true
  try {
    adjHistory.value = (await api.getAdjustments(user.id)) ?? []
  } catch {
    adjHistory.value = []
  } finally {
    adjHistoryLoading.value = false
  }
}

async function saveAdjustment() {
  if (!adjTarget.value) return
  if (adjState.amount === 0) {
    adjError.value = 'Der Betrag darf nicht 0 sein.'
    return
  }
  if (!adjState.reason.trim()) {
    adjError.value = 'Bitte einen Grund angeben.'
    return
  }
  adjLoading.value = true
  adjError.value = ''
  try {
    await api.createAdjustment(adjTarget.value.id, {
      amount: adjState.amount,
      reason: adjState.reason.trim()
    })
    await refreshUsers()
    adjHistory.value = (await api.getAdjustments(adjTarget.value.id)) ?? []
    Object.assign(adjState, { amount: 0, reason: '' })
    adjOpen.value = false
    toast.add({ title: 'Punktekorrektur gespeichert', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    adjError.value = err.status === 500
      ? 'Serverfehler. Bitte erneut versuchen.'
      : (err.data?.message ?? 'Fehler beim Speichern.')
  } finally {
    adjLoading.value = false
  }
}
</script>

<template>
  <div class="p-4 lg:p-8 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <UIcon
          name="i-lucide-user-cog"
          class="w-6 h-6 text-amber-500"
        />
        <h1 class="text-2xl font-bold text-default">
          Benutzerverwaltung
        </h1>
      </div>
      <UButton
        icon="i-lucide-user-plus"
        color="primary"
        @click="createOpen = true"
      >
        Benutzer erstellen
      </UButton>
    </div>

    <!-- Tab toggle -->
    <div class="flex gap-1 p-1 bg-elevated rounded-lg border border-default mb-4">
      <button
        :class="[
          'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
          activeTab === 'active' ? 'bg-default text-default shadow-sm' : 'text-muted hover:text-default'
        ]"
        @click="activeTab = 'active'"
      >
        Aktive Benutzer
      </button>
      <button
        :class="[
          'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
          activeTab === 'pending' ? 'bg-default text-default shadow-sm' : 'text-muted hover:text-default'
        ]"
        @click="activeTab = 'pending'"
      >
        Ausstehend
        <UBadge
          v-if="pendingCount > 0"
          :label="String(pendingCount)"
          color="warning"
          variant="solid"
          size="xs"
        />
      </button>
    </div>

    <!-- Active user list -->
    <div
      v-if="activeTab === 'active'"
      class="space-y-2"
    >
      <div
        v-for="user in sorted"
        :key="user.id"
        class="flex items-center gap-4 px-4 py-3 rounded-xl border border-default bg-elevated hover:bg-accented transition-colors"
      >
        <UAvatar
          :alt="user.username"
          size="sm"
          class="ring-1 ring-default shrink-0"
        />

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-semibold text-default truncate">
              {{ user.username }}
            </p>
            <UBadge
              v-if="user.role === 'admin'"
              label="Admin"
              color="primary"
              variant="soft"
              size="xs"
            />
          </div>
          <p class="text-xs text-dimmed">
            ID {{ user.id }}
          </p>
        </div>

        <p class="text-lg font-bold tabular-nums text-default shrink-0">
          {{ formatScore(user.totalScore) }}
          <span class="text-xs font-normal text-dimmed"> Pkt</span>
        </p>

        <!-- Actions -->
        <div class="flex items-center gap-1 shrink-0">
          <UButton
            icon="i-lucide-sliders-horizontal"
            variant="ghost"
            color="neutral"
            size="xs"
            title="Punktekorrektur"
            @click="openAdjustment(user)"
          />
          <UButton
            icon="i-lucide-pencil"
            variant="ghost"
            color="neutral"
            size="xs"
            title="Bearbeiten"
            @click="openEdit(user)"
          />
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            size="xs"
            title="Löschen"
            @click="openDelete(user)"
          />
        </div>
      </div>

      <div
        v-if="!sorted.length"
        class="text-center py-12 text-muted"
      >
        <UIcon
          name="i-lucide-users"
          class="w-10 h-10 mx-auto mb-3 opacity-40"
        />
        <p>Keine Benutzer vorhanden.</p>
      </div>
    </div>

    <!-- Pending activation list -->
    <div v-else>
      <div class="flex justify-end mb-3">
        <UButton
          icon="i-lucide-refresh-cw"
          size="xs"
          variant="ghost"
          color="neutral"
          :loading="pendingStatus === 'pending'"
          @click="() => refreshPending()"
        >
          Aktualisieren
        </UButton>
      </div>
      <div class="space-y-2">
        <div
          v-for="user in pendingUsers"
          :key="user.id"
          class="flex items-center gap-4 px-4 py-3 rounded-xl border border-default bg-elevated hover:bg-accented transition-colors"
        >
          <UAvatar
            :alt="user.username"
            size="sm"
            class="ring-1 ring-default shrink-0"
          />

          <div class="flex-1 min-w-0">
            <p class="font-semibold text-default truncate">
              {{ user.username }}
            </p>
            <p class="text-xs text-dimmed">
              ID {{ user.id }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 shrink-0">
            <UButton
              size="xs"
              color="success"
              variant="soft"
              icon="i-lucide-user-check"
              :loading="activatingId === user.id"
              @click="activateUser(user)"
            >
              Aktivieren
            </UButton>
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="xs"
              title="Löschen"
              @click="openDelete(user)"
            />
          </div>
        </div>

        <div
          v-if="!pendingUsers?.length"
          class="text-center py-12 text-muted"
        >
          <UIcon
            name="i-lucide-user-check"
            class="w-10 h-10 mx-auto mb-3 opacity-40"
          />
          <p>Keine ausstehenden Konten.</p>
        </div>
      </div>
    </div>

    <!-- Create user modal -->
    <UModal
      v-model:open="createOpen"
      title="Neuen Benutzer erstellen"
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            color="warning"
            variant="soft"
            icon="i-lucide-info"
            description="Admin-erstellte Konten müssen beim ersten Login ein neues Passwort vergeben."
          />
          <UFormField
            label="Benutzername"
            name="username"
          >
            <UInput
              v-model="createState.username"
              placeholder="Benutzername"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Temporäres Passwort"
            name="password"
          >
            <UInput
              v-model="createState.password"
              type="password"
              placeholder="Mindestens 8 Zeichen"
              class="w-full"
            />
          </UFormField>
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
            @click="createOpen = false"
          >
            Abbrechen
          </UButton>
          <UButton
            :loading="createLoading"
            @click="createUser"
          >
            Erstellen
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Edit username modal -->
    <UModal
      v-model:open="editOpen"
      title="Benutzername bearbeiten"
    >
      <template #body>
        <UFormField
          label="Neuer Benutzername"
          name="username"
        >
          <UInput
            v-model="editUsername"
            placeholder="Benutzername"
            class="w-full"
            @keydown.enter="saveUsername"
          />
        </UFormField>
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
            @click="saveUsername"
          >
            Speichern
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete confirm modal -->
    <UModal
      v-model:open="deleteOpen"
      title="Benutzer löschen"
    >
      <template #body>
        <p class="text-default">
          Möchtest du den Benutzer
          <span class="font-semibold">{{ deleteTarget?.username }}</span>
          wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
      </template>
      <template #footer>
        <div class="flex gap-3 justify-end w-full">
          <UButton
            variant="ghost"
            color="neutral"
            @click="deleteOpen = false"
          >
            Abbrechen
          </UButton>
          <UButton
            color="error"
            :loading="deleteLoading"
            @click="confirmDelete"
          >
            Löschen
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Score adjustment modal -->
    <UModal
      v-model:open="adjOpen"
      :title="`Punktekorrektur – ${adjTarget?.username}`"
    >
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormField
              label="Betrag"
              name="amount"
            >
              <UInput
                v-model.number="adjState.amount"
                type="number"
                placeholder="z.B. -5 oder +10"
                class="w-full"
              />
            </UFormField>
            <div class="flex items-end pb-1">
              <p class="text-xs text-muted">
                Positiv = Bonus<br>Negativ = Abzug
              </p>
            </div>
          </div>
          <UFormField
            label="Begründung"
            name="reason"
          >
            <UInput
              v-model="adjState.reason"
              placeholder="Grund für die Korrektur"
              class="w-full"
            />
          </UFormField>
          <UAlert
            v-if="adjError"
            color="error"
            variant="soft"
            :description="adjError"
            icon="i-lucide-circle-alert"
          />

          <!-- History -->
          <div
            v-if="adjHistory?.length"
            class="pt-2"
          >
            <p class="text-xs font-semibold uppercase tracking-wider text-dimmed mb-2">
              Verlauf
            </p>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              <div
                v-for="adj in adjHistory"
                :key="adj.id"
                class="flex items-start gap-2 text-sm"
              >
                <UBadge
                  :label="adj.amount > 0 ? `+${adj.amount}` : String(adj.amount)"
                  :color="adj.amount > 0 ? 'success' : 'error'"
                  variant="soft"
                  size="xs"
                  class="shrink-0 mt-0.5"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-default truncate">
                    {{ adj.reason }}
                  </p>
                  <p class="text-xs text-dimmed">
                    {{ formatDate(adj.createdAt) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else-if="!adjHistoryLoading"
            class="text-xs text-dimmed"
          >
            Noch keine Korrekturen vorhanden.
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 justify-end w-full">
          <UButton
            variant="ghost"
            color="neutral"
            @click="adjOpen = false"
          >
            Schließen
          </UButton>
          <UButton
            :loading="adjLoading"
            @click="saveAdjustment"
          >
            Korrektur speichern
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
