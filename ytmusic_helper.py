#!/usr/bin/env python3
"""Small JSON-lines adapter around the bundled ytmusicapi package.

The helper intentionally uses YTMusic without authentication. It never reads the
Google OAuth session owned by WebRadio and it never returns playable stream URLs.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


PLUGIN_ROOT = Path(__file__).resolve().parent
VENDOR_ROOT = PLUGIN_ROOT / "vendor"
if VENDOR_ROOT.is_dir():
    sys.path.insert(0, str(VENDOR_ROOT))


try:
    from ytmusicapi import YTMusic
except Exception as import_error:  # pragma: no cover - reported over the protocol
    YTMusic = None  # type: ignore[assignment]
    IMPORT_ERROR = import_error
else:
    IMPORT_ERROR = None


def _text(value: Any) -> str:
    return str(value or "").strip()


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


def _normalise(item: Any) -> dict[str, Any] | None:
    if not isinstance(item, dict):
        return None
    video_id = _text(item.get("videoId"))
    title = _text(item.get("title"))
    if not video_id or not title:
        return None
    artists = _artist_names(item)
    album = item.get("album") if isinstance(item.get("album"), dict) else {}
    album_name = _text(album.get("name"))
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


class Adapter:
    def __init__(self) -> None:
        if YTMusic is None:
            raise RuntimeError(f"ytmusicapi konnte nicht geladen werden: {IMPORT_ERROR}")
        self.client = YTMusic()

    def search(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        query = query.strip()
        if not query:
            return []
        raw = self.client.search(query, filter="songs", limit=max(1, min(limit, 50)))
        return [normalised for item in raw if (normalised := _normalise(item))][:limit]

    def radio(self, video_id: str, limit: int = 30) -> list[dict[str, Any]]:
        video_id = video_id.strip()
        if not video_id:
            return []
        playlist = self.client.get_watch_playlist(
            videoId=video_id,
            limit=max(1, min(limit, 50)),
            radio=True,
        )
        tracks = playlist.get("tracks") if isinstance(playlist, dict) else []
        return [normalised for item in (tracks or []) if (normalised := _normalise(item))][:limit]


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
                result = adapter.search(_text(request.get("query")), int(request.get("limit") or 20))
            elif action == "radio":
                result = adapter.radio(_text(request.get("videoId")), int(request.get("limit") or 30))
            else:
                raise ValueError("Unbekannte Aktion")
            _write({"id": request_id, "ok": True, "result": result})
        except Exception as error:
            _write({"id": request_id, "ok": False, "error": str(error)[:500]})


if __name__ == "__main__":
    main()
