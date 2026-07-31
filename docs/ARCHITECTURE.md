# Architektur

Der MVP ist als statische, kostenfreie Web-App aufgebaut.

## Aktuelle Module

- `index.html`: App-Einstieg
- `styles.css`: Design-System und responsive Oberfläche
- `app.js`: Lernablauf und lokale Speicherung
- `content/`: sprachunabhängig erweiterbare Lerninhalte
- `manifest.webmanifest`: PWA-Konfiguration
- `sw.js`: Offline-Cache
- `.github/workflows/pages.yml`: automatische Veröffentlichung

## Nächste Modularisierung

1. Inhalte vollständig aus JSON laden.
2. Übungsarten in getrennte Plugin-Module auslagern.
3. Lernfortschritt über ein Repository-Interface kapseln.
4. AudioProvider für Browser- und feste Audiodateien trennen.
5. Später Capacitor für iOS und Android ergänzen.
