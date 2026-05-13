<script setup lang="ts">
definePageMeta({ layout: 'auth' })

useSeoMeta({ title: 'Impressum – Kickerliste' })
</script>

<template>
  <UCard class="w-full max-w-2xl">
    <template #header>
      <div class="flex items-center gap-3">
        <UButton
          icon="i-lucide-arrow-left"
          variant="ghost"
          color="neutral"
          size="sm"
          to="/"
        />
        <h1 class="text-xl font-bold text-default">
          Impressum
        </h1>
      </div>
    </template>

    <div class="prose prose-sm dark:prose-invert max-w-none space-y-6 text-default">
      <section>
        <p class="text-xs text-dimmed uppercase tracking-wider font-semibold mb-2">
          Angaben gemäß § 5 DDG
        </p>
        <p>
          <strong>[Firmenname / Betreiber]</strong><br>
          [Straße Hausnummer]<br>
          [PLZ Ort]<br>
          Deutschland
        </p>
      </section>

      <USeparator />

      <section>
        <p class="font-semibold text-default mb-1">
          Vertreten durch
        </p>
        <p>[Vor- und Nachname des Verantwortlichen]</p>
      </section>

      <USeparator />

      <section>
        <p class="font-semibold text-default mb-1">
          Kontakt
        </p>
        <p>
          E-Mail: <a
            href="mailto:[email@example.com]"
            class="text-amber-500 hover:underline"
          >[email@example.com]</a><br>
          Telefon: [+49 xxx xxxxxxx]
        </p>
      </section>

      <USeparator />

      <section>
        <p class="font-semibold text-default mb-1">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </p>
        <p>
          [Vor- und Nachname]<br>
          [Straße Hausnummer]<br>
          [PLZ Ort]
        </p>
      </section>

      <USeparator />

      <section>
        <p class="font-semibold text-default mb-2">
          EU-Streitschlichtung
        </p>
        <p class="text-sm text-muted">
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-amber-500 hover:underline"
          >
            https://ec.europa.eu/consumers/odr/
          </a>.<br>
          Unsere E-Mail-Adresse finden Sie oben im Impressum.
        </p>
      </section>

      <section>
        <p class="font-semibold text-default mb-2">
          Verbraucherstreitbeilegung / Universalschlichtungsstelle
        </p>
        <p class="text-sm text-muted">
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>
    </div>
  </UCard>
</template>
