# Changelog

Alle wichtigen Änderungen an MediaHub werden hier dokumentiert.

## 0.13.7 – 2026-10-29

### Eine gemeinsame Warteschlange

- Die bisherige rechte Spalte „Als Nächstes“ wurde entfernt
- Dieselbe echte Wiedergabewarteschlange erscheint nun vollständig unter dem
  Player im Bereich „Mediathek“
- Mixer, Wiedergabemodus, Playlist-Auswahl und Verwaltung befinden sich direkt
  über der gemeinsamen Warteschlange
- Player und Inhaltsbereich nutzen dadurch die gesamte verfügbare Breite

## 0.13.6 – 2026-10-29

### Normale Wiedergabe stabilisiert

- YouTube-Music-Audiokatalog-IDs werden bereits vor dem Start bevorzugt in eine
  passende offizielle Musikvideo-Version umgewandelt
- Alternative Versionen werden nun nach exaktem Titel, Künstler, Videotyp und
  Laufzeit bewertet; Reactions, Cover, Karaoke und lange Fremdversionen werden
  deutlich abgewertet
- Die Fehlergrenze wird erst nach zwölf Sekunden stabiler Wiedergabe
  zurückgesetzt. Kurze falsche „Playing“-Signale können deshalb keine endlose
  Überspring-Schleife mehr auslösen
- Dauerhaft gesperrte Video-IDs werden für 30 Tage lokal gespeichert und nicht
  erneut in den Magischen Mixer aufgenommen
- Nicht verfügbare YouTube-Music-Treffer gelangen nicht mehr in die
  Warteschlange

## 0.13.5 – 2026-10-29

### Wiedergabe-Reparatur

- Bei einer gesperrten YouTube-Music-Song-ID sucht MediaHub nun zuerst eine
  passende Musikvideo-Version desselben Titels und ersetzt die defekte Version
  direkt in der Warteschlange
- Alternative Versionen werden nach Titel und Künstler sortiert; lange Videos,
  bereits fehlgeschlagene IDs und unpassende Titel werden verworfen
- Nach fünf aufeinanderfolgenden Player-Fehlern wird der Auto-Mix kontrolliert
  gestoppt, statt immer neue Titel nachzufüllen und endlos zu überspringen
- Auch festhängende Titel und der Wiedergabe-Watchdog verwenden dieselbe
  begrenzte Wiederherstellung

## 0.13.4 – 2026-10-29

### Mixer und Suche

- „Gleiches Genre“ füllt „Als Nächstes“ nun vollständig aus dem echten
  YouTube-Music-Radio statt nur vier Radiotitel zu übernehmen
- MusicBrainz prüft nur noch das feste Startgenre und wird bei fehlendem
  YouTube-Music-Radio für die Rückfallsuche verwendet
- Kandidaten aus dem Radio werden nicht mehr einzeln über das Netzwerk geprüft;
  dadurch wird die Warteschlange wesentlich schneller aufgebaut
- Suchtreffer erscheinen sofort, während der Magische Mixer die nächsten Titel
  anschließend im Hintergrund lädt

## 0.13.3 – 2026-10-29

### Behoben

- Die Genre-Prüfung läuft nun über die lokale MediaHub-Engine statt direkt im
  WebRadio-Renderer und wird dadurch nicht mehr von Browser-Regeln blockiert
- Leere Genre-Antworten älterer Versionen werden nicht mehr aus dem bisherigen
  Zwischenspeicher übernommen
- Der echte YouTube-Music-Radio-Endpunkt kann passende Titel wieder zuverlässig
  in „Als Nächstes“ einfügen, während fremde Genre-Familien weiterhin abgewiesen
  werden

## 0.13.2 – 2026-10-29

### Behoben

- Lokalisierte YouTube-Kanalnamen wie „Falling In Reverse – Thema“ werden wieder
  dem eigentlichen Künstler zugeordnet
- Strukturierte Künstlerdaten aus YouTube Music haben bei der Genre-Erkennung
  Vorrang vor Titel- und Kanaltexten
- Der strenge Genre-Mix bleibt bei Titeln mit kurzem Namen wie „Joseph“ nicht
  mehr in der Warteschleife hängen

## 0.13.1 – 2026-10-28

### Behoben

- „Gleiches Genre“ prüft nun jeden automatisch vorgeschlagenen Künstler gegen
  die feste Genre-Familie des ursprünglichen Starttitels
