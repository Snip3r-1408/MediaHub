# Installation

## Voraussetzungen

- WebRadio 1.0.7-alpha.5 oder neuer
- Eine aktive Internetverbindung
- Ein Google-Konto für Suche und Wiedergabe

## Linux

1. Das aktuelle MediaHub-Archiv unter
   [GitHub Releases](https://github.com/Snip3r-1408/MediaHub/releases/latest)
   herunterladen.
2. Das Archiv entpacken.
3. Sicherstellen, dass die Dateien direkt in folgendem Ordner liegen:

```text
~/.config/webradio/plugins/mediahub/
```

Die Struktur muss anschließend so aussehen:

```text
mediahub/
├── main.js
├── player.html
├── plugin.json
├── renderer.js
└── README.md
```

4. WebRadio vollständig beenden und neu starten.
5. Einstellungen → Plugins öffnen, MediaHub aktivieren und Plugins neu laden.

## Windows

Der genaue Stammordner hängt vom WebRadio-Build ab. In den
WebRadio-Einstellungen unter **Plugins → Ordner öffnen** lässt sich der richtige
Plugin-Ordner direkt anzeigen. Dort einen Unterordner `mediahub` erstellen und
die Plugin-Dateien hineinkopieren.

Danach WebRadio vollständig neu starten.

## Aktualisierung

Bis WebRadio eine sichere Plugin-Update-Schnittstelle bereitstellt:

1. Neues Release herunterladen.
2. WebRadio schließen.
3. Vorhandene Dateien im Ordner `mediahub` durch die neue Version ersetzen.
4. WebRadio neu starten.

Lokal gespeicherte Playlisten liegen im WebRadio-Profil und bleiben bei einem
normalen Austausch des Plugin-Ordners erhalten. Ein Backup vor größeren
Änderungen wird trotzdem empfohlen.

## Fehlerdiagnose

- Prüfen, ob `plugin.json` direkt im Ordner `mediahub` liegt.
- Prüfen, ob WebRadio mindestens Version 1.0.7-alpha.5 verwendet.
- MediaHub in den Plugin-Einstellungen deaktivieren, erneut aktivieren und
  Plugins neu laden.
- WebRadio vollständig schließen und neu öffnen.
- Bei reproduzierbaren Problemen ein
  [GitHub Issue](https://github.com/Snip3r-1408/MediaHub/issues) mit WebRadio-
  Version, Betriebssystem und Fehlerbeschreibung erstellen.

