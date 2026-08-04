# Tulas Island V3 – Core Refactor

> **Historischer Refactor-Plan:** Die Kernsanierung wurde später abgeschlossen. Maßgeblich sind [NOW.md](NOW.md), [ARCHITECTURE.md](ARCHITECTURE.md) und [RELEASE_PHASE_1_1.md](../RELEASE_PHASE_1_1.md).

## Ziel

Die bisherige MVP-Struktur wird schrittweise durch einen zentralen, testbaren Anwendungskern ersetzt. Die öffentliche App auf `main` bleibt während der Migration unverändert.

## Neuer Core

- `core/storage.js` – sichere, versionierte Speicherung und Migration
- `core/store.js` – einziger zentraler State Store
- `core/router.js` – explizite Screen-Navigation
- `core/events.js` – ein delegierter Action-Handler
- `core/audio.js` – zentrale Sprachausgabe
- `core/rewards.js` – XP-, Muschel- und Boosterlogik
- `core/legacy-migration.js` – Übernahme vorhandener V3-Spielstände

## Bereits migriert

- Home
- Inselübersicht
- Lernweltübersicht
- Sprachwechsel
- Fortschrittsanzeige
- Auswahl der Lernwelt

## Nächste Migrationen

1. Wörter entdecken
2. Hör-Abenteuer
3. Satzwerkstatt mit Pointer Events
4. Shop und Inventar
5. Profil und Kinderprofile
6. Memory und Goldene Minute
7. Tagesmissionen und Erfolge
8. Hafen und Schloss
9. Tulas Zuhause
10. Sprechtrainer und Geschichten

## Abnahmekriterien

- keine MutationObserver für Screen-Navigation
- keine globalen, konkurrierenden Click-Listener
- keine Erkennung von Routen über sichtbaren Text
- alle Belohnungen ausschließlich über `rewards.js`
- alle Audioausgaben ausschließlich über `audio.js`
- alle Speicheränderungen ausschließlich über `store.js`
- jeder Screen besitzt genau eine definierte Renderfunktion
- bestehender Spielstand wird automatisch migriert
