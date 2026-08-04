# Mobile Monetization

Diese Checkliste richtet die vorhandene Implementierung für Sandbox-Tests und Store Review ein. Secrets gehören ausschließlich in Supabase oder native Build-Konfigurationen, niemals in `VITE_*`.

## 1. Lokale Voraussetzungen

- Node.js und `npm install`
- Android Studio, Android SDK und Java 21
- vollständiges Xcode (nicht nur Command Line Tools) und CocoaPods

Falls macOS noch die Command Line Tools verwendet:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license
sudo xcodebuild -runFirstLaunch
cd ios/App && pod install
```

Danach:

```bash
npm run mobile:sync
npm run mobile:ios
npm run mobile:android
```

Bundle/Application ID auf beiden Plattformen: `com.linguaturtle.app`.

## 2. Store-Produkte

In App Store Connect und Play Console drei **verbrauchbare** Produkte mit exakt diesen IDs anlegen:

| Produkt-ID | Muscheln | deutscher Ausgangspreis |
| --- | ---: | ---: |
| `com.linguaturtle.shells.150` | 150 | 1,99 € |
| `com.linguaturtle.shells.450` | 450 | 4,99 € |
| `com.linguaturtle.shells.1000` | 1.000 | 9,99 € |

Die Preise in der UI stammen immer aus StoreKit/Play Billing. App Store Connect: Sandbox-Tester und In-App-Purchase-Testgruppe konfigurieren. Play Console: App mindestens im internen Test veröffentlichen, Lizenztester eintragen und alle Produkte aktivieren.

## 3. Supabase

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy delete-account
supabase functions deploy economy
supabase functions deploy verify-purchase
supabase functions deploy store-webhook --no-verify-jwt
```

Auth Redirect URLs:

- Web-URLs der lokalen und veröffentlichten App
- `com.linguaturtle.app://auth-callback`

Function-Secrets:

```text
APPLE_ISSUER_ID
APPLE_KEY_ID
APPLE_PRIVATE_KEY
APPLE_BUNDLE_ID=com.linguaturtle.app
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
GOOGLE_PLAY_PACKAGE_NAME=com.linguaturtle.app
GOOGLE_RTDN_SHARED_SECRET
```

Der Google-Service-Account braucht in Play Console Zugriff auf Bestellungen und In-App-Produkte. Apple benötigt einen In-App-Purchase-Schlüssel für die App Store Server API.

## 4. Server-Benachrichtigungen

App Store Connect Server Notifications V2:

```text
https://YOUR_PROJECT.supabase.co/functions/v1/store-webhook
```

Google Play RTDN wird über Pub/Sub Push an dieselbe URL gesendet. Der Push-Proxy muss den geheimen Header setzen:

```text
x-linguaturtle-webhook-secret: GOOGLE_RTDN_SHARED_SECRET
```

Produktionsreif ist alternativ ein authentifizierter Pub/Sub-Proxy, der Googles OIDC-Token prüft und den Header nur nach erfolgreicher Prüfung setzt. Rückerstattungen werden im unveränderlichen Ledger gegengebucht; bereits verbrauchtes Guthaben wird als interner Rückbuchungsbetrag geführt.

## 5. Kidoz und Remote-Abschaltung

Android liest die Werte aus `~/.gradle/gradle.properties` oder der CI-Umgebung:

```text
LINGUATURTLE_KIDOZ_PUBLISHER_ID=...
LINGUATURTLE_KIDOZ_SECURITY_TOKEN=...
```

iOS verwendet Xcode Build Settings:

```text
LINGUATURTLE_KIDOZ_PUBLISHER_ID=...
LINGUATURTLE_KIDOZ_SECURITY_TOKEN=...
LINGUATURTLE_IOS_REWARDED_ADS_ENABLED=NO
```

`economy_remote_config` steuert die sichtbare Verfügbarkeit zusätzlich serverseitig. iOS bleibt dort und im Build auf `false/NO`, bis Kidoz die für Apples Kids Category erforderliche menschliche Prüfung schriftlich oder öffentlich bestätigt und App Review die Integration akzeptiert.

Die Implementierung verwendet ausschließlich freiwillige Rewarded Ads: 15 Muscheln, höchstens drei Abschlüsse innerhalb rollierender 24 Stunden. Kinderprofile benötigen vor jeder Sitzung eine neue Elternfreigabe. Es gibt kein ATT-Prompt, IDFA, Banner, Interstitial oder App-Start-Werbung.

## 6. Abnahme vor Release

- erfolgreiche, abgebrochene, ausstehende, doppelte und offline unterbrochene Käufe auf beiden Plattformen
- „Käufe synchronisieren“ nach Neustart, Neuinstallation und auf einem zweiten Gerät
- Rückerstattung bei vollem und bereits ausgegebenem Guthaben
- parallele Store- und Webhook-Callbacks derselben Transaktion
- Werbeabschluss, Abbruch, keine verfügbare Werbung, doppelter Callback und vierter Versuch in 24 Stunden
- Kinderprofil, Erwachsenenmodus, Elternschranke, fehlende Anmeldung und Remote-Abschaltung
- PWA enthält weder Kauf- noch Werbeaktionen
- Datenschutz, Elterninformation, Apple App Privacy, Google Data Safety, Kaufbedingungen und Review Notes rechtlich prüfen

Store-Review-Hinweise sollen erklären: Echtgeldfunktionen liegen hinter der Elternschranke; gekaufte Muscheln verfallen nicht; es gibt keine Lootboxen; Werbung liegt außerhalb des Lernflusses; iOS-Werbung ist remote abschaltbar.

Die technische Arbeitsfassung für Datenschutz- und Elterninformationen liegt in [PRIVACY_PARENT_INFORMATION_DRAFT.md](PRIVACY_PARENT_INFORMATION_DRAFT.md).
