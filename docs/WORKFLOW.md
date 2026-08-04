# Schlanker Codex-Workflow

## Kontext

1. Jeder Task beginnt mit `AGENTS.md` und `docs/NOW.md`.
2. `docs/ARCHITECTURE.md` wird nur für Architektur-, Speicher-, Konto-, Economy- oder Plattformfragen zusätzlich gelesen.
3. Danach werden ausschließlich die unmittelbar betroffenen Quell- und Testdateien geöffnet.
4. Historische Roadmaps und der alte Gesamtplan sind keine Arbeitsaufträge.

Empfohlener Task-Start:

```text
Lies AGENTS.md und docs/NOW.md. Ziel: …
Akzeptanz: …
Nicht Teil der Aufgabe: …
Öffne danach nur die betroffenen Dateien.
```

## Planung und Abschluss

- Kleine, klar begrenzte Änderungen direkt umsetzen.
- Für risikoreiche oder subsystemübergreifende Änderungen zuerst Plan Mode verwenden.
- Pläne nur unter `docs/plans/YYYY-MM-DD-thema.md` speichern, wenn sie über mehrere Sitzungen gebraucht werden.
- Nach einer materiellen Änderung `docs/NOW.md` aktualisieren und unter 400 Wörtern halten.
- Architekturentscheidungen nur in `ARCHITECTURE.md` dokumentieren; Status nicht in mehreren Dateien duplizieren.

## Ponytail

- Standard: `lite`.
- Normale Implementierung: `@ponytail lite`.
- Gezieltes Refactoring: `@ponytail full`.
- Designvarianten und visuelles Polishing: `@ponytail off`.
- Diff auf Überengineering prüfen: `@ponytail-review`.

Ponytail darf niemals Sicherheitsgrenzen, Barrierefreiheit, Kinderschutz, Datenintegrität oder notwendige Tests wegkürzen.

## Obsidian

Obsidian darf den vorhandenen Repository-Ordner als Vault öffnen. Es werden keine Notizen in einen zweiten Vault kopiert. `.obsidian/` bleibt lokale Benutzeroberflächen-Konfiguration und wird nicht versioniert.

## Graphify-Test

Graphify bleibt „on demand“ und wird nicht als daueraktive Codex-Regel installiert. Erzeugte Daten unter `graphify-out/` werden nicht versioniert.

Für drei echte, subsystemübergreifende Aufgaben:

1. Frage zuerst mit `rg` und den kanonischen Dokumenten beantworten.
2. Graph bei Bedarf lokal erstellen oder aktualisieren:

   ```bash
   graphify extract . --code-only --no-cluster
   graphify query "FRAGE" --budget 1200
   ```

3. In der folgenden Tabelle Dauer, ungefähre Ausgabemenge und fachliche Vollständigkeit festhalten.

| Versuch | Frage | Standard | Graphify | Ergebnis |
| --- | --- | --- | --- | --- |
| 1 | Muschelfluss durch Web, Supabase und native Stores | `rg`: 0,02 s, 908 Wörter, SQL vollständig auffindbar | Index: 2,48 s; Query: 0,12 s, 293 Wörter; relevante Knoten, aber keine vollständige Antwort | Standardsuche gewinnt |
| 2 | offen | offen | offen | offen |
| 3 | offen | offen | offen | offen |

Graphify bleibt nur im Workflow, wenn es bei mindestens zwei Versuchen schneller oder deutlich vollständiger ist, ohne zusätzliche Pflege zu verursachen.
