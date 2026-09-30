# Sicherheit

## Unterstützte Versionen

Sicherheitskorrekturen werden grundsätzlich für die jeweils neueste auf GitHub
veröffentlichte MediaHub-Version bereitgestellt.

## Sicherheitsproblem melden

Bitte Sicherheitsprobleme nicht mit vollständigen technischen Details in einem
öffentlichen Issue veröffentlichen. Nutze stattdessen die privaten
Sicherheitsmeldungen des GitHub-Repositories, sofern diese aktiviert sind.

Falls keine private Meldemöglichkeit verfügbar ist, erstelle zunächst ein Issue
ohne Exploit-Code, Tokens oder persönliche Daten und bitte um einen privaten
Kontaktweg.

## Geheimnisse und Zugangsdaten

MediaHub darf niemals folgende Daten im Repository speichern:

- Google-Passwörter
- OAuth-Zugriffs- oder Aktualisierungstokens
- Client-Secrets
- persönliche API-Schlüssel
- nutzerspezifische Konfigurationsdateien

OAuth-Daten müssen durch sichere, isolierte WebRadio-Core-Schnittstellen
verwaltet werden. Sensible Werte gehören nicht in den Renderer und nicht in
Screenshots oder Fehlerberichte.

## Abhängigkeiten und externe Inhalte

MediaHub zeigt Inhalte externer Dienste an. Suchergebnisse, Titel, Kanalnamen
und Vorschaubilder sind nicht vertrauenswürdig und müssen als reine Daten
behandelt werden. Einbettungs- und Zugriffsbeschränkungen externer Dienste
werden nicht umgangen.

