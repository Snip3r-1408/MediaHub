# MediaHub 0.7.3

Diese Version benötigt WebRadio **1.0.7-alpha.5** oder neuer.

Sie verwendet die neue Player-Schnittstelle von WebRadio: Nach dem Start eines
Treffers steuern die Schaltflächen unten in WebRadio Wiedergabe, Pause, Stopp
und Lautstärke. Playlisten werden lokal gespeichert und spielen ihre Titel
nacheinander, im Kreis oder zufällig ab. Der neue **Auto-Mix** ergänzt die aktive
Playlist aus passenden Suchtreffern, sucht am Ende selbstständig weitere Musik
von ähnlichen Künstlern und aus demselben Genre und überspringt Videos, die
nicht eingebettet werden dürfen. Pro Künstler werden höchstens zwei Titel
automatisch ergänzt. Der sichtbare YouTube-Player läuft über einen lokalen
Plugin-HTTP-Ursprung.

Seit 0.7.2 bleibt der YouTube-Player zwischen zwei Titeln bestehen. Auto-Mix
lädt am Ende der Warteschlange über mehrere Genre- und Ähnlichkeitssuchen neue
Titel nach und besitzt zusätzlich eine Ende-Erkennung, falls YouTube kein
reguläres Ende-Signal sendet.

Seit 0.7.3 werden von YouTube für externe Player gesperrte Versionen sofort
aus Treffern und Warteschlange entfernt. MediaHub wechselt selbstständig zum
nächsten Treffer oder lässt Auto-Mix eine alternative Version suchen.

Zum Installieren den Ordner `mediahub` nach
`~/.config/webradio/plugins/mediahub/` kopieren und WebRadio neu starten.
