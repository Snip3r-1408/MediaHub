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

- Anmeldung über Google und Song-Suche über YouTube Music
- Theme-adaptiver Musikclient mit Navigation, Wiedergabe und Warteschlange
- Offene Empfehlungsregale mit großen Covern und fließender Katalognavigation
- Startseite mit YouTube-Music-Empfehlungsreihen
- Entdecken-Ansicht mit Neuerscheinungen, Trends, Videos, Genres und Stimmungen
- Detailansichten für öffentliche Alben, Künstler und Playlisten
- Wiedergabe im integrierten, sichtbaren YouTube-Player
- Steuerung über die zentrale Player-Leiste von WebRadio
- Beliebig viele lokal gespeicherte Playlisten
- Wiedergabe der Reihe nach, im Kreis oder zufällig
- Auto-Mix mit echten Titel-Radios von YouTube Music und Genre-Daten von MusicBrainz
- Vier Mix-Arten: ähnliche Künstler, gleiches Genre, breiter Mix und Überraschung
- Strenge Künstlerprüfung verhindert Genre-Sprünge im Modus „Gleiches Genre“
- Rollender Mix-Puffer mit zwölf vorbereiteten Titeln
- Automatisches Nachladen, bevor das Ende der Warteschlange erreicht wird
- Wechselnde Genre-, Entdeckungs-, Jahres- und Stimmungsanfragen
- Wiedergabe-Rückfall ohne Stille, falls vorübergehend kein neuer Treffer verfügbar ist
- Filter gegen komplette Alben, Konzerte und stundenlange Zusammenstellungen
- Automatisches Überspringen von Videos mit Einbettungssperre
- Responsive Oberfläche, die sich in Dark, Default, Neon und Carbon einfügt und
  trotzdem ihre eigene MediaHub-Identität behält

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
2. Auf der Startseite Empfehlungen öffnen oder unter **Entdecken** durch neue
   Veröffentlichungen, Trends und Genres stöbern.
3. Alternativ nach einem Titel, Künstler oder Album suchen.
4. Einen Titel direkt starten oder über `+` zur lokalen Playlist hinzufügen.
5. In der Mediathek den Wiedergabemodus auswählen.
6. Eine Mix-Art wählen und mit dem Funkeln-Symbol den Auto-Mix aktivieren.

Auto-Mix fragt zuerst das zu einem Song gehörende YouTube-Music-Radio ab. So
entsteht aus Falling In Reverse beispielsweise eine Mischung mit verwandten
Metal- und Metalcore-Künstlern statt einer reinen Suche nach demselben Namen.
Wenn das Radio nicht erreichbar ist, erkennt MediaHub den Künstler aus dem
Videotitel und fragt passende Stilbegriffe bei MusicBrainz ab.
MediaHub ergänzt höchstens zwei Titel desselben Künstlers innerhalb des jüngsten
Warteschlangenabschnitts. Sobald nur noch fünf Titel vorausliegen, wird der
Puffer im Hintergrund wieder auf bis zu zwölf Titel ergänzt. Automatisch
hinzugefügte, bereits gehörte Titel rotieren aus der Liste; manuell gespeicherte
Titel bleiben erhalten.

## Voraussetzungen

- WebRadio **1.0.7-alpha.5** oder neuer
- Linux oder Windows mit einer unterstützten WebRadio-Version
- Python **3.10 oder neuer** für die erweiterte YouTube-Music-Empfehlungsengine
- Internetverbindung
- Google-Konto für die YouTube-Suche

Die Genre-Erkennung verwendet die freie Musikdatenbank
[MusicBrainz](https://musicbrainz.org/). Kann sie nicht erreicht werden, fällt
MediaHub automatisch auf eine lokale Erkennung beziehungsweise die Suche nach
ähnlichen Künstlern zurück.

Die erweiterte Song-Suche und Radio-Funktion nutzt die im Plugin gebündelte,
inoffizielle Open-Source-Bibliothek
[ytmusicapi](https://github.com/sigma67/ytmusicapi). Sie wird ohne Cookies und
ohne Zugriff auf die Google-Anmeldedaten von WebRadio betrieben. Fehlt Python
oder ist der Dienst nicht erreichbar, arbeitet MediaHub automatisch mit der
bisherigen WebRadio-Suche weiter.

## Bekannte Einschränkungen

- Einige Videos dürfen vom Rechteinhaber nicht außerhalb von YouTube
  eingebettet werden. MediaHub erkennt diese beim Abspielen und überspringt sie.
- Neue Suchvorgänge hängen vom verfügbaren YouTube-API-Kontingent ab. Bei einer
  vorübergehenden Begrenzung verwendet MediaHub vorhandene Titel weiter und
  versucht die Suche mit wachsendem Abstand erneut.
- YouTube erlaubt keinen versteckten Audio-only-Player. Der Videoplayer muss
  deshalb sichtbar bleiben.
- MediaHub befindet sich in der Alpha-Phase und seine Schnittstellen können sich
  gemeinsam mit dem WebRadio Plugin SDK noch ändern.
- Startseite, Entdecken und öffentliche Detailseiten werden anonym über
  `ytmusicapi` geladen. Sie sind deshalb nicht mit der persönlichen
  YouTube-Music-Historie, den Likes oder der privaten Mediathek synchronisiert.
- Playlisten werden aktuell lokal im WebRadio-Profil gespeichert und nicht
  zwischen Geräten synchronisiert.

## Projektstatus

Die aktuelle Planung findest du in der [Roadmap](ROADMAP.md). Änderungen jeder
Version werden im [Changelog](CHANGELOG.md) dokumentiert.

Die laufende 0.14-Neuentwicklung trennt MediaHub in austauschbare Musikdienste.
Details stehen in der
[Provider-Architektur](docs/PROVIDER_ARCHITECTURE.md); die dafür benötigte
[WebRadio Web Session API](docs/WEBRADIO_WEB_SESSION_API.md) ist separat und
anbieterneutral spezifiziert.

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
