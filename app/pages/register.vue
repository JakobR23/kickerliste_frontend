<script setup lang="ts">
import { reactive, ref } from 'vue'
import { navigateTo } from '#imports'
import { useApi } from '~/composables/useApi'

definePageMeta({ layout: 'auth' })

const api = useApi()

const state = reactive({ username: '', password: '', passwordConfirm: '' })
const errorMsg = ref('')
const loading = ref(false)

async function onSubmit() {
  if (state.password !== state.passwordConfirm) {
    errorMsg.value = 'Die Passwörter stimmen nicht überein.'
    return
  }
  if (state.password.length < 8) {
    errorMsg.value = 'Das Passwort muss mindestens 8 Zeichen lang sein.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    await api.register({ username: state.username, password: state.password })
    await navigateTo('/login?pending=true')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    if (err.status === 409) {
      errorMsg.value = 'Dieser Benutzername ist bereits vergeben.'
    } else if (err.status === 500) {
      errorMsg.value = 'Serverfehler. Bitte erneut versuchen.'
    } else {
      errorMsg.value = err.data?.message ?? 'Registrierung fehlgeschlagen.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-sm">
    <template #header>
      <h1 class="text-xl font-semibold text-default">
        Registrieren
      </h1>
    </template>

    <form
      class="space-y-4"
      @submit.prevent="onSubmit"
    >
      <UFormField
        label="Benutzername"
        name="username"
      >
        <UInput
          v-model="state.username"
          placeholder="Benutzername"
          autocomplete="username"
          required
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Passwort"
        name="password"
      >
        <UInput
          v-model="state.password"
          type="password"
          placeholder="Mindestens 8 Zeichen"
          autocomplete="new-password"
          required
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Passwort wiederholen"
        name="passwordConfirm"
      >
        <UInput
          v-model="state.passwordConfirm"
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

      <UButton
        type="submit"
        :loading="loading"
        block
        class="mt-2"
      >
        Konto erstellen
      </UButton>
    </form>

    <template #footer>
      <p class="text-sm text-center text-muted">
        Bereits ein Konto?
        <NuxtLink
          to="/login"
          class="text-amber-500 hover:text-amber-400 font-medium"
        >
          Anmelden
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>
