# MediaHub

> YouTube-Musik, Playlisten und ein intelligenter Auto-Mix direkt in WebRadio.

[![Version](https://img.shields.io/github/v/release/Snip3r-1408/MediaHub?display_name=tag&style=flat-square)](https://github.com/Snip3r-1408/MediaHub/releases/latest)
[![WebRadio](https://img.shields.io/badge/WebRadio-%E2%89%A51.0.7--alpha.5-7166ff?style=flat-square)](https://github.com/YourEliteSystems/WebRadio)
[![Plattform](https://img.shields.io/badge/Plattform-Linux%20%7C%20Windows-22b8cf?style=flat-square)](#voraussetzungen)
[![Status](https://img.shields.io/badge/Status-Alpha-f59e0b?style=flat-square)](https://github.com/Snip3r-1408/MediaHub/releases)

MediaHub ist ein eigenständiges Community-Plugin für
[WebRadio](https://github.com/YourEliteSystems/WebRadio). Es verbindet die
YouTube-Suche mit der WebRadio-Oberfläche und ergänzt sie um lokale Playlisten,
Wiedergabemodi und einen endlosen Auto-Mix.

## Funktionen

- Anmeldung über Google und Suche nach Musik auf YouTube
- Wiedergabe im integrierten, sichtbaren YouTube-Player
- Steuerung über die zentrale Player-Leiste von WebRadio
- Beliebig viele lokal gespeicherte Playlisten
- Wiedergabe der Reihe nach, im Kreis oder zufällig
- Auto-Mix mit ähnlichen Künstlern und passender Genre-Mischung
- Automatisches Nachladen neuer Titel am Ende der Warteschlange
- Automatisches Überspringen von Videos mit Einbettungssperre
- Dezente, platzsparende Oberfläche im WebRadio-Design

## Installation

1. Die aktuelle Datei `mediahub-*.tar.gz` unter
   [Releases](https://github.com/Snip3r-1408/MediaHub/releases/latest)
   herunterladen.
2. Das Archiv entpacken.
3. Den enthaltenen Ordner als `mediahub` in den Plugin-Ordner von WebRadio
   kopieren.
4. WebRadio vollständig neu starten und MediaHub in den Plugin-Einstellungen
   aktivieren.

Linux:

```text
~/.config/webradio/plugins/mediahub/
```

Weitere Hinweise stehen in [INSTALL.md](INSTALL.md).

## Bedienung

1. MediaHub in der Navigation öffnen und mit Google anmelden.
2. Nach einem Titel, Künstler oder Album suchen.
3. Einen Treffer direkt starten oder über `+` zur Playlist hinzufügen.
4. In der Playlist den Wiedergabemodus auswählen.
5. Mit dem Funkeln-Symbol den Auto-Mix aktivieren.

Auto-Mix ergänzt höchstens zwei Titel desselben Künstlers automatisch. Dadurch
bleibt die Mischung abwechslungsreich. Ist die Warteschlange aufgebraucht,
sucht MediaHub selbstständig nach weiteren passenden Titeln.

## Voraussetzungen

- WebRadio **1.0.7-alpha.5** oder neuer
- Linux oder Windows mit einer unterstützten WebRadio-Version
- Internetverbindung
- Google-Konto für die YouTube-Suche

## Bekannte Einschränkungen

- Einige Videos dürfen vom Rechteinhaber nicht außerhalb von YouTube
  eingebettet werden. MediaHub erkennt diese beim Abspielen und überspringt sie.
- YouTube erlaubt keinen versteckten Audio-only-Player. Der Videoplayer muss
  deshalb sichtbar bleiben.
- MediaHub befindet sich in der Alpha-Phase und seine Schnittstellen können sich
  gemeinsam mit dem WebRadio Plugin SDK noch ändern.
- Playlisten werden aktuell lokal im WebRadio-Profil gespeichert und nicht
  zwischen Geräten synchronisiert.

## Projektstatus

Die aktuelle Planung findest du in der [Roadmap](ROADMAP.md). Änderungen jeder
Version werden im [Changelog](CHANGELOG.md) dokumentiert.

- [Fehler melden](https://github.com/Snip3r-1408/MediaHub/issues)
- [Neueste Version herunterladen](https://github.com/Snip3r-1408/MediaHub/releases/latest)
- [Zu WebRadio](https://github.com/YourEliteSystems/WebRadio)

## Mitmachen

Fehlerberichte, Ideen und Verbesserungen sind willkommen. Bitte lies vor einem
Beitrag [CONTRIBUTING.md](CONTRIBUTING.md). Sicherheitsprobleme sollten nicht
öffentlich gemeldet werden; Hinweise dazu stehen in [SECURITY.md](SECURITY.md).

## Hinweis

MediaHub ist ein unabhängiges, inoffizielles Community-Projekt. Es steht in
keiner Verbindung zu Google LLC oder YouTube. YouTube und YouTube Music sind
Marken ihrer jeweiligen Rechteinhaber. Für die Nutzung gelten die Bedingungen
der angebundenen Dienste.

