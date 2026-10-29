# Roadmap

Diese Roadmap beschreibt die geplante Richtung von MediaHub. Reihenfolge und
Umfang können sich durch Änderungen am WebRadio Plugin SDK oder an YouTube
ändern.

## Als Nächstes: MediaHub 0.14 Provider Platform

- Sichere, isolierte Web-Sitzung mit WebRadio abstimmen und implementieren
- YouTube Music Premium über die echte `music.youtube.com`-Sitzung abspielen
- Katalog, Anmeldung und Wiedergabe hinter Provider-Adaptern trennen
- Warteschlangeneinträge um `providerId` und `providerTrackId` erweitern
- Anbieter-Umschalter für YouTube Music, Spotify, Apple Music und Amazon Music
  vorbereiten
- Den bisherigen YouTube-IFrame nach erfolgreicher Migration entfernen

Die technische Zielarchitektur steht in
[`docs/PROVIDER_ARCHITECTURE.md`](docs/PROVIDER_ARCHITECTURE.md). Die dafür im
WebRadio-Core benötigte Schnittstelle ist in
[`docs/WEBRADIO_WEB_SESSION_API.md`](docs/WEBRADIO_WEB_SESSION_API.md)
vollständig beschrieben.

## Plugin-Updates

- Generische und sichere Plugin-Installationsschnittstelle in WebRadio abstimmen
- Neue MediaHub-Versionen über GitHub Releases erkennen
- Updatehinweis direkt in MediaHub anzeigen
- Download, Integritätsprüfung und Installation über den WebRadio-Core
- Neustart-Hinweis nach erfolgreicher Aktualisierung

## Playlisten

- Reihenfolge per Drag-and-drop ändern
- Playlist umbenennen und duplizieren
- Import und Export als JSON
- Suchtreffer gesammelt zu einer Playlist hinzufügen
- Optionaler Verlauf zuletzt gespielter Titel
- Später: Synchronisierung zwischen Geräten prüfen

## Oberfläche

- Verbesserte Tastaturbedienung und Barrierefreiheit
- Tooltips und kurze Erklärungen für Wiedergabemodi
- Dezente Ladeanimationen und Benachrichtigungen statt reiner Textzustände
- Optionale Mini-Player-Ansicht
- Weitere Feinarbeit an Abständen und Katalogregalen anhand längerer Praxistests

## YouTube-Music-Katalog

- Weitere Suchfilter direkt in der Oberfläche auswählbar machen
- Chart-Land in den Einstellungen wählbar machen
- Künstler- und Albumdetails um weitere Metadaten ergänzen
- Navigation mit Zurück-Funktion und zuletzt geöffneten Katalogseiten
- Persönliche Likes und private YouTube-Music-Mediathek erst ergänzen, wenn der
  WebRadio-Core dafür eine ausdrücklich freigegebene, sichere Schnittstelle
  bereitstellt

## Langfristig

- Spotify über Web API und Web Playback SDK ergänzen
- Apple Music über Apple Music API und MusicKit on the Web ergänzen
- Amazon Music nach gesonderter technischer und vertraglicher Prüfung ergänzen
- Plugin-eigene OAuth-Logik über allgemeine sichere WebRadio-Schnittstellen
- Weitere automatisierte Tests für Playlist-Verwaltung und Langzeit-Mix
- Automatisierte, reproduzierbare Release-Pakete über GitHub Actions

## Nicht geplant

- Umgehung von YouTube-Einbettungs- oder Zugriffsbeschränkungen
- Versteckte Audio-only-Wiedergabe entgegen den YouTube-Richtlinien
- Speicherung von Google-Passwörtern oder privaten Zugangsdaten im Plugin
