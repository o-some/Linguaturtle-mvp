# Architektur

Tulas Island ist eine mit Vite gebaute, local-first Web-App und wird mit Capacitor als iOS- und Android-App ausgeliefert. Der Gastmodus benötigt kein Backend. Echtgeld-Wallet und kaufbare Inhalte setzen ein Elternkonto voraus und sind serverautoritativ.

## Aktuelle Module

- `src/v3/core/store.js`: einziger Laufzeit-Store
- `src/v3/core/storage.js`: lokale Speicherung, Migration und Cloud-Serialisierung
- `src/v3/core/account.js`: Supabase Auth, Cloud-Repository, Offline-Warteschlange und Konflikterkennung
- `src/v3/core/economy.js`: Wallet-Cache, serverseitige Ausgaben, Store-Käufe, Kauf-Synchronisierung und Rewarded Ads
- `src/v3/core/parent-gate.js`: zeitlich begrenzte Elternfreigabe; Kinderwerbung verlangt jede Sitzung erneut
- `src/v3/screens/`: Routen und Oberflächen
- `android/` und `ios/`: Capacitor-Projekte und native Store-/Kidoz-Brücken
- `supabase/`: Fortschritt, Wallet/Ledger, RLS, Kaufprüfung und Store-Webhooks
- `sw.js`: Offline-Laufzeitcache
- `.github/workflows/pages.yml`: Vite-Build und GitHub-Pages-Veröffentlichung

## Datenfluss

1. Jede Zustandsänderung wird synchron in `localStorage` geschrieben.
2. Nur Profil, Sprachen, nicht monetärer Fortschritt, Einstellungen und nicht kaufbares Inventar werden als generischer Cloud-Payload serialisiert.
3. Ein angemeldetes Elternkonto synchronisiert nach kurzer Verzögerung und bei Start, Fokus oder Wiederverbindung.
4. Eine monotone Cloud-Revision verhindert unbemerkte Last-write-wins-Überschreibungen.
5. Route und laufende Spielsitzung bleiben gerätespezifisch.
6. Lernbelohnungen werden bei Netzproblemen lokal mit einer stabilen Ereignis-ID vorgemerkt. Das Ledger verarbeitet sie idempotent.
7. Store-Transaktionen werden nativ gestartet, serverseitig bei Apple oder Google geprüft und erst anschließend abgeschlossen beziehungsweise konsumiert.

## Sicherheitsgrenzen

- Im Browser liegt ausschließlich der öffentliche Supabase Publishable Key.
- Row Level Security bindet jede Fortschrittszeile an `auth.uid()`.
- Wallet- und Kaufmutationen laufen in atomaren SQL-Funktionen. Preise und Belohnungsmengen werden nicht vom Client übernommen.
- Store-Transaktionskennung, Werbeticket und Gameplay-Ereignis sind eindeutig; Wiederholungen verändern den Kontostand nicht erneut.
- Der native Store zeigt ausschließlich von StoreKit beziehungsweise Play Billing gelieferte, lokalisierte Preise.
- Administrative Auth-Löschung läuft ausschließlich in einer authentifizierten Edge Function.
- Andere Module dürfen weder direkt auf Supabase noch direkt auf `localStorage` zugreifen.

## Plattformgrenzen

- PWA/GitHub Pages: kein Store-Dialog, kein Werbe-SDK.
- iOS: StoreKit 2; Rewarded Ads sind standardmäßig abgeschaltet, bis die Kids-Category-Freigabe des Anbieters dokumentiert ist.
- Android: Google Play Billing; Kidoz wird erst beim freiwilligen Rewarded-Ad-Aufruf initialisiert.
- Apple- und Google-Callbacks korrigieren Rückerstattungen über Gegenbuchungen. Der sichtbare Kontostand bleibt mindestens null, ein interner Rückbuchungsbetrag wird durch spätere Gutschriften ausgeglichen.
