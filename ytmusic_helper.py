#!/usr/bin/env python3
"""Small JSON-lines adapter around the bundled ytmusicapi package.

The helper intentionally uses YTMusic without authentication. It never reads the
Google OAuth session owned by WebRadio and it never returns playable stream URLs.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


PLUGIN_ROOT = Path(__file__).resolve().parent
VENDOR_ROOT = PLUGIN_ROOT / "vendor"
if VENDOR_ROOT.is_dir():
    sys.path.insert(0, str(VENDOR_ROOT))

import requests


try:
    from ytmusicapi import YTMusic
except Exception as import_error:  # pragma: no cover - reported over the protocol
    YTMusic = None  # type: ignore[assignment]
    IMPORT_ERROR = import_error
else:
    IMPORT_ERROR = None


def _text(value: Any) -> str:
    return str(value or "").strip()


def _artist_identity(value: Any) -> str:
    return re.sub(r"[^\w]+", " ", _text(value).casefold(), flags=re.UNICODE).strip()


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return max(0, int(value))
    except (TypeError, ValueError):
        match = re.search(r"\d+", _text(value).replace(",", ""))
        return int(match.group()) if match else max(0, default)


def _artist_names(item: dict[str, Any]) -> list[str]:
    artists = item.get("artists") or []
    names = [_text(artist.get("name")) for artist in artists if isinstance(artist, dict)]
    return [name for name in names if name]


def _thumbnail(item: dict[str, Any]) -> str:
    thumbnails = item.get("thumbnails") or item.get("thumbnail") or []
    if not isinstance(thumbnails, list) or not thumbnails:
        return ""
    candidates = [thumb for thumb in thumbnails if isinstance(thumb, dict) and thumb.get("url")]
    if not candidates:
        return ""
    candidates.sort(key=lambda thumb: int(thumb.get("width") or 0) * int(thumb.get("height") or 0))
    return _text(candidates[-1].get("url"))


def _duration_seconds(item: dict[str, Any]) -> int:
    raw = item.get("duration_seconds")
    if raw is not None:
        try:
            return max(0, int(raw))
        except (TypeError, ValueError):
            pass
    duration = _text(item.get("duration") or item.get("length"))
    if not duration:
        return 0
    try:
        return sum(int(part) * (60 ** index) for index, part in enumerate(reversed(duration.split(":"))))
    except ValueError:
        return 0


def _entity_kind(item: dict[str, Any]) -> str:
    result_type = _text(item.get("resultType")).lower()
    if result_type in {"song", "video", "album", "artist", "playlist"}:
        return result_type
    if item.get("videoId"):
        return "song"
    browse_id = _text(item.get("browseId"))
    if browse_id.startswith("MPRE"):
        return "album"
    if browse_id.startswith(("VL", "PL", "OLAK", "RD")) or item.get("playlistId"):
        return "playlist"
    if browse_id.startswith(("UC", "MPLA")):
        return "artist"
    return "collection"


def _entity(item: Any) -> dict[str, Any] | None:
    """Return a stable, renderer-friendly public catalogue entity."""
    if not isinstance(item, dict):
        return None
    title = _text(item.get("title") or item.get("name") or item.get("artist"))
    if not title:
        return None
    kind = _entity_kind(item)
    artists = _artist_names(item)
    author = item.get("author")
    if not artists and isinstance(author, list):
        artists = [_text(entry.get("name")) for entry in author if isinstance(entry, dict)]
        artists = [name for name in artists if name]
    elif not artists and isinstance(author, dict):
        artists = [_text(author.get("name"))] if _text(author.get("name")) else []
    elif not artists and isinstance(author, str):
        artists = [_text(author)]
    if not artists and _text(item.get("artist")):
        artists = [_text(item.get("artist"))]
    album = item.get("album")
    album_name = _text(album.get("name")) if isinstance(album, dict) else _text(album)
    browse_id = _text(item.get("browseId"))
    playlist_id = _text(item.get("playlistId"))
    if not playlist_id and browse_id.startswith("VL"):
        playlist_id = browse_id[2:]
    return {
        "kind": kind,
        "id": _text(item.get("videoId")) or browse_id or playlist_id,
        "videoId": _text(item.get("videoId")),
        "browseId": browse_id,
        "playlistId": playlist_id,
        "title": title,
        "subtitle": ", ".join(artists)
        or _text(item.get("description"))
        or _text(item.get("type"))
        or _text(item.get("year")),
        "channel": ", ".join(artists) or "YouTube Music",
        "artists": artists,
        "album": album_name,
        "thumbnail": _thumbnail(item),
        "durationSeconds": _duration_seconds(item),
        "year": _text(item.get("year")),
        "isAvailable": item.get("isAvailable", True) is not False,
        "isExplicit": item.get("isExplicit", False) is True,
        "source": "ytmusicapi",
    }


def _normalise(item: Any) -> dict[str, Any] | None:
    if not isinstance(item, dict):
        return None
    video_id = _text(item.get("videoId"))
    title = _text(item.get("title"))
    if not video_id or not title:
        return None
    artists = _artist_names(item)
    album = item.get("album")
    album_name = _text(album.get("name")) if isinstance(album, dict) else _text(album)
    return {
        "id": video_id,
        "title": title,
        "channel": ", ".join(artists) or _text(item.get("author")) or "YouTube Music",
        "artists": artists,
        "album": album_name,
        "thumbnail": _thumbnail(item),
        "durationSeconds": _duration_seconds(item),
        "isAvailable": item.get("isAvailable", True) is not False,
        "source": "ytmusicapi",
    }


def _entities(items: Any) -> list[dict[str, Any]]:
    return [entity for item in (items or []) if (entity := _entity(item))]


def _identifier(value: str, *, prefixes: tuple[str, ...] = ()) -> str:
    value = value.strip()
    if not value or len(value) > 256 or not re.fullmatch(r"[A-Za-z0-9_\-]+", value):
        raise ValueError("Ungültige YouTube-Music-ID")
    if prefixes and not value.startswith(prefixes):
        raise ValueError("YouTube-Music-ID hat einen ungültigen Typ")
    return value


class Adapter:
    def __init__(self) -> None:
        if YTMusic is None:
            raise RuntimeError(f"ytmusicapi konnte nicht geladen werden: {IMPORT_ERROR}")
        self.client = YTMusic()

    SEARCH_FILTERS = {
        "songs", "videos", "albums", "artists", "playlists",
        "community_playlists", "featured_playlists",
    }

    def search(self, query: str, limit: int = 20, filter_name: str = "songs") -> list[dict[str, Any]]:
        query = query.strip()
        if not query:
            return []
        filter_name = filter_name.strip().lower() or "songs"
        if filter_name not in self.SEARCH_FILTERS:
            raise ValueError("Unbekannter Suchfilter")
        safe_limit = max(1, min(limit, 50))
        raw = self.client.search(query, filter=filter_name, limit=safe_limit)
        if filter_name == "songs":
            return [normalised for item in raw if (normalised := _normalise(item))][:safe_limit]
        return _entities(raw)[:safe_limit]

    def radio(self, video_id: str, limit: int = 30) -> list[dict[str, Any]]:
        video_id = _identifier(video_id)
        playlist = self.client.get_watch_playlist(
            videoId=video_id,
            limit=max(1, min(limit, 50)),
            radio=True,
        )
        tracks = playlist.get("tracks") if isinstance(playlist, dict) else []
        return [normalised for item in (tracks or []) if (normalised := _normalise(item))][:limit]

    def genres(self, artist: str) -> list[str]:
        artist = artist.strip()
        if not artist or len(artist) > 160:
            raise ValueError("Ungültiger Künstlername")
        response = requests.get(
            "https://musicbrainz.org/ws/2/artist/",
            params={"query": f'artist:"{artist}"', "fmt": "json", "limit": 5},
            headers={
                "Accept": "application/json",
                "User-Agent": "MediaHub/0.13.5 (https://github.com/Snip3r-1408/MediaHub)",
            },
            timeout=8,
        )
        response.raise_for_status()
        identity = _artist_identity(artist)
        matches = response.json().get("artists") or []
        match = next(
            (entry for entry in matches if _artist_identity(entry.get("name")) == identity),
            None,
        )
        if not isinstance(match, dict):
            return []
        tags = sorted(
            (tag for tag in (match.get("tags") or []) if _text(tag.get("name")) and _safe_int(tag.get("count")) >= 1),
            key=lambda tag: _safe_int(tag.get("count")),
            reverse=True,
        )
        names: list[str] = []
        for tag in tags:
            name = _text(tag.get("name")).casefold()
            if name and name not in {"seen live", "favorites", "american"} and name not in names:
                names.append(name)
        return names[:8]

    def home(self, limit: int = 6) -> list[dict[str, Any]]:
        rows = self.client.get_home(limit=max(1, min(limit, 10)))
        sections = []
        for row in rows or []:
            if not isinstance(row, dict):
                continue
            items = _entities(row.get("contents"))
            if items:
                sections.append({"title": _text(row.get("title")) or "Für dich", "items": items})
        return sections

    def explore(self) -> list[dict[str, Any]]:
        data = self.client.get_explore() or {}
        sections: list[dict[str, Any]] = []
        definitions = (
            ("new_releases", "Neue Veröffentlichungen"),
            ("top_songs", "Top-Songs"),
            ("trending", "Im Trend"),
            ("new_videos", "Neue Musikvideos"),
        )
        for key, title in definitions:
            raw = data.get(key) or []
            if isinstance(raw, dict):
                raw = raw.get("items") or []
            items = _entities(raw)
            if items:
                sections.append({"title": title, "items": items})
        moods = []
        for mood in data.get("moods_and_genres") or []:
            if isinstance(mood, dict) and _text(mood.get("title")) and _text(mood.get("params")):
                moods.append({
                    "kind": "mood",
                    "id": _text(mood.get("params")),
                    "title": _text(mood.get("title")),
                    "params": _text(mood.get("params")),
                    "source": "ytmusicapi",
                })
        if moods:
            sections.append({"title": "Stimmungen und Genres", "items": moods})
        return sections

    def charts(self, country: str = "DE") -> dict[str, Any]:
        country = country.strip().upper() or "DE"
        if not re.fullmatch(r"[A-Z]{2}", country):
            raise ValueError("Ungültiger Ländercode")
        data = self.client.get_charts(country=country) or {}
        sections = []
        for key, title in (("videos", "Top-Musikvideos"), ("daily", "Tagescharts"),
                           ("weekly", "Wochencharts"), ("artists", "Top-Künstler"),
                           ("genres", "Genre-Charts"), ("languages", "Sprachcharts")):
            items = _entities(data.get(key))
            if items:
                sections.append({"title": title, "items": items})
        countries = data.get("countries") if isinstance(data.get("countries"), dict) else {}
        return {
            "country": country,
            "selected": _text((countries.get("selected") or {}).get("text")
                              if isinstance(countries.get("selected"), dict) else countries.get("selected")),
            "availableCountries": [code for code in countries.get("options") or [] if isinstance(code, str)],
            "sections": sections,
        }

    def album(self, browse_id: str) -> dict[str, Any]:
        browse_id = _identifier(browse_id, prefixes=("MPRE",))
        data = self.client.get_album(browse_id) or {}
        artists = _artist_names(data)
        return {
            "kind": "album",
            "browseId": browse_id,
            "title": _text(data.get("title")),
            "subtitle": ", ".join(artists),
            "artists": artists,
            "year": _text(data.get("year")),
            "description": _text(data.get("description")),
            "thumbnail": _thumbnail(data),
            "durationSeconds": _duration_seconds(data),
            "tracks": [track for item in data.get("tracks") or [] if (track := _normalise(item))],
            "otherVersions": _entities(data.get("other_versions")),
            "related": _entities(data.get("related_recommendations")),
            "source": "ytmusicapi",
        }

    def artist(self, channel_id: str) -> dict[str, Any]:
        channel_id = _identifier(channel_id, prefixes=("UC", "MPLA"))
        data = self.client.get_artist(channel_id) or {}
        sections = []
        for key, title in (("songs", "Songs"), ("albums", "Alben"), ("singles", "Singles"),
                           ("videos", "Videos"), ("related", "Ähnliche Künstler")):
            section = data.get(key)
            raw = section.get("results") if isinstance(section, dict) else []
            items = _entities(raw)
            if items:
                sections.append({"title": title, "items": items})
        return {
            "kind": "artist",
            "browseId": channel_id,
            "title": _text(data.get("name")),
            "description": _text(data.get("description")),
            "thumbnail": _thumbnail(data),
            "subscribers": _text(data.get("subscribers")),
            "monthlyListeners": _text(data.get("monthlyListeners")),
            "radioId": _text(data.get("radioId")),
            "shuffleId": _text(data.get("shuffleId")),
            "sections": sections,
            "source": "ytmusicapi",
        }

    def playlist(self, playlist_id: str, limit: int = 100) -> dict[str, Any]:
        playlist_id = _identifier(playlist_id, prefixes=("PL", "VL", "OLAK", "RD"))
        safe_limit = max(1, min(limit, 200))
        data = self.client.get_playlist(playlist_id, limit=safe_limit) or {}
        author = data.get("author") if isinstance(data.get("author"), dict) else {}
        return {
            "kind": "playlist",
            "playlistId": playlist_id.removeprefix("VL"),
            "title": _text(data.get("title")),
            "subtitle": _text(author.get("name")),
            "description": _text(data.get("description")),
            "thumbnail": _thumbnail(data),
            "trackCount": _safe_int(data.get("trackCount"), len(data.get("tracks") or [])),
            "durationSeconds": _duration_seconds(data),
            "tracks": [track for item in data.get("tracks") or [] if (track := _normalise(item))],
            "related": _entities(data.get("related")),
            "source": "ytmusicapi",
        }

    def mood_playlists(self, params: str) -> list[dict[str, Any]]:
        params = params.strip()
        if not params or len(params) > 512 or not re.fullmatch(r"[A-Za-z0-9_\-=]+", params):
            raise ValueError("Ungültige Stimmungs-ID")
        return _entities(self.client.get_mood_playlists(params))


def _write(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def main() -> None:
    adapter: Adapter | None = None
    startup_error = ""
    try:
        adapter = Adapter()
    except Exception as error:  # keep process alive so status can explain the issue
        startup_error = str(error)

    for line in sys.stdin:
        request_id = None
        try:
            request = json.loads(line)
            request_id = request.get("id")
            action = _text(request.get("action"))
            if action == "status":
                _write({
                    "id": request_id,
                    "ok": bool(adapter),
                    "result": {"available": bool(adapter), "error": startup_error},
                })
                continue
            if adapter is None:
                raise RuntimeError(startup_error or "ytmusicapi ist nicht verfügbar")
            if action == "search":
                result = adapter.search(
                    _text(request.get("query")),
                    int(request.get("limit") or 20),
                    _text(request.get("filter")) or "songs",
                )
            elif action == "radio":
                result = adapter.radio(_text(request.get("videoId")), int(request.get("limit") or 30))
            elif action == "genres":
                result = adapter.genres(_text(request.get("artist")))
            elif action == "home":
                result = adapter.home(int(request.get("limit") or 6))
            elif action == "explore":
                result = adapter.explore()
            elif action == "charts":
                result = adapter.charts(_text(request.get("country")) or "DE")
            elif action == "album":
                result = adapter.album(_text(request.get("browseId")))
            elif action == "artist":
                result = adapter.artist(_text(request.get("browseId")))
            elif action == "playlist":
                result = adapter.playlist(
                    _text(request.get("playlistId")), int(request.get("limit") or 100)
                )
            elif action == "mood_playlists":
                result = adapter.mood_playlists(_text(request.get("params")))
            else:
                raise ValueError("Unbekannte Aktion")
            _write({"id": request_id, "ok": True, "result": result})
        except Exception as error:
            _write({"id": request_id, "ok": False, "error": str(error)[:500]})


if __name__ == "__main__":
    main()
