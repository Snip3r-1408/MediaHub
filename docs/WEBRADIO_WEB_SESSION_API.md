# Benötigte WebRadio Web Session API

Dieses Dokument beschreibt die fehlende Core-Schnittstelle für MediaHub 0.14.
Sie ist bewusst nicht YouTube-spezifisch, damit später auch andere legale
Streaminganbieter angebunden werden können.

## Neue Capabilities

### `web-session`

Erlaubt einem ausdrücklich freigegebenen Plugin, eine isolierte Web-Sitzung für
exakt deklarierte HTTPS-Origins anzulegen. Das Plugin erhält niemals Cookies,
Passwörter oder rohe Session-Header.

### `web-session-media`

Erlaubt für eine bestehende Sitzung ausschließlich standardisierte
Medienbefehle und bereinigte Zustandsereignisse.

### `encrypted-media`

Kennzeichnet optional verfügbare DRM-/EME-Unterstützung. Provider, die sie
benötigen, müssen bei fehlender Unterstützung verständlich deaktiviert werden.

## Manifest-Deklaration

Ein Plugin sollte erlaubte Anbieter explizit deklarieren:

```json
{
  "capabilities": ["web-session", "web-session-media"],
  "webSessionOrigins": [
    "https://music.youtube.com",
    "https://accounts.google.com",
    "https://accounts.youtube.com",
    "https://consent.youtube.com"
  ]
}
```

Wildcards, HTTP und zur Laufzeit hinzugefügte Origins werden abgelehnt.

## Renderer-Brücke

Vorgeschlagene API: `window.pluginWebSessionAPI`

```js
await pluginWebSessionAPI.create({
  pluginId: "mediahub",
  sessionId: "youtube-music",
  origin: "https://music.youtube.com",
  partition: "persist:plugin-mediahub-youtube-music"
});

await pluginWebSessionAPI.openLogin("youtube-music");
await pluginWebSessionAPI.load("youtube-music", trackUrl);
await pluginWebSessionAPI.command("youtube-music", {
  type: "play" // pause | stop | seek | setVolume
});

const unsubscribe = pluginWebSessionAPI.onState("youtube-music", state => {
  // state, title, artist, album, artwork, duration, position, volume, audible
});
```

Zusätzlich benötigt werden:

- `getState(sessionId)`
- `show(sessionId, bounds)` für Anmeldung und Fehlerbehebung
- `hide(sessionId)`
- `reload(sessionId)`
- `destroy(sessionId)`
- `onNavigationRequired(sessionId, listener)` für erlaubte Login-Weiterleitungen
- `onError(sessionId, listener)` mit stabilen Fehlercodes

## Sicherheitsregeln

- `contextIsolation: true`, `nodeIntegration: false`, Sandbox aktiv
- eigene persistente Partition pro Plugin und Provider
- Navigation und Popups ausschließlich zu manifestierten Origins
- Downloads, Dateizugriff, unbekannte Protokolle und neue Fenster standardmäßig
  blockieren
- keine allgemeine `executeJavaScript`-Methode für Plugins
- keine Cookie-, Storage-, Header- oder Token-Ausgabe an das Plugin
- Zustandsereignisse auf Titel, Künstler, Album, Cover und Playerdaten begrenzen
- Sitzungen beim Deaktivieren des Plugins ausblenden; beim Entfernen des Plugins
  kann der Nutzer die gespeicherte Sitzung getrennt löschen

## Mediensteuerung

Der Core sollte zuerst standardisierte Browser-Medienmechanismen verwenden:

- `media-started-playing`, `media-paused` und Audiozustand von Electron
- `navigator.mediaSession` beziehungsweise vorhandene HTML-Medienelemente in
  einem isolierten, Core-kontrollierten Adapter
- Laden einer vom Provider-Adapter erzeugten, origin-geprüften Track-URL

Dienstspezifische DOM-Selektoren gehören nicht in den WebRadio-Core. Falls ein
Provider zusätzliche Steuerung benötigt, liegt sie in einem versionierten,
isolierten Adapter mit eigener Capability – nicht in MediaHubs normalem
Renderer-Kontext.

## Lebenszyklus

1. Plugin erstellt oder übernimmt seine benannte Sitzung.
2. Bei fehlender Anmeldung zeigt der Core die echte Anbieter-Seite sichtbar an.
3. Nach erfolgreicher Anmeldung kann die Sitzung verborgen weiterlaufen.
4. MediaHub erhält ausschließlich bereinigte Playerzustände.
5. WebRadio-Kommandos werden über `web-session-media` an die aktive Sitzung
   weitergegeben.
6. Providerwechsel pausiert die alte Sitzung, bevor die neue aktiviert wird.

## Abnahmekriterien für YouTube Music

- Google-Anmeldung funktioniert unter Linux und Windows.
- Cookies bleiben ausschließlich in der YouTube-Music-Partition.
- Ein über `music.youtube.com/watch?v=…` geladener Premium-Titel startet.
- Play, Pause, Stop, Lautstärke und Seek funktionieren über die WebRadio-Leiste.
- Titel, Künstler, Cover, Dauer und Position werden an MediaHub gemeldet.
- Deaktivieren oder Wechseln des Providers beendet hörbare Wiedergabe.
- Kein Cookie, OAuth-Token oder Passwort ist für Plugin- oder App-Renderer
  lesbar.
