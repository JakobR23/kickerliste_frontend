<script setup lang="ts">
definePageMeta({ layout: 'auth' })

useSeoMeta({ title: 'Datenschutzerklärung – Kickerliste' })
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
          Datenschutzerklärung
        </h1>
      </div>
    </template>

    <div class="space-y-6 text-sm text-default">
      <!-- 1. Verantwortlicher -->
      <section>
        <h2 class="font-semibold text-base mb-2">
          1. Verantwortlicher
        </h2>
        <p class="text-muted">
          Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
        </p>
        <p class="mt-2">
          Jakob Rottstegge<br>
          Lippestraße 2<br>
          46395 Bocholt<br>
          E-Mail: <a
            href="mailto:jakob.rottstegge@gmail.com"
            class="text-amber-500 hover:underline"
          >jakob.rottstegge@gmail.com</a>
        </p>
      </section>

      <USeparator />

      <!-- 2. Verarbeitete Daten -->
      <section>
        <h2 class="font-semibold text-base mb-2">
          2. Welche Daten wir verarbeiten
        </h2>
        <p class="text-muted mb-3">
          Im Rahmen der Nutzung dieser Anwendung werden folgende personenbezogene Daten verarbeitet:
        </p>
        <ul class="list-disc list-inside space-y-1 text-muted">
          <li>
            <strong class="text-default">Benutzername</strong> – wird bei der Registrierung festgelegt
            und dient der Identifikation innerhalb der Anwendung.
          </li>
          <li>
            <strong class="text-default">Passwort</strong> – wird ausschließlich als sicherer Hash
            gespeichert; das Klartextpasswort verlässt das Endgerät nur verschlüsselt über HTTPS.
          </li>
          <li>
            <strong class="text-default">Spielergebnisse und Punktestände</strong> – Ergebnisse der
            erfassten Kicker-Partien sowie die daraus berechneten Gesamtpunkte.
          </li>
          <li>
            <strong class="text-default">Authentifizierungstoken (JWT)</strong> – nach dem Login wird
            ein JSON Web Token ausgestellt und im <code>localStorage</code> des Browsers gespeichert.
            Es enthält Benutzer-ID, Benutzernamen und Rolle, ist signiert und läuft nach einer
            festgelegten Frist ab.
          </li>
        </ul>
        <p class="text-muted mt-3">
          Es werden keine Daten an externe Dienste übermittelt. Es wird kein Tracking,
          kein Analytics und es werden keine Werbe-Cookies eingesetzt.
        </p>
      </section>

      <USeparator />

      <!-- 3. Zweck und Rechtsgrundlage -->
      <section>
        <h2 class="font-semibold text-base mb-2">
          3. Zweck der Verarbeitung und Rechtsgrundlage
        </h2>
        <div class="space-y-3 text-muted">
          <p>
            Die Verarbeitung der o.g. Daten dient dem Betrieb einer internen Anwendung zur
            Erfassung und Auswertung von Kicker-Spielergebnissen im betrieblichen Umfeld.
          </p>
          <p>
            Rechtsgrundlage für die Verarbeitung ist
            <strong class="text-default">Art. 6 Abs. 1 lit. b DSGVO</strong>
            (Verarbeitung zur Erfüllung eines Vertrages bzw. zur Durchführung vorvertraglicher
            Maßnahmen) sowie
            <strong class="text-default">Art. 6 Abs. 1 lit. f DSGVO</strong>
            (berechtigtes Interesse des Betreibers am reibungslosen Betrieb eines internen
            Werkzeugs für Mitarbeitende).
          </p>
        </div>
      </section>

      <USeparator />

      <!-- 4. Speicherdauer -->
      <section>
        <h2 class="font-semibold text-base mb-2">
          4. Speicherdauer
        </h2>
        <p class="text-muted">
          Personenbezogene Daten werden gelöscht, sobald der Zweck der Speicherung entfällt –
          spätestens mit Beendigung des Beschäftigungsverhältnisses oder auf Anfrage. Das JWT im
          <code>localStorage</code> ist an den jeweiligen Browser gebunden und kann jederzeit
          manuell über die Browsereinstellungen gelöscht werden.
        </p>
      </section>

      <USeparator />

      <!-- 5. Weitergabe -->
      <section>
        <h2 class="font-semibold text-base mb-2">
          5. Weitergabe an Dritte
        </h2>
        <p class="text-muted">
          Eine Weitergabe personenbezogener Daten an Dritte findet nicht statt. Alle Daten
          verbleiben auf den eigenen Servern des Betreibers.
        </p>
      </section>

      <USeparator />

      <!-- 6. Rechte der betroffenen Personen -->
      <section>
        <h2 class="font-semibold text-base mb-2">
          6. Ihre Rechte
        </h2>
        <p class="text-muted mb-3">
          Sie haben gegenüber dem Verantwortlichen folgende Rechte hinsichtlich Ihrer
          personenbezogenen Daten:
        </p>
        <ul class="space-y-2 text-muted">
          <li>
            <strong class="text-default">Auskunft</strong> (Art. 15 DSGVO) –
            Sie können Auskunft über die zu Ihrer Person gespeicherten Daten verlangen.
          </li>
          <li>
            <strong class="text-default">Berichtigung</strong> (Art. 16 DSGVO) –
            Sie können die Berichtigung unrichtiger Daten verlangen.
          </li>
          <li>
            <strong class="text-default">Löschung</strong> (Art. 17 DSGVO) –
            Sie können die Löschung Ihrer Daten verlangen, sofern keine gesetzlichen
            Aufbewahrungspflichten entgegenstehen.
          </li>
          <li>
            <strong class="text-default">Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO) –
            Sie können die Einschränkung der Verarbeitung Ihrer Daten verlangen.
          </li>
          <li>
            <strong class="text-default">Datenübertragbarkeit</strong> (Art. 20 DSGVO) –
            Sie können verlangen, Ihre Daten in einem strukturierten, maschinenlesbaren Format
            zu erhalten.
          </li>
          <li>
            <strong class="text-default">Widerspruch</strong> (Art. 21 DSGVO) –
            Sie können der Verarbeitung Ihrer Daten widersprechen, sofern diese auf einem
            berechtigten Interesse beruht.
          </li>
        </ul>
        <p class="text-muted mt-3">
          Zur Ausübung Ihrer Rechte wenden Sie sich bitte an die unter Punkt 1 genannte
          Kontaktadresse.
        </p>
      </section>

      <USeparator />

      <!-- 7. Beschwerderecht -->
      <section>
        <h2 class="font-semibold text-base mb-2">
          7. Beschwerderecht bei der Aufsichtsbehörde
        </h2>
        <p class="text-muted">
          Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung
          Ihrer personenbezogenen Daten zu beschweren. Die zuständige Aufsichtsbehörde richtet
          sich nach dem Bundesland des Betreibers. Eine Übersicht aller deutschen
          Aufsichtsbehörden finden Sie unter
          <a
            href="https://www.bfdi.bund.de/DE/Infothek/Anschriften_Links/anschriften_links-node.html"
            target="_blank"
            rel="noopener noreferrer"
            class="text-amber-500 hover:underline"
          >
            bfdi.bund.de
          </a>.
        </p>
      </section>

      <USeparator />

      <!-- 8. Datensicherheit -->
      <section>
        <h2 class="font-semibold text-base mb-2">
          8. Datensicherheit
        </h2>
        <p class="text-muted">
          Die Übertragung von Daten zwischen Browser und Server erfolgt verschlüsselt über HTTPS.
          Passwörter werden serverseitig gehasht gespeichert. Der Zugriff auf die Anwendung ist
          auf authentifizierte Nutzer beschränkt.
        </p>
      </section>

      <USeparator />

      <p class="text-xs text-dimmed">
        Stand: {{ new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) }}
      </p>
    </div>
  </UCard>
</template>
