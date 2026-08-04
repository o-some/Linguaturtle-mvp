# Aktueller Projektstand

Stand: 4. August 2026

## Ziel

Tulas Island ist eine local-first Sprachlern-App für Kinder. Die Web-App läuft mit Vite und browsernativen ES-Modulen; Capacitor stellt dieselbe Oberfläche für iOS und Android bereit. Gastnutzung funktioniert ohne Backend. Elternkonto, Cloud-Synchronisierung und Echtgeld-Wirtschaft verwenden Supabase.

## Umgesetzt

- Zentrale Router-, Store-, Storage-, Audio-, Reward-, Account- und Economy-Module.
- Deutsche, spanische, griechische und englische Oberfläche mit frei wählbarer Sprachrichtung.
- Home, Insel, Bibliothek, Garten, Wortkatalog, Boutique, Profil, Einstellungen und Tulas Zuhause.
- Wortentdeckung, Hör-Abenteuer, Satzwerkstatt, Memory, Goldene Minute, Sprechtrainer und Mini-Geschichten.
- Lokaler Fortschritt, optionale Cloud-Synchronisierung, Konfliktbehandlung und Offline-Warteschlange.
- Tages- und Wochenziele, Streaks, Levelbelohnungen, Übungssterne und Mastery-Sterne.
- Garten-Sternendungeon mit wiederholbaren Belohnungen und Relikt.
- Native Kauf- und Werbegrenzen für iOS und Android; im Browser bleiben Echtgeldkäufe und Werbung deaktiviert.
- Syntax-, Architektur- und Playwright-End-to-End-Prüfungen.

## Nächster Fokus

Ein neuer Produktmeilenstein ist noch nicht festgelegt. Vor der nächsten größeren Erweiterung ist zwischen weiteren Inselorten, zusätzlichen Sternendungeons, echten Audioassets und Release-Härtung zu priorisieren. Bis dahin gelten Fehlerbehebung, Teststabilität und die Pflege der kanonischen Dokumente als laufende Arbeit.

## Offene Punkte und Blocker

- Store-Produkte, Sandbox-Konten, Supabase-Secrets, Webhooks und Anbieterfreigaben müssen vor einem öffentlichen Mobile-Release extern konfiguriert und geprüft werden.
- Die nächste Produktpriorität benötigt eine bewusste Entscheidung.

## Dokumentationsstatus

`ARCHITECTURE.md` ist die technische Quelle der Wahrheit. `V3_ROADMAP.md`, `V3_INTERACTIVE_STATUS.md`, `V3_CORE_REFACTOR.md` und der frühere Gesamtplan sind historische Dokumente. Der token-sparende Codex-Workflow wurde am 4. August 2026 eingerichtet; `npm test` bestand dabei mit 70 End-to-End-Fällen.