- Unpassende Radio- und Suchtreffer wie Hip-Hop in einem Metal-Mix werden vor
  dem Einfügen in „Als Nächstes“ verworfen
- MusicBrainz-Ergebnisse werden nur noch bei einem eindeutigen Künstlernamen
  verwendet; ähnlich benannte Künstler können das Genre nicht mehr verfälschen
- Kann das Startgenre nicht sicher ermittelt werden, wartet der Mixer auf einen
  neuen Versuch, statt die Warteschlange mit beliebiger Musik zu füllen

## 0.13.0 – 2026-10-28

### Fließendes Musikclient-Design

- Offene, horizontal scrollbare Musikregale ersetzen die bisherige kompakte
  Kartenwand und rücken Cover, Künstler und Alben stärker in den Mittelpunkt
- Größere Überschriften, ruhigere Flächen und eine klarere Hierarchie orientieren
  sich am Bediengefühl moderner Musikclients, ohne YouTube Music zu kopieren
- MediaHub übernimmt nun Farben, Flächen, Texte, Rahmen und Akzente des aktiven
  WebRadio-Themes und bleibt durch Marke, Violett und Animationen erkennbar
- Künstler erscheinen mit runden Covern; Alben, Songs, Genres und Playlisten
  behalten passende eigene Darstellungen
- Schnellauswahl-Chips springen direkt zu den Empfehlungsbereichen der Startseite

### Platz und Wiedergabe

- Bei begrenzter Breite wird die interne Seitenleiste automatisch zu einer
  horizontalen Navigation, damit Katalog und Player mehr Raum erhalten
- Suchergebnisse erscheinen als ruhige Musikliste statt als zweispaltige Karten
- Das Cover des laufenden Titels erzeugt dezent eine farbige Hintergrundstimmung
- Warteschlange, Player, Playlisten und Mixer bleiben vollständig erhalten

## 0.12.0 – 2026-10-26

### Neuer Musikclient

- Eigenständige dreispaltige MediaHub-Oberfläche mit kompakter Navigation,
  zentraler Wiedergabe und dauerhafter „Als Nächstes“-Warteschlange
- Startseite mit Empfehlungsreihen aus dem öffentlichen YouTube-Music-Katalog
- Entdecken-Ansicht für Neuerscheinungen, Trends, Musikvideos sowie Stimmungen
  und Genres
- Album-, Künstler-, Playlist- und Genre-Kacheln öffnen echte Detailansichten
- Katalogtitel lassen sich direkt starten oder zur lokalen Playlist hinzufügen
- Playlisten sind zusätzlich in der internen Navigation erreichbar
- Ruhigere Proportionen, kompakte Symbolsteuerung und responsive Icon-Leiste für
  den begrenzten Platz innerhalb von WebRadio

### YouTube-Music-Datenoberfläche

- Neue lokal geschützte Endpunkte für Startseite, Entdecken, Charts, Alben,
  Künstler, Playlisten und Stimmungs-Playlisten
- Kategorisierte YouTube-Music-Suche für Songs, Videos, Alben, Künstler und
  öffentliche Playlisten vorbereitet
- Einheitliches Kartenmodell mit Cover, Künstler, Album, Jahr, Laufzeit und
  Verfügbarkeitsangaben
- Detail- und Objektantworten werden neben Songlisten sicher an den Renderer
  weitergegeben

### Sicherheit und Kompatibilität

- Die Katalogschnittstelle bleibt anonym und erhält keine Google-OAuth-Daten
- Es werden weiterhin keine Stream-URLs ermittelt; die Wiedergabe bleibt im
  offiziellen sichtbaren YouTube-Player
- Eingaben für IDs, Länder, Suchfilter und Genre-Parameter werden validiert
- Alle bisherigen Player-, Mixer-, Playlist- und Token-Schutzprüfungen bleiben
  erhalten; neue Integrationstests decken Katalognavigation und Detailantworten
  ab

## 0.11.1 – 2026-10-04

### Behoben

- „Gleiches Genre“ behält den ursprünglich manuell gewählten Titel als festen
  Genre-Anker
- Automatisch ergänzte Titel können den Mix nicht mehr schrittweise in ein
  anderes Genre ziehen
- Freie YouTube-Music-Radio-Vorschläge sind in diesem Modus auf vier Titel pro
  Nachladevorgang begrenzt; der übrige Puffer wird über die erkannten Genres
  ergänzt
