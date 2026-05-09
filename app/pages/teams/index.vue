<script setup lang="ts">
import { ref } from 'vue'
import { useAsyncData, useToast } from '#imports'
import { useApi } from '~/composables/useApi'
import type { Team } from '~/types/api'

const api = useApi()
const toast = useToast()

const { data: teams, pending, error, refresh } = useAsyncData<Team[]>(
  'teams-list',
  () => api.getTeams()
)

const createModalOpen = ref(false)
const newTeamName = ref('')
const createLoading = ref(false)

async function createTeam() {
  createLoading.value = true
  try {
    await api.createTeam({ name: newTeamName.value.trim() || null })
    toast.add({ title: 'Team erstellt', color: 'success', icon: 'i-lucide-check-circle' })
    newTeamName.value = ''
    createModalOpen.value = false
    await refresh()
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
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
        <UFormField
          label="Teamname"
          name="name"
        >
          <UInput
            v-model="newTeamName"
            placeholder="Name (optional)"
            class="w-full"
            @keydown.enter="createTeam"
          />
        </UFormField>
        <p class="text-xs text-muted mt-2">
          Leer lassen für ein namenloses Team.
        </p>
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
            @click="createTeam"
          >
            Erstellen
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
