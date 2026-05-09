// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  ssr: false,

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBaseUrl: 'http://localhost:8080/api/v1'
    }
  },

  experimental: {
    // Prevents duplicate useAppConfig auto-import warning (nitropack vs @nuxt/nitro-server).
    // Safe to disable: this app is SPA-only with no Nitro server routes.
    serverAppConfig: false
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
