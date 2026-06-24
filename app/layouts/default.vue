<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useColorMode, useRoute, navigateTo } from '#imports'
import { useAuthStore } from '~/composables/useAuthStore'
import { usePendingUsers } from '~/composables/usePendingUsers'

const auth = useAuthStore()
const { pendingCount, refreshPendingCount } = usePendingUsers()
const colorMode = useColorMode()
const route = useRoute()

const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)

const navItems = [
  { icon: 'i-lucide-trophy', label: 'Rangliste', to: '/' },
  { icon: 'i-lucide-calendar-days', label: 'Spielpläne', to: '/fixtures' },
  { icon: 'i-lucide-users', label: 'Teams', to: '/teams' },
  { icon: 'i-lucide-bar-chart-2', label: 'Statistik', to: '/statistics' }
]

const adminNavItems = [
  { icon: 'i-lucide-clipboard-check', label: 'Spielverwaltung', to: '/admin/fixtures' },
  { icon: 'i-lucide-user-cog', label: 'Benutzerverwaltung', to: '/admin/users' }
]

onMounted(async () => {
  if (auth.isAdmin.value) {
    await refreshPendingCount()
  }
})

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function logout() {
  auth.clear()
  await navigateTo('/login')
}

watch(route, () => {
  sidebarOpen.value = false
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-default text-default">
    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-20 bg-black/60 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed lg:relative z-30 flex flex-col h-screen',
        'border-r border-default',
        'bg-elevated',
        'transition-all duration-300 ease-in-out',
        'w-64',
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-64',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <!-- Logo -->
      <div
        :class="[
          'flex items-center gap-3 px-4 py-4 border-b border-default shrink-0',
          sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''
        ]"
      >
        <UIcon
          name="i-lucide-zap"
          class="w-6 h-6 text-amber-500 shrink-0"
        />
        <span
          :class="['font-bold text-lg truncate transition-all duration-300', sidebarCollapsed ? 'lg:hidden' : '']"
        >
          Kickerliste
        </span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <!-- Main items -->
        <template
          v-for="item in navItems"
          :key="item.to"
        >
          <NuxtLink
            :to="item.to"
            :title="sidebarCollapsed ? item.label : undefined"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
              sidebarCollapsed ? 'lg:justify-center lg:px-0' : '',
              isActive(item.to)
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'text-muted hover:bg-accented hover:text-default'
            ]"
          >
            <UIcon
              :name="item.icon"
              class="w-5 h-5 shrink-0"
            />
            <span :class="['truncate', sidebarCollapsed ? 'lg:hidden' : '']">{{ item.label }}</span>
          </NuxtLink>
        </template>

        <!-- Admin section -->
        <template v-if="auth.isAdmin.value">
          <div class="pt-4 pb-1">
            <p
              :class="[
                'px-3 text-xs font-semibold uppercase tracking-wider text-dimmed',
                sidebarCollapsed ? 'lg:hidden' : ''
              ]"
            >
              Administration
            </p>
            <div
              v-if="sidebarCollapsed"
              class="hidden lg:block mx-3 mt-2 border-t border-default"
            />
          </div>

          <template
            v-for="item in adminNavItems"
            :key="item.to"
          >
            <NuxtLink
              :to="item.to"
              :title="sidebarCollapsed ? item.label : undefined"
              :class="[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                sidebarCollapsed ? 'lg:justify-center lg:px-0' : '',
                isActive(item.to)
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'text-muted hover:bg-accented hover:text-default'
              ]"
            >
              <UIcon
                :name="item.icon"
                class="w-5 h-5 shrink-0"
              />
              <span :class="['truncate', sidebarCollapsed ? 'lg:hidden' : '']">{{ item.label }}</span>
              <UBadge
                v-if="item.to === '/admin/users' && pendingCount > 0 && !sidebarCollapsed"
                :label="String(pendingCount)"
                color="warning"
                variant="solid"
                size="xs"
                class="ml-auto shrink-0"
              />
            </NuxtLink>
          </template>
        </template>
      </nav>

      <!-- Bottom section -->
      <div class="border-t border-default p-2 space-y-0.5 shrink-0">
        <!-- Color mode toggle -->
        <button
          :title="sidebarCollapsed ? (colorMode.value === 'dark' ? 'Hellmodus' : 'Dunkelmodus') : undefined"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium w-full',
            sidebarCollapsed ? 'lg:justify-center lg:px-0' : '',
            'text-muted hover:bg-accented hover:text-default'
          ]"
          @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
        >
          <UIcon
            :name="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
            class="w-5 h-5 shrink-0"
          />
          <span :class="['truncate', sidebarCollapsed ? 'lg:hidden' : '']">
            {{ colorMode.value === 'dark' ? 'Hellmodus' : 'Dunkelmodus' }}
          </span>
        </button>

        <!-- Profile link -->
        <NuxtLink
          to="/profile"
          :title="sidebarCollapsed ? (auth.claims.value?.username ?? 'Profil') : undefined"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
            sidebarCollapsed ? 'lg:justify-center lg:px-0' : '',
            isActive('/profile')
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              : 'text-muted hover:bg-accented hover:text-default'
          ]"
        >
          <UAvatar
            :alt="auth.claims.value?.username ?? '?'"
            size="xs"
            class="shrink-0 ring-1 ring-default"
          />
          <span :class="['truncate', sidebarCollapsed ? 'lg:hidden' : '']">
            {{ auth.claims.value?.username }}
          </span>
        </NuxtLink>

        <!-- Logout -->
        <button
          :title="sidebarCollapsed ? 'Abmelden' : undefined"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium w-full',
            sidebarCollapsed ? 'lg:justify-center lg:px-0' : '',
            'text-muted hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400'
          ]"
          @click="logout"
        >
          <UIcon
            name="i-lucide-log-out"
            class="w-5 h-5 shrink-0"
          />
          <span :class="['truncate', sidebarCollapsed ? 'lg:hidden' : '']">Abmelden</span>
        </button>

        <!-- Collapse toggle — desktop only -->
        <button
          :class="[
            'hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium w-full',
            sidebarCollapsed ? 'justify-center px-0' : '',
            'text-dimmed hover:bg-accented hover:text-default'
          ]"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <UIcon
            :name="sidebarCollapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-left'"
            class="w-5 h-5 shrink-0"
          />
          <span
            v-if="!sidebarCollapsed"
            class="truncate"
          >Einklappen</span>
        </button>
      </div>
    </aside>

    <!-- Main content area -->
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <!-- Mobile top bar -->
      <header class="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-default bg-elevated shrink-0">
        <UButton
          icon="i-lucide-menu"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="sidebarOpen = !sidebarOpen"
        />
        <UIcon
          name="i-lucide-zap"
          class="w-5 h-5 text-amber-500"
        />
        <span class="font-bold text-base">Kickerliste</span>
        <div class="flex-1" />
        <UButton
          :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
        />
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto">
        <div class="flex flex-col min-h-full">
          <div class="flex-1">
            <slot />
          </div>
          <AppFooter />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
