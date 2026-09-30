# Zu MediaHub beitragen

Danke für dein Interesse an MediaHub.

## Fehler melden

Bitte vor einem neuen Issue prüfen, ob das Problem bereits gemeldet wurde. Ein
guter Fehlerbericht enthält:

- MediaHub-Version
- WebRadio-Version
- Betriebssystem
- genaue Schritte zum Nachstellen
- erwartetes und tatsächliches Verhalten
- wenn möglich einen Screenshot und relevante Fehlermeldungen

Keine OAuth-Tokens, Client-Secrets, Passwörter oder anderen privaten Daten
veröffentlichen.

## Ideen vorschlagen

Beschreibe kurz das Problem, das die Funktion lösen soll, und wie sie sich in
die kompakte MediaHub-Oberfläche einfügen könnte. Die aktuelle Planung steht in
der [Roadmap](ROADMAP.md).

## Änderungen einreichen

- Änderungen klein und nachvollziehbar halten.
- Keine Geheimnisse oder nutzerspezifischen Pfade einchecken.
- Plattformunterschiede zwischen Linux und Windows berücksichtigen.
- Nur dokumentierte WebRadio-Plugin-Schnittstellen verwenden.
- YouTube-Richtlinien und Einbettungsbeschränkungen respektieren.
- `plugin.json` und JavaScript vor dem Einreichen validieren.
- Nutzerrelevante Änderungen im Changelog ergänzen.

## Stil

- Oberfläche und Meldungen sind auf Deutsch.
- Bedienelemente sollen kompakt und per Tastatur erreichbar sein.
- Fehler sollen verständlich erklärt und nach Möglichkeit automatisch
  abgefangen werden.
- Sicherheitsrelevante Daten gehören in geschützte Core-Schnittstellen, niemals
  in Renderer-Code oder das Repository.

