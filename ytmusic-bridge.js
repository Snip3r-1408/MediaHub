"use strict";

const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const readline = require("readline");
const { spawn } = require("child_process");

const MAX_BODY_BYTES = 64 * 1024;
const HELPER_TIMEOUT = 15000;
const ROUTE_ACTIONS = Object.freeze({
  "/v1/search": "search",
  "/v1/radio": "radio",
  "/v1/genres": "genres",
  "/v1/home": "home",
  "/v1/explore": "explore",
  "/v1/charts": "charts",
  "/v1/album": "album",
  "/v1/artist": "artist",
  "/v1/playlist": "playlist",
  "/v1/mood-playlists": "mood_playlists"
});
const WEB_SESSION_ROUTES = new Set([
  "/v1/web-session/status",
  "/v1/web-session/login",
  "/v1/web-session/show",
  "/v1/web-session/hide",
  "/v1/web-session/load",
  "/v1/web-session/command",
  "/v1/web-session/reload"
]);
const WEB_SESSION_ID = "youtube-music";
const WEB_SESSION_ORIGIN = "https://music.youtube.com";
const WEB_SESSION_LOGIN_URL = "https://accounts.google.com/ServiceLogin?service=youtube&hl=de&continue=https%3A%2F%2Fmusic.youtube.com%2F";
const WEB_SESSION_RETRY_DELAYS = [0, 500, 1200];

function pythonCandidates(platform = process.platform) {
  return platform === "win32"
    ? [{ command: "py", args: ["-3"] }, { command: "python", args: [] }, { command: "python3", args: [] }]
    : [{ command: "python3", args: [] }, { command: "python", args: [] }];
}

function allowedOrigin(origin) {
  if (!origin || origin === "null" || origin.startsWith("file://")) return origin || "*";
  try {
    const url = new URL(origin);
    return ["127.0.0.1", "localhost", "::1"].includes(url.hostname) ? origin : "";
  } catch {
    return "";
  }
}

class YtMusicBridge {
  constructor({ root = __dirname, logger = console, spawnProcess = spawn, webSession = null, pluginId = "mediahub" } = {}) {
    this.root = root;
    this.logger = logger;
    this.spawnProcess = spawnProcess;
    this.token = crypto.randomBytes(32).toString("hex");
    this.runtimeDir = path.join(root, ".runtime");
    this.runtimeFile = path.join(this.runtimeDir, "ytmusic-bridge.json");
    this.server = null;
    this.child = null;
    this.lines = null;
    this.pending = new Map();
    this.nextId = 1;
    this.ready = false;
    this.stopping = false;
    this.webSession = webSession;
    this.pluginId = pluginId;
    this.webSessionAvailable = false;
    this.webSessionState = null;
    this.webSessionError = null;
    this.webSessionUnsubscribers = [];
  }

