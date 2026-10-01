# Changelog

Alle wichtigen Änderungen an MediaHub werden hier dokumentiert.

## 0.8.0 – 2026-10-01

### Neu

- Echte Genre-Erkennung über die offene Musikdatenbank MusicBrainz
- Vier wählbare Auto-Mix-Arten: ähnliche Künstler, gleiches Genre, breiter Mix
  und Überraschung
- Lokaler Genre-Zwischenspeicher für schnellere weitere Suchen
- Sicherer Rückfall, falls die externe Musikdatenbank nicht erreichbar ist

### Verbessert

- Genre-Suchen enthalten nicht länger zwangsläufig den ursprünglichen Künstler
- Künstler werden aus Videotiteln statt aus Plattenlabel-Kanälen ermittelt
- Vielfalt wird nun pro tatsächlichem Künstler begrenzt

## 0.7.3 – 2026-09-30

### Neu

- Dauerhafter YouTube-Player für unterbrechungsfreie Titelwechsel
- Zusätzliche Ende-Erkennung, falls YouTube kein reguläres Signal sendet
- Automatische Entfernung gesperrter Videos aus Treffern und Warteschlange
- Automatischer Wechsel zur nächsten oder alternativen Version

### Verbessert

- Auto-Mix lädt am Ende über mehrere Genre- und Ähnlichkeitssuchen nach
- Begrenzte Wiederherstellungsversuche verhindern Fehlerschleifen

## 0.7.1 – 2026-09-30

### Neu

- Genre-basierter Auto-Mix
- Höchstens zwei automatisch ergänzte Titel pro Künstler
- Zusätzliche Suche nach ähnlichen Künstlern

## 0.7.0 – 2026-09-30

### Neu

- Automatisches Ergänzen der aktiven Playlist
- Fortlaufende Wiedergabe und automatisches Nachladen
- Überspringen nicht einbettbarer Videos im Auto-Mix

## 0.6.0

- Wiedergabemodi: einmal, wiederholen und zufällig
- Automatischer Wechsel zum nächsten Playlist-Titel

## 0.5.x

- Neue kompakte, randlose Benutzeroberfläche
- Willkommensansicht für nicht angemeldete Nutzer
- Symbolschaltflächen für Suche und Abmeldung

## 0.4.x

- Lokale Playlisten erstellen, auswählen und löschen
- Suchtreffer zu Playlisten hinzufügen

## 0.3.x

- Integration in die WebRadio-Player-Schnittstelle
- Lokaler Plugin-HTTP-Player für die YouTube-IFrame-API

## 0.2.x

- Sichere Google-Anmeldung über den WebRadio-Core
- YouTube-Suche innerhalb von MediaHub

## 0.1.0

- Erste lauffähige MediaHub-Ansicht für WebRadio
