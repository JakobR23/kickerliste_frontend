<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { navigateTo } from '#imports'
import { useAuthStore } from '~/composables/useAuthStore'
import { useApi } from '~/composables/useApi'

definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const api = useApi()

const state = reactive({ currentPassword: '', newPassword: '', newPasswordConfirm: '' })
const errorMsg = ref('')
const loading = ref(false)

const isForced = computed(() => auth.mustChangePassword.value)

async function onSubmit() {
  if (state.newPassword !== state.newPasswordConfirm) {
    errorMsg.value = 'Die neuen Passwörter stimmen nicht überein.'
    return
  }
  if (state.newPassword.length < 8) {
    errorMsg.value = 'Das neue Passwort muss mindestens 8 Zeichen lang sein.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await api.changePassword({
      currentPassword: state.currentPassword,
      newPassword: state.newPassword
    })
    auth.setToken(res.token)
    await navigateTo('/')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    if (err.status === 422) {
      errorMsg.value = 'Das aktuelle Passwort ist falsch.'
    } else {
      errorMsg.value = err.data?.message ?? 'Passwortänderung fehlgeschlagen.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-sm">
    <template #header>
      <div>
        <h1 class="text-xl font-semibold text-(--ui-text)">
          Passwort ändern
        </h1>
        <p v-if="isForced" class="text-sm text-(--ui-text-muted) mt-1">
          Bitte lege ein neues Passwort fest, bevor du fortfährst.
        </p>
      </div>
    </template>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <UFormField label="Aktuelles Passwort" name="currentPassword">
        <UInput
          v-model="state.currentPassword"
          type="password"
          placeholder="Aktuelles Passwort"
          autocomplete="current-password"
          required
          class="w-full"
        />
      </UFormField>

      <UFormField label="Neues Passwort" name="newPassword">
        <UInput
          v-model="state.newPassword"
          type="password"
          placeholder="Mindestens 8 Zeichen"
          autocomplete="new-password"
          required
          class="w-full"
        />
      </UFormField>

      <UFormField label="Neues Passwort wiederholen" name="newPasswordConfirm">
        <UInput
          v-model="state.newPasswordConfirm"
          type="password"
          placeholder="Passwort wiederholen"
          autocomplete="new-password"
          required
          class="w-full"
        />
      </UFormField>

      <UAlert
        v-if="errorMsg"
        color="error"
        variant="soft"
        :description="errorMsg"
        icon="i-lucide-circle-alert"
      />

      <UButton type="submit" :loading="loading" block class="mt-2">
        Passwort speichern
      </UButton>
    </form>
  </UCard>
</template>
