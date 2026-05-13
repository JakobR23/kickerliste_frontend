<template>
  <footer class="border-t border-default px-6 py-4 shrink-0">
    <div class="flex items-center justify-center gap-5 text-xs text-dimmed">
      <NuxtLink
        to="/impressum"
        class="hover:text-default transition-colors"
      >
        Impressum
      </NuxtLink>
      <span aria-hidden="true">·</span>
      <NuxtLink
        to="/datenschutz"
        class="hover:text-default transition-colors"
      >
        Datenschutzerklärung
      </NuxtLink>
    </div>
  </footer>
</template>