- Bereits gespeicherte Playlisten verwenden nach einem Neustart bevorzugt den
  ersten manuell hinzugefügten Titel statt des letzten Auto-Mix-Titels

## 0.11.0 – 2026-10-04

### YouTube-Music-Empfehlungen

- `ytmusicapi` 1.12.3 samt plattformneutraler Python-Abhängigkeiten gebündelt
- Suche liefert bevorzugt echte Songs mit Album-, Künstler- und Laufzeitdaten
- Magischer Mixer verwendet zuerst das echte Radio zum aktuellen YouTube-Music-
  Titel und streut dadurch passende Künstler desselben Spektrums ein
- Radio-Starttitel wechseln mit dem Wiedergabeverlauf, damit lange Sitzungen
  nicht immer dieselbe kleine Ergebnisgruppe erhalten
- Sichtbare Wiedergabe bleibt vollständig im offiziellen YouTube-IFrame-Player
- Google-OAuth-Daten von WebRadio werden weder gelesen noch an Python übergeben

### Ausfallsicherheit und Sicherheit

- Klassischer Genre-Mixer bleibt als automatischer Rückfall erhalten
- Lokaler Hilfsdienst lauscht nur auf `127.0.0.1`, nutzt ein zufälliges
  Sitzungstoken und akzeptiert ausschließlich lokale App-Ursprünge
- Private Laufzeitkonfiguration wird beim Beenden entfernt
- Neue Integrationsprüfungen für Radio-Nachladen, Zugriffsschutz und Python-
  Verfügbarkeit

## 0.10.0 – 2026-10-03

### Magischer Mixer

- Echte fortlaufende Warteschlange mit zwölf vorbereiteten Titeln
- Automatisches Nachladen, sobald nur noch fünf Titel vorausliegen
- Rollender Verlauf statt einer unbegrenzt wachsenden Playlist
- Wechselnde Genre-, Entdeckungs-, Jahres- und Stimmungsanfragen
- Wiederverwendung des am längsten nicht gehörten Titels, wenn YouTube
  vorübergehend keine neuen Treffer liefert
- Künstlerbegrenzung gilt nur noch für die letzten Titel statt für die gesamte
  gespeicherte Playlist
- Bessere Erkennung verschiedener Uploads desselben Songs
- Längere Wartezeiten nach erfolglosen Suchen schonen das YouTube-Kontingent

### Zuverlässigkeit

- Titelwechsel sind an Video-ID und Wiedergabe-Token gebunden
- Verspätete Player-Ereignisse können keinen neuen Titel mehr überspringen
- Stop, Pause, schneller Titelwechsel und Player-Start sind gegeneinander
  abgesichert
- Festhängende oder nicht einbettbare Videos werden automatisch übersprungen
- Such-, Player- und Wiedergabe-Watchdogs verhindern dauerhafte Ladezustände
- Fehlgeschlagene Nachladevorgänge aus einer alten Playlist oder Mix-Art werden
  sicher verworfen
- Manuell gespeicherte Playlist-Titel bleiben bei einem Wiedergabefehler erhalten
- Automatisierte Player- und Renderer-Integrationstests ergänzt

## 0.9.0 – 2026-10-01

### Neues Erscheinungsbild

- Eigenständige MediaHub-Marke ohne irreführenden „YouTube Music“-Schriftzug
- Ausgewogenes Zwei-Flächen-Layout nach dem Vorbild moderner Musik-Clients
- Playlist mit Coverbildern, Künstlerzeile und hervorgehobenem aktiven Titel
- Neuer ruhiger Player-Leerzustand und harmonischere Größenverhältnisse
- Dezente Oberflächen statt vieler einzelner Kästen und Rahmen

## 0.8.2 – 2026-10-01

### Oberfläche

- Playlist-Werkzeuge in ein kompaktes Drei-Punkte-Menü verschoben
- Schmale Playlist-Spalte von unnötigen Schaltflächen befreit
- Doppelte Titelanzeige unter dem YouTube-Player entfernt
- Player verkleinert und Inhaltsaufteilung ruhiger gestaltet

## 0.8.1 – 2026-10-01

### Behoben

- Auto-Mix bevorzugt nun einzelne Songs statt langer Mixe und Playlisten
- Videos über zwölf Minuten werden anhand verfügbarer Laufzeitdaten abgelehnt
- Typische Langform-Titel wie „Full Album“, „1 Hour“ und „Full Concert“ werden
  auch ohne Laufzeitangabe herausgefiltert

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
