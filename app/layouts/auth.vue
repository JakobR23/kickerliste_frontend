<script setup lang="ts">
const colorMode = useColorMode()
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-(--ui-bg) p-4">
    <!-- Theme toggle -->
    <div class="absolute top-4 right-4">
      <UButton
        :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
      />
    </div>

    <!-- Logo -->
    <div class="flex items-center gap-2 mb-8">
      <UIcon name="i-lucide-zap" class="w-8 h-8 text-amber-500" />
      <span class="font-bold text-2xl text-(--ui-text)">Kickerliste</span>
    </div>

    <slot />

    <p class="mt-8 text-xs text-(--ui-text-dimmed)">
      Büro-Kicker Ergebnisverfolgung
    </p>
  </div>
</template>
