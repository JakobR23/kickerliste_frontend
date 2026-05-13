<script setup lang="ts">
definePageMeta({ layout: 'auth' })

useSeoMeta({ title: 'Konto ausstehend – Kickerliste' })
</script>

<template>
  <UCard class="w-full max-w-sm text-center">
    <template #header>
      <div class="flex flex-col items-center gap-3 pt-2">
        <div class="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center">
          <UIcon
            name="i-lucide-clock"
            class="w-6 h-6 text-amber-500"
          />
        </div>
        <h1 class="text-xl font-semibold text-default">
          Konto wird geprüft
        </h1>
      </div>
    </template>

    <div class="space-y-3 text-sm text-muted">
      <p>
        Dein Konto wurde erfolgreich erstellt und wartet auf die Aktivierung durch einen Administrator.
      </p>
      <p>
        Sobald dein Konto freigeschaltet wurde, kannst du dich anmelden.
      </p>
    </div>

    <template #footer>
      <UButton
        to="/login"
        variant="soft"
        color="neutral"
        block
      >
        Zur Anmeldung
      </UButton>
    </template>
  </UCard>
</template>
