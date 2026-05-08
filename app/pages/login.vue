<script setup lang="ts">
import { reactive, ref } from 'vue'
import { navigateTo } from '#imports'
import { useAuthStore } from '~/composables/useAuthStore'
import { useApi } from '~/composables/useApi'

definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const api = useApi()

const state = reactive({ username: '', password: '' })
const errorMsg = ref('')
const loading = ref(false)

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
    const err = e as { data?: { message?: string } }
    errorMsg.value = err.data?.message ?? 'Anmeldung fehlgeschlagen.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-sm">
    <template #header>
      <h1 class="text-xl font-semibold text-(--ui-text)">
        Anmelden
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
      <p class="text-sm text-center text-(--ui-text-muted)">
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
