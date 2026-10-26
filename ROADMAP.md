# Roadmap

Diese Roadmap beschreibt die geplante Richtung von MediaHub. Reihenfolge und
Umfang können sich durch Änderungen am WebRadio Plugin SDK oder an YouTube
ändern.

## Als Nächstes

- Nicht einbettbare Videos bereits vor der Wiedergabe herausfiltern
- Künstler- und Genre-Erkennung für mehr Sonderfälle weiter verfeinern
- Laufzeitdaten direkt aus der Suche auswerten, sobald WebRadio sie bereitstellt
- Mixer-Qualität mit längeren Praxistests weiter abstimmen

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

## YouTube-Music-Katalog

- Weitere Suchfilter direkt in der Oberfläche auswählbar machen
- Chart-Land in den Einstellungen wählbar machen
- Künstler- und Albumdetails um weitere Metadaten ergänzen
- Navigation mit Zurück-Funktion und zuletzt geöffneten Katalogseiten
- Persönliche Likes und private YouTube-Music-Mediathek erst ergänzen, wenn der
  WebRadio-Core dafür eine ausdrücklich freigegebene, sichere Schnittstelle
  bereitstellt

## Langfristig

- Generische Provider-Schicht für weitere legale Musikquellen
- Plugin-eigene OAuth-Logik über allgemeine sichere WebRadio-Schnittstellen
- Weitere automatisierte Tests für Playlist-Verwaltung und Langzeit-Mix
- Automatisierte, reproduzierbare Release-Pakete über GitHub Actions

## Nicht geplant

- Umgehung von YouTube-Einbettungs- oder Zugriffsbeschränkungen
- Versteckte Audio-only-Wiedergabe entgegen den YouTube-Richtlinien
- Speicherung von Google-Passwörtern oder privaten Zugangsdaten im Plugin
