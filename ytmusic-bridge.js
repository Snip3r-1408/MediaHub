"use strict";

const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const readline = require("readline");
const { spawn } = require("child_process");

const MAX_BODY_BYTES = 64 * 1024;
const HELPER_TIMEOUT = 15000;

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
  constructor({ root = __dirname, logger = console, spawnProcess = spawn } = {}) {
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
  }

  async start() {
    this.stopping = false;
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
      protocol: 1
    }), { encoding: "utf8", mode: 0o600 });
    try { fs.chmodSync(this.runtimeFile, 0o600); } catch { /* Windows */ }
    return { port, available: this.ready };
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
      return this._json(response, 200, { available: this.ready });
    }
    const action = request.url === "/v1/search" ? "search" : request.url === "/v1/radio" ? "radio" : "";
    if (request.method !== "POST" || !action) return this._json(response, 404, { error: "Nicht gefunden" });
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) throw Object.assign(new Error("Anfrage ist zu groß"), { statusCode: 413 });
        chunks.push(chunk);
      }
      const payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      const result = await this.call(action, payload);
      return this._json(response, 200, { ok: true, result });
    } catch (error) {
      return this._json(response, error.statusCode || 502, { error: error.message || "Anfrage fehlgeschlagen" });
    }
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
    try { fs.rmSync(this.runtimeFile, { force: true }); } catch { /* already gone */ }
    try { fs.rmdirSync(this.runtimeDir); } catch { /* not empty or already gone */ }
  }
}

module.exports = { YtMusicBridge, allowedOrigin, pythonCandidates };
