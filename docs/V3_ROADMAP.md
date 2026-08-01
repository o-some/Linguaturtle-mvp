# LinguaTurtle 3.0 – Turtle Island

## Ziel

LinguaTurtle wird von einer klassischen Lern-App zu einer modularen, illustrierten Sprachlernwelt für Kinder weiterentwickelt. Die öffentliche Version auf `main` bleibt stabil. Entwicklung erfolgt über `develop` und Feature-Branches.

## Git-Workflow

- `main`: öffentliche, stabile GitHub-Pages-Version
- `develop`: integrierte nächste Version
- `feature/*`: einzelne Funktionen und Design-Meilensteine

## Meilensteine

### M1 – Fundament
- Design Tokens für Marineblau, Weiß und Gold
- Asset-Manifest statt hart codierter Emojis
- Screen-, Game- und Reward-Module
- konfigurierbare Feature Flags
- zentraler Audio- und Animation-Adapter

### M2 – Turtle Island
- Insel als Hauptnavigation
- Bibliothek, Wald, Garten, Hafen, Boutique, Zuhause und Schloss
- animierte Hotspots
- responsive Smartphone- und Tablet-Version

### M3 – Tula Character System
- einheitliches Character Sheet
- Posen: winken, lesen, jubeln, denken, schlafen, laufen, schwimmen
- Expressions und Outfit-Slots
- Fallback-Grafiken, solange Illustrationen fehlen

### M4 – Lernspiele
- Satzwerkstatt
- Hör-Abenteuer
- Wort-Magie
- Memory
- Goldene Minute
- Geschichtenmodus
- Schatzsuche
- Puzzle

### M5 – Audio und Atmosphäre
- Umgebungsgeräusche
- Musik pro Welt
- Audioeinstellungen
- Vorproduktion wichtiger Lernwörter

### M6 – Mobile
- Capacitor
- iOS und Android
- Offline-Pakete
- native Mikrofon- und Audiofunktionen

## Qualitätsregeln

- keine Lerninhalte direkt in UI-Komponenten
- neue Spiele als eigenständige Module
- keine Kaufaufforderungen im Kinderbereich
- Animationen abschaltbar
- alle Funktionen mit Touch nutzbar
- öffentliche Version wird nur nach Prüfung aktualisiert
