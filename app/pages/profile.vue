<script setup lang="ts">
import type { User, ScoreAdjustment } from '~/types/api'

const auth = useAuthStore()
const api = useApi()
const toast = useToast()

const userId = computed(() => auth.claims.value?.userId ?? 0)

const { data: user } = useAsyncData<User>(
  'profile-user',
  () => api.getUser(userId.value),
  { watch: [userId] }
)

const { data: adjustments } = useAsyncData<ScoreAdjustment[]>(
  'profile-adjustments',
  async () => {
    if (!auth.isAdmin.value) return []
    return api.getAdjustments(userId.value)
  },
  { watch: [userId] }
)

const pwState = reactive({ currentPassword: '', newPassword: '', newPasswordConfirm: '' })
const pwError = ref('')
const pwLoading = ref(false)

async function changePassword() {
  if (pwState.newPassword !== pwState.newPasswordConfirm) {
    pwError.value = 'Die neuen Passwörter stimmen nicht überein.'
    return
  }
  if (pwState.newPassword.length < 8) {
    pwError.value = 'Das neue Passwort muss mindestens 8 Zeichen lang sein.'
    return
  }
  pwLoading.value = true
  pwError.value = ''
  try {
    const res = await api.changePassword({
      currentPassword: pwState.currentPassword,
      newPassword: pwState.newPassword
    })
    auth.setToken(res.token)
    Object.assign(pwState, { currentPassword: '', newPassword: '', newPasswordConfirm: '' })
    toast.add({ title: 'Passwort geändert', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    pwError.value = err.status === 422
      ? 'Das aktuelle Passwort ist falsch.'
      : (err.data?.message ?? 'Fehler beim Ändern des Passworts.')
  } finally {
    pwLoading.value = false
  }
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
  <div class="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
    <div class="flex items-center gap-3 mb-6">
      <UIcon name="i-lucide-user" class="w-6 h-6 text-amber-500" />
      <h1 class="text-2xl font-bold text-(--ui-text)">
        Profil
      </h1>
    </div>

    <!-- User info card -->
    <UCard>
      <div class="flex items-center gap-4">
        <UAvatar
          :alt="user?.username ?? '?'"
          size="lg"
          class="ring-2 ring-(--ui-border)"
        />
        <div class="flex-1 min-w-0">
          <p class="text-xl font-bold text-(--ui-text) truncate">
            {{ user?.username }}
          </p>
          <div class="flex items-center gap-2 mt-1">
            <UBadge
              :label="user?.role === 'admin' ? 'Administrator' : 'Spieler'"
              :color="user?.role === 'admin' ? 'amber' : 'neutral'"
              variant="soft"
            />
          </div>
        </div>
        <div class="text-right flex-shrink-0">
          <p class="text-3xl font-bold text-amber-500 tabular-nums">
            {{ user ? formatScore(user.totalScore) : '–' }}
          </p>
          <p class="text-xs text-(--ui-text-dimmed)">
            Punkte gesamt
          </p>
        </div>
      </div>
    </UCard>

    <!-- Change password -->
    <UCard>
      <template #header>
        <h2 class="font-semibold text-(--ui-text)">
          Passwort ändern
        </h2>
      </template>

      <form class="space-y-4" @submit.prevent="changePassword">
        <UFormField label="Aktuelles Passwort" name="currentPassword">
          <UInput
            v-model="pwState.currentPassword"
            type="password"
            placeholder="Aktuelles Passwort"
            autocomplete="current-password"
            required
            class="w-full"
          />
        </UFormField>
        <UFormField label="Neues Passwort" name="newPassword">
          <UInput
            v-model="pwState.newPassword"
            type="password"
            placeholder="Mindestens 8 Zeichen"
            autocomplete="new-password"
            required
            class="w-full"
          />
        </UFormField>
        <UFormField label="Neues Passwort wiederholen" name="newPasswordConfirm">
          <UInput
            v-model="pwState.newPasswordConfirm"
            type="password"
            placeholder="Passwort wiederholen"
            autocomplete="new-password"
            required
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="pwError"
          color="error"
          variant="soft"
          :description="pwError"
          icon="i-lucide-circle-alert"
        />

        <UButton type="submit" :loading="pwLoading">
          Passwort speichern
        </UButton>
      </form>
    </UCard>

    <!-- Score adjustment history (admin only) -->
    <UCard v-if="auth.isAdmin.value && adjustments?.length">
      <template #header>
        <h2 class="font-semibold text-(--ui-text)">
          Punktekorrekturen
        </h2>
      </template>
      <div class="space-y-2">
        <div
          v-for="adj in adjustments"
          :key="adj.id"
          class="flex items-start gap-3 py-2 border-b border-(--ui-border) last:border-0"
        >
          <UBadge
            :label="adj.amount > 0 ? `+${adj.amount}` : String(adj.amount)"
            :color="adj.amount > 0 ? 'success' : 'error'"
            variant="soft"
            class="flex-shrink-0 mt-0.5"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm text-(--ui-text)">
              {{ adj.reason }}
            </p>
            <p class="text-xs text-(--ui-text-dimmed)">
              {{ formatDate(adj.createdAt) }}
            </p>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