  async start() {
    this.stopping = false;
    this._startWebSession();
    await this._startHelper();
    if (this.stopping) throw new Error("YouTube-Music-Engine wurde während des Starts beendet");
    this.server = http.createServer((request, response) => this._handleHttp(request, response));
    await new Promise((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(0, "127.0.0.1", resolve);
    });
    if (this.stopping) {
      this.server.close();
      this.server = null;
      throw new Error("YouTube-Music-Engine wurde während des Starts beendet");
    }
    const port = this.server.address().port;
    fs.mkdirSync(this.runtimeDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(this.runtimeFile, JSON.stringify({
      url: `http://127.0.0.1:${port}`,
      token: this.token,
      available: this.ready,
      webSessionAvailable: this.webSessionAvailable,
      protocol: 1
    }), { encoding: "utf8", mode: 0o600 });
    try { fs.chmodSync(this.runtimeFile, 0o600); } catch { /* Windows */ }
    return { port, available: this.ready, webSessionAvailable: this.webSessionAvailable };
  }

  _startWebSession() {
    if (!this.webSession) return;
    try {
      this.webSession.create({
        pluginId: this.pluginId,
        sessionId: WEB_SESSION_ID,
        origin: WEB_SESSION_ORIGIN
      });
      this.webSessionState = this.webSession.getState(WEB_SESSION_ID);
      this.webSessionUnsubscribers.push(
        this.webSession.onState(WEB_SESSION_ID, state => {
          this.webSessionState = state;
          this.webSessionError = null;
        }),
        this.webSession.onError(WEB_SESSION_ID, error => {
          this.webSessionError = error || { code: "WEB_SESSION_ERROR", message: "Web-Sitzungsfehler" };
        })
      );
      this.webSessionAvailable = true;
      this.logger.info?.("YouTube-Music-Web-Sitzung ist bereit.");
    } catch (error) {
      this.webSessionAvailable = false;
      this.webSessionError = { code: error.code || "WEB_SESSION_UNAVAILABLE", message: error.message };
      this.logger.warn?.(`YouTube-Music-Web-Sitzung ist nicht verfügbar: ${error.message}`);
    }
  }

  async _startHelper() {
    const helper = path.join(this.root, "ytmusic_helper.py");
    let lastError = null;
    for (const candidate of pythonCandidates()) {
      if (this.stopping) throw new Error("YouTube-Music-Engine wurde beendet");
      try {
        await this._spawnCandidate(candidate, helper);
        const status = await this.call("status", {}, 6000);
        this.ready = Boolean(status?.available);
        if (!this.ready) lastError = new Error(status?.error || "ytmusicapi ist nicht verfügbar");
        return;
      } catch (error) {
        lastError = error;
        this._stopHelper();
      }
    }
    this.ready = false;
    this.logger.warn?.(`YouTube-Music-Engine nicht verfügbar: ${lastError?.message || "Python fehlt"}`);
  }

  _spawnCandidate(candidate, helper) {
    return new Promise((resolve, reject) => {
      const child = this.spawnProcess(candidate.command, [...candidate.args, "-u", helper], {
        cwd: this.root,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
        env: {
          ...process.env,
          PYTHONNOUSERSITE: "1",
          PYTHONUNBUFFERED: "1",
          PYTHONDONTWRITEBYTECODE: "1"
        }
      });
      let settled = false;
      const fail = error => {
        if (settled) return;
        settled = true;
        reject(error);
      };
      child.once("error", fail);
      child.once("spawn", () => {
        if (settled) return;
        settled = true;
        child.removeListener("error", fail);
        this._attachHelper(child);
        resolve();
      });
    });
  }

  _attachHelper(child) {
    this.child = child;
    this.lines = readline.createInterface({ input: child.stdout });
    this.lines.on("line", line => {
      let message;
      try { message = JSON.parse(line); } catch { return; }
      const pending = this.pending.get(String(message.id));
      if (!pending) return;
      this.pending.delete(String(message.id));
      clearTimeout(pending.timer);
      if (message.ok) pending.resolve(message.result);
      else pending.reject(new Error(message.error || "YouTube Music Anfrage fehlgeschlagen"));
    });
    child.stderr.on("data", chunk => {
      const message = String(chunk || "").trim();
      if (message) this.logger.warn?.(`YouTube-Music-Engine: ${message.slice(0, 500)}`);
    });
    child.once("exit", () => {
      if (this.child !== child) return;
      this.child = null;
      this.ready = false;
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error("YouTube-Music-Engine wurde beendet"));
      }
      this.pending.clear();
    });
    child.on("error", error => {
      this.logger.warn?.(`YouTube-Music-Engine wurde unerwartet beendet: ${error.message}`);
    });
  }

  call(action, payload = {}, timeout = HELPER_TIMEOUT) {
    if (!this.child?.stdin?.writable) return Promise.reject(new Error("YouTube-Music-Engine ist nicht verfügbar"));
    const id = String(this.nextId++);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("YouTube Music antwortet nicht rechtzeitig"));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(`${JSON.stringify({ id, action, ...payload })}\n`, error => {
        if (!error) return;
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      });
    });
  }

  _cors(request, response) {
    const origin = allowedOrigin(request.headers.origin);
    if (!origin) return false;
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-MediaHub-Token");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Vary", "Origin");
    return true;
  }

  _json(response, status, payload) {
    const body = JSON.stringify(payload);
    response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    response.end(body);
  }

  async _handleHttp(request, response) {
    if (!this._cors(request, response)) return this._json(response, 403, { error: "Origin nicht erlaubt" });
    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }
    if (request.headers["x-mediahub-token"] !== this.token) {
      return this._json(response, 401, { error: "Nicht autorisiert" });
    }
    if (request.method === "GET" && request.url === "/health") {
      return this._json(response, 200, { available: this.ready, webSessionAvailable: this.webSessionAvailable });
    }
    const action = ROUTE_ACTIONS[request.url] || "";
    const webSessionRoute = WEB_SESSION_ROUTES.has(request.url);
    if (request.method !== "POST" || (!action && !webSessionRoute)) return this._json(response, 404, { error: "Nicht gefunden" });
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) throw Object.assign(new Error("Anfrage ist zu groß"), { statusCode: 413 });
        chunks.push(chunk);
      }
      const payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      const result = webSessionRoute
        ? await this._handleWebSessionRoute(request.url, payload)
        : await this.call(action, payload);
      return this._json(response, 200, { ok: true, result });
    } catch (error) {
      return this._json(response, error.statusCode || 502, { error: error.message || "Anfrage fehlgeschlagen" });
    }
  }

  async _handleWebSessionRoute(route, payload) {
    if (!this.webSessionAvailable || !this.webSession) {
      const error = new Error(this.webSessionError?.message || "Die YouTube-Music-Web-Sitzung ist nicht verfügbar");
      error.statusCode = 503;
      throw error;
    }
    if (route === "/v1/web-session/status") {
      return {
        available: true,
        capabilities: this.webSession.getCapabilities(),
        state: this.webSession.getState(WEB_SESSION_ID),
        error: this.webSessionError
      };
    }
    if (route === "/v1/web-session/login") {
      const loaded = await this._loadWebSessionWithRetry(
        () => this.webSession.load(WEB_SESSION_ID, WEB_SESSION_LOGIN_URL),
        "Google-Anmeldung"
      );
      if (!loaded?.success) return { ...loaded, state: this.webSession.getState(WEB_SESSION_ID) };
      const shown = payload?.bounds
        ? await this.webSession.show(WEB_SESSION_ID, payload.bounds)
        : { success: true };
      return {
        success: shown?.success !== false,
        load: loaded,
        ...(shown?.error ? { error: shown.error } : {}),
        state: this.webSession.getState(WEB_SESSION_ID)
      };
    }
    if (route === "/v1/web-session/show") {
      return this.webSession.show(WEB_SESSION_ID, payload?.bounds);
    }
    if (route === "/v1/web-session/hide") {
      return this.webSession.hide(WEB_SESSION_ID);
    }
    if (route === "/v1/web-session/reload") {
      return this.webSession.reload(WEB_SESSION_ID);
    }
    if (route === "/v1/web-session/command") {
      const type = String(payload?.type || "");
      if (!["play", "pause", "stop"].includes(type)) {
        const error = new Error("Ungültiger Web-Sitzungsbefehl");
        error.statusCode = 400;
        throw error;
      }
      return this.webSession.command(WEB_SESSION_ID, { type });
    }
    if (route === "/v1/web-session/load") {
      const videoId = String(payload?.videoId || "");
      if (!/^[A-Za-z0-9_-]{6,32}$/.test(videoId)) {
        const error = new Error("Ungültige YouTube-Music-Titel-ID");
        error.statusCode = 400;
        throw error;
      }
      const target = new URL("/watch", `${WEB_SESSION_ORIGIN}/`);
      target.searchParams.set("v", videoId);
      const loaded = await this._loadWebSessionWithRetry(
        () => this.webSession.load(WEB_SESSION_ID, target.href),
        "YouTube-Music-Titel"
      );
      if (!loaded?.success || payload?.autoplay === false) return loaded;
      const playback = await this.webSession.command(WEB_SESSION_ID, { type: "play" });
      return { success: true, playback };
    }
    throw Object.assign(new Error("Nicht gefunden"), { statusCode: 404 });
  }

  async _loadWebSessionWithRetry(load, label) {
    let result = null;
    for (let attempt = 0; attempt < WEB_SESSION_RETRY_DELAYS.length; attempt += 1) {
      const delay = WEB_SESSION_RETRY_DELAYS[attempt];
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      result = await load();
      if (result?.success) return result;
      if (attempt < WEB_SESSION_RETRY_DELAYS.length - 1) {
        this.logger.warn?.(`${label} konnte nicht geladen werden; neuer Versuch ${attempt + 2}/${WEB_SESSION_RETRY_DELAYS.length}.`);
      }
    }
    return result || {
      success: false,
      error: { code: "LOAD_FAILED", message: `${label} konnte nicht geladen werden.` }
    };
  }

  _stopHelper() {
    this.lines?.close();
    this.lines = null;
    if (this.child) {
      this.child.removeAllListeners("exit");
      this.child.kill();
      this.child = null;
    }
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error("YouTube-Music-Engine wurde beendet"));
    }
    this.pending.clear();
  }

  stop() {
    this.stopping = true;
    this.ready = false;
    this.server?.close();
    this.server = null;
    this._stopHelper();
    for (const unsubscribe of this.webSessionUnsubscribers.splice(0)) {
      try { unsubscribe(); } catch { /* already removed */ }
    }
    if (this.webSessionAvailable) {
      try { this.webSession.hide(WEB_SESSION_ID); } catch { /* already gone */ }
    }
    this.webSessionAvailable = false;
    this.webSessionState = null;
    try { fs.rmSync(this.runtimeFile, { force: true }); } catch { /* already gone */ }
    try { fs.rmdirSync(this.runtimeDir); } catch { /* not empty or already gone */ }
  }
}

module.exports = {
  YtMusicBridge,
  ROUTE_ACTIONS,
  WEB_SESSION_ROUTES,
  WEB_SESSION_ID,
  WEB_SESSION_ORIGIN,
  WEB_SESSION_LOGIN_URL,
  WEB_SESSION_RETRY_DELAYS,
  allowedOrigin,
  pythonCandidates
};
