# MediaHub Provider Platform

MediaHub wird ab Version 0.14 nicht mehr als YouTube-spezifischer Player
weiterentwickelt. Oberfläche, lokale Playlisten und WebRadio-Steuerung bleiben
gemeinsam; Katalog, Anmeldung und Wiedergabe werden durch austauschbare
Provider-Adapter bereitgestellt.

## Zielbild

```text
MediaHub UI
  ├── Suche / Entdecken / Mediathek
  ├── lokale, providerneutrale Warteschlange
  ├── gemeinsamer Player-Zustand
  └── ProviderRegistry
        ├── YouTubeMusicProvider
        ├── SpotifyProvider
        ├── AppleMusicProvider
        └── AmazonMusicProvider
```

Der Umschalter ändert den aktiven Provider, ohne Navigation, Player-Leiste oder
Playlist-Oberfläche auszutauschen. Ein Warteschlangeneintrag speichert deshalb
neben Titel, Künstler und Cover immer auch `providerId` und `providerTrackId`.
IDs verschiedener Dienste dürfen niemals miteinander verglichen oder an einen
anderen Adapter übergeben werden.

## Einheitlicher Adapter-Vertrag

Jeder Provider implementiert – soweit vom jeweiligen Dienst unterstützt –
folgende Bereiche:

- `authenticate()` / `signOut()` / `getSessionState()`
- `search(query, filters)`
- `getHome()` / `getExplore()` / `getLibrary()`
- `getAlbum(id)` / `getArtist(id)` / `getPlaylist(id)`
- `prepare(track)`
- `play(track)` / `pause()` / `stop()`
- `seek(positionSeconds)` / `setVolume(value)`
- `getPlaybackState()` / `subscribePlaybackState(listener)`

Nicht unterstützte Funktionen werden als Capability gemeldet und in der UI
ausgeblendet. Die Oberfläche darf nicht aus dem Providernamen ableiten, welche
Funktion verfügbar ist.

## Provider-Zustände

- `active`: vollständig auswählbar
- `migration`: aktuell nutzbar, wird aber auf einen neuen Adapter umgestellt
- `planned`: im Umschalter sichtbar, aber noch nicht auswählbar
- `disabled`: bewusst ausgeblendet

Die maschinenlesbare Definition liegt in `providers.json`; Validierung und
Auswahl übernimmt `provider-registry.js`.

## Geplante Adapter

### YouTube Music

- Katalog zunächst weiter über `ytmusicapi`
- Wiedergabe künftig über eine angemeldete, isolierte
  `https://music.youtube.com`-Web-Sitzung
- vorhandener IFrame-Player nur noch Übergangslösung

### Spotify

- Katalog über Spotify Web API
- Wiedergabe über das offizielle Web Playback SDK
- Spotify Premium und dienstspezifisches OAuth erforderlich

### Apple Music

- Katalog über Apple Music API
- Wiedergabe über MusicKit on the Web
- Apple-Music-Abo, Developer Token und Music User Token erforderlich

### Amazon Music

- keine allgemein verfügbare, mit Spotify oder MusicKit vergleichbare
  öffentliche Vollwiedergabe-API einplanen
- deshalb nur über eine isolierte Web-Sitzung, sofern technisch und vertraglich
  zulässig

## Migrationsreihenfolge

1. Allgemeine Web-Sitzungs-Capabilities in WebRadio bereitstellen.
2. YouTube Music auf `web-session` umstellen und den IFrame entfernen.
3. Warteschlangenmodell um `providerId` und `providerTrackId` erweitern.
4. Provider-Umschalter aktivieren.
5. Spotify- und Apple-Adapter getrennt ergänzen.
6. Amazon Music erst nach eigenständiger Machbarkeitsprüfung aktivieren.

Die benötigte WebRadio-Schnittstelle ist in
[`WEBRADIO_WEB_SESSION_API.md`](WEBRADIO_WEB_SESSION_API.md) beschrieben.
