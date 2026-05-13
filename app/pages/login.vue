<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { navigateTo, useRoute } from '#imports'
import { useAuthStore } from '~/composables/useAuthStore'
import { useApi } from '~/composables/useApi'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const auth = useAuthStore()
const api = useApi()

const state = reactive({ username: '', password: '' })
const errorMsg = ref('')
const loading = ref(false)

const pendingActivation = computed(() => route.query.pending === 'true')

async function onSubmit() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await api.login(state)
    auth.setToken(res.token)
    if (auth.mustChangePassword.value) {
      await navigateTo('/change-password')
    } else {
      await navigateTo('/')
    }
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, status?: number }
    if (err.status === 403) {
      errorMsg.value = 'Dein Konto wurde noch nicht aktiviert. Bitte warte auf die Freigabe durch einen Administrator.'
    } else if (err.status === 500) {
      errorMsg.value = 'Serverfehler. Bitte erneut versuchen.'
    } else {
      errorMsg.value = err.data?.message ?? 'Anmeldung fehlgeschlagen.'
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
        Anmelden
      </h1>
    </template>

    <UAlert
      v-if="pendingActivation"
      color="info"
      variant="soft"
      icon="i-lucide-clock"
      title="Konto wird aktiviert"
      description="Deine Registrierung war erfolgreich. Ein Administrator muss dein Konto noch freischalten, bevor du dich anmelden kannst."
      class="mb-4"
    />

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
          placeholder="Passwort"
          autocomplete="current-password"
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
        Anmelden
      </UButton>
    </form>

    <template #footer>
      <p class="text-sm text-center text-muted">
        Noch kein Konto?
        <NuxtLink
          to="/register"
          class="text-amber-500 hover:text-amber-400 font-medium"
        >
          Registrieren
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>
