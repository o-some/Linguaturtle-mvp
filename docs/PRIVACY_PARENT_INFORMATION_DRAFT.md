# Datenschutz- und Elterninformation (Arbeitsfassung)

> Diese Arbeitsfassung beschreibt die technische Implementierung. Vor Veröffentlichung müssen Anbieterangaben, Rechtsgrundlagen, Aufbewahrungsfristen, Kontaktwege und länderspezifische Kinder-Datenschutzanforderungen anwaltlich geprüft und ergänzt werden.

## Für Eltern

Tulas Island kann ohne Konto zum kostenlosen Lernen verwendet werden. Dabei speichert die App Lernfortschritt auf dem Gerät. Ein freiwilliges Elternkonto speichert Lernfortschritt, Muschel-Wallet und freigeschaltete Inhalte zusätzlich bei Supabase. Für das Kinderprofil wird kein exaktes Geburtsdatum erhoben.

Virtuelle Muscheln können erspielt werden. In der iOS- und Android-App können Erwachsene außerdem Verbrauchspakete über den jeweiligen App Store kaufen. Käufe liegen hinter einer Elternaufgabe, gekaufte Muscheln verfallen nicht und es gibt keine zufälligen Belohnungspakete. Apple beziehungsweise Google wickeln die Zahlung ab; Tulas Island prüft die Store-Transaktion serverseitig und speichert Transaktionskennung, Produkt, Status und Muschel-Gutschrift.

Freiwillige Rewarded Ads können 15 Muscheln vergeben, höchstens dreimal innerhalb von 24 Stunden. Kinderprofile benötigen vor jeder Werbesitzung eine Elternfreigabe. Werbung ist kontextuell und nicht personalisiert, erscheint nicht im Lernfluss und verwendet weder ATT-Prompt noch IDFA. Die iOS-Werbung bleibt deaktiviert, bis die Anforderungen der Kids Category nachweislich erfüllt sind.

## Technisch verarbeitete Daten

- Elternkonto: E-Mail-Adresse, Authentifizierungsdaten bei Supabase und Konto-ID
- Lernnutzung: Profilname, gewählte Sprachen, Fortschritt, Einstellungen und freigeschaltete Inhalte
- Wirtschaft: Wallet-Kontostand, unveränderliche Buchungen, Store-Produkt und Store-Transaktionskennung
- Rewarded Ads: Einmalticket, Kinder-/Erwachsenenprofil, Anbieter, Abschlussstatus und Zeitstempel
- Betrieb: technisch notwendige Netzwerk-, Sicherheits- und Fehlerdaten der eingesetzten Hosting-/Store-Anbieter

Nicht vorgesehen sind exaktes Geburtsdatum, Standorttracking, personalisierte Werbeprofile, IDFA oder Werbebanner.

## Eingesetzte Anbieter

- Apple App Store / Google Play für Zahlungen und Store-Transaktionsprüfung
- Supabase für Elternkonto, Cloud-Synchronisierung, Wallet und serverseitige Funktionen
- Kidoz ausschließlich für freiwillige, kontextuelle Rewarded Ads in freigegebenen Mobile-Builds

Vor Release müssen aktuelle Anbieteranschriften, Datenschutzerklärungen, Unterauftragsverarbeiter, Speicherorte und internationale Datentransfers ergänzt und geprüft werden.

## Elternrechte und Kontrollen

Eltern können Cloud-Daten synchronisieren, sich abmelden und das Elternkonto samt Cloud-Daten in der App löschen. Lokale Gerätedaten werden über „Fortschritt zurücksetzen“ separat entfernt. Gesetzliche Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Beschwerde müssen mit dem finalen Verantwortlichen- und Behördenkontakt ergänzt werden.

## Angaben für die Stores

Apple App Privacy und Google Data Safety müssen mindestens gegen folgende tatsächliche Datenflüsse geprüft werden:

- Accountkennung/E-Mail für Konto- und Synchronisierungsfunktion
- Käufe und Kaufhistorie für Wallet, Betrugsvermeidung und Wiederherstellung
- App-Aktivität/Lernfortschritt für die vom Elternkonto gewählte Cloud-Synchronisierung
- Werbeinteraktion nur bei freiwilligem Rewarded-Ad-Aufruf
- keine Nutzung für Cross-App-Tracking oder personalisierte Werbung

Die finalen Formulare müssen mit den zu diesem Zeitpunkt eingebundenen SDK-Versionen und deren aktuellen Datenschutzangaben abgeglichen werden.
