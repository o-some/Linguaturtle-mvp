# Tulas Island

Ein mobil optimierter Sprachlern-Prototyp für Kinder. Die App funktioniert vollständig als Gast, speichert Fortschritt immer zuerst lokal und kann ihn optional über ein Elternkonto mit Supabase synchronisieren.

## Projektkontext

- [Aktueller Stand](docs/NOW.md)
- [Technische Architektur](docs/ARCHITECTURE.md)
- [Schlanker Codex-Workflow](docs/WORKFLOW.md)

Frühere V3-Status- und Roadmap-Dateien sind historische Momentaufnahmen und keine aktuellen Arbeitsaufträge.

## Lokal starten

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ohne ausgefüllte Supabase-Werte bleibt die App im reinen Gastmodus. Build und Vorschau:

```bash
npm run build
npm run preview
```

## Supabase-Backend einrichten

1. Ein Supabase-Projekt in einer passenden EU-Region erstellen.
2. Die Migrationen in `supabase/migrations/` in Dateireihenfolge ausführen oder mit der Supabase CLI deployen.
3. Die Edge Functions `delete-account`, `economy`, `verify-purchase` und `store-webhook` deployen.
4. Project URL und Publishable Key aus den Supabase API-Einstellungen in `.env.local` eintragen. Niemals einen Secret- oder Service-Role-Key in die Web-App eintragen.
5. Unter Authentication die lokalen und veröffentlichten App-URLs als Redirect URLs eintragen.
6. Für den GitHub-Pages-Build die Repository-Variablen `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` anlegen.

Für einen privaten Test reicht der eingebaute Supabase-Mailversand. Vor öffentlichen Tests muss ein eigener SMTP-Dienst konfiguriert werden.

## iOS- und Android-App

Die gemeinsame Oberfläche läuft über Capacitor. Im Browser bleiben Echtgeldkäufe und Werbung vollständig deaktiviert.

```bash
npm run mobile:sync
npm run mobile:ios
npm run mobile:android
```

Die Store-Produkte, Server-Secrets, Sandbox-Konten, Kidoz-Schalter und Webhooks sind in [docs/MOBILE_MONETIZATION.md](docs/MOBILE_MONETIZATION.md) beschrieben. Die iOS-App benötigt Xcode und CocoaPods, Android benötigt Android Studio mit dem passenden SDK.

## Speicherverhalten

- Gast: Lernfortschritt und eine rein lokale Gastwirtschaft bleiben in `localStorage`.
- Angemeldet: Lokale Speicherung bleibt die primäre Speicherung; dauerhafte Felder werden zusätzlich in die Cloud übertragen.
- Echtgeld-Wirtschaft: Wallet, Ledger, Store-Transaktionen und kaufbare Entitlements liegen ausschließlich in den dedizierten Supabase-Tabellen. `progress.shells` ist nur ein UI-Cache.
- Offline: Die App bleibt benutzbar und markiert Änderungen zur späteren Synchronisierung.
- Konflikt: Wenn Gerät und Cloud seit dem letzten Abgleich geändert wurden, muss der Nutzer ausdrücklich einen Stand auswählen.
- Abmelden: Lokale Daten bleiben erhalten.
- Konto löschen: Auth-Konto und Cloud-Daten werden gelöscht; lokale Daten bleiben erhalten, bis der lokale Testfortschritt separat zurückgesetzt wird.

## Qualitätsprüfung

```bash
npm test
```

Der Befehl prüft Syntax, Architekturgrenzen und die mobilen Playwright-Abläufe.
