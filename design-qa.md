# Design QA — Cinematic Island Welcome

## Vergleichsziel

- Ausgewähltes Source Visual: `design-reference/option-1-cinematic-island-welcome.png`
- Browser-Implementation: `design-qa-evidence/implementation-final-390x844.png`
- Gemeinsamer Full-view-Vergleich: `design-qa-evidence/comparison-final-full.png`
- Responsive Nachweise: `design-qa-evidence/implementation-responsive-360x800.png` und `design-qa-evidence/implementation-responsive-430x932.png`
- Geprüfter State: deutsche Oberfläche, Profilname „Kind“, Sprachpaar DE → ES, 5000 Muscheln, Level 1, Tagesziel 0/3
- CSS-Viewport der Hauptprüfung: 390 × 844 px bei DPR 1
- Source Visual: 852 × 1846 px, proportional auf 390 × 844 CSS-Pixel normalisiert
- Browser-Screenshot: 375 × 812 px; die Abweichung vom CSS-Viewport entsteht durch Scrollbar und In-App-Browser-Chrome
- Gemeinsames Vergleichsbild: 780 × 844 px; beide Ansichten sind proportional auf dieselbe Höhe normalisiert

Ein zusätzlicher Focus-Crop war nicht erforderlich: Im gemeinsamen Vergleich sind Header, Headline, CTA, Figur, Tagesziel und alle fünf Navigationseinträge in Originalgröße lesbar und visuell eindeutig beurteilbar.

## Vergleichshistorie

### Iteration 1

- [P1] Die alte Startseite bestand aus mehreren gleichgewichteten Karten und hatte keinen klaren, emotionalen Fokus.
- [P1] Das vorhandene Inselbild trug die UI nicht als vollflächige Szene; die Oberfläche wirkte eher wie ein Dashboard als wie ein Spiel.
- [P2] Die Navigation verwendete uneinheitliche Bildzeichen und hatte keine ausreichend starke aktive Markierung.
- [P2] Tula, Tagesziel und „Weiterlernen“ lagen in getrennten Karten und bildeten keine gemeinsame Blickführung.

Fixes:

- Neues, textfreies Cinematic-Island-Hintergrundbild mit Hütte, Bucht, Weg und gezielt freigehalteter Textzone erstellt.
- Home als vollflächige Szene neu aufgebaut; Begrüßung, nächstes Abenteuer und Haupt-CTA bilden jetzt eine klare Hierarchie.
- Bestehende Tula-Waving-Grafik groß und fokal passend über der Szene positioniert.
- Tagesziel, Streak, Level und Inselvorschau in ein kompaktes, halbtransparentes Fortschrittspanel zusammengeführt.
- Bottom Navigation auf lokal eingebundene Phosphor-Icons mit Marine-/Gold-Zuständen umgestellt.

### Iteration 2

- [P2] Beim ersten Browser-Pass war das Fortschrittspanel zu eng gerastert; einzelne Metadaten wirkten gedrängt.
- [P2] Tula saß zu hoch und konkurrierte stärker als im Source Visual mit CTA und Hütte.

Fixes:

- Zielpanel-Raster, Metadatenbreiten und Fortschrittszeile neu ausbalanciert.
- Tula tiefer gesetzt und die Figurengröße für 360, 390 und 430 px Breite abgestimmt.
- CTA, Figur und Hintergrundfokus so angeordnet, dass der Weg zur Figur führt und die Hütte sichtbar bleibt.

Post-fix evidence:

- Der gemeinsame Full-view-Vergleich zeigt dieselbe primäre Blickfolge wie das Source Visual: Begrüßung → CTA → Tula → Tagesziel → Navigation.
- Auf 360 × 800, 390 × 844 und 430 × 932 px gibt es keinen horizontalen Überlauf und keine abgeschnittenen Bedienelemente.
- Die generierte Szene bleibt auf allen drei Breiten scharf, proportional und fokal passend.
- Die visuelle Abweichung beim Profilnamen ist absichtlich datengetrieben: Die App zeigt den tatsächlich gespeicherten Profilnamen statt des Mockup-Namens „Sofia“.
- Der Tageszielwert ist ebenfalls echter State und bleibt deshalb bei 0/3 statt des statischen Mockup-Werts 2/3.

## Fidelity-Prüfung

- Typografie: kräftige Serif-Headline, goldene Eyebrows und kompakte UI-Schrift entsprechen der ausgewählten Richtung.
- Layout: Header, linke Textzone, große Tula-Figur, unteres Fortschrittspanel und feste Navigation folgen der Source-Komposition.
- Farben: tiefes Marineblau, warmes Gold, Türkis und das Grün der Figur sind konsistent.
- Bildqualität: Das Hintergrundbild ist ein eigens erzeugtes WebP-Asset; Tula, Rewards und Inselkarte verwenden echte bestehende Bildassets.
- Icons: Navigation und Pfeile nutzen lokal vendorte Phosphor-Icons statt Textzeichen oder CSS-Zeichnungen.
- Copy: Begrüßung, CTA und Statuswerte sind dynamisch; Deutsch, Spanisch, Griechisch und Englisch wurden geprüft.
- Accessibility: Navigation und Bildbuttons besitzen zugängliche Labels; Fokuszustände und Reduced Motion sind berücksichtigt.

## Primäre Interaktionen

- „Weiterlernen“ öffnet die aktuelle Garten-Lernwelt und zeigt fünf Lernmodi.
- Die Inselvorschau öffnet die Inselkarte mit acht Hotspots und drei besonderen Abenteuern.
- Die fünf Navigationseinträge bleiben erreichbar und zeigen einen eindeutigen aktiven Zustand.
- Browserkonsole: keine Warnungen oder Fehler.
- Horizontaler Überlauf: 0 px auf allen geprüften Breiten.

## Automatisierte Prüfung

- `npm run check:syntax`: bestanden.
- Architekturprüfung: bestanden.
- Playwright Mobile Chrome und Mobile Safari: 32/32 Tests bestanden.
- Sprachpaar- und Lokalisierungstests für DE, ES, EL und EN: bestanden.
- `git diff --check`: vor finalem Commit erneut auszuführen.

## Findings

Keine verbleibenden P0-, P1- oder P2-Befunde. Source Visual und Browser-Implementierung wurden im gemeinsamen Full-view-Vergleich beurteilt; die Hauptinteraktionen wurden im Browser ausgeführt und die responsive Darstellung auf drei mobilen Viewports geprüft.

final result: passed
