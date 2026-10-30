const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");

const {
  YtMusicBridge,
  ROUTE_ACTIONS,
  WEB_SESSION_ROUTES,
  allowedOrigin,
  pythonCandidates
} = require("../ytmusic-bridge");

test("bridge origin checks accept only the local app surface", () => {
  assert.equal(allowedOrigin("null"), "null");
  assert.equal(allowedOrigin("http://127.0.0.1:1234"), "http://127.0.0.1:1234");
  assert.equal(allowedOrigin("http://localhost:1234"), "http://localhost:1234");
  assert.equal(allowedOrigin("https://example.com"), "");
  assert.equal(pythonCandidates("win32")[0].command, "py");
  assert.equal(pythonCandidates("linux")[0].command, "python3");
  assert.deepEqual(ROUTE_ACTIONS, {
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
  assert.ok(WEB_SESSION_ROUTES.has("/v1/web-session/load"));
  assert.ok(WEB_SESSION_ROUTES.has("/v1/web-session/command"));
});

test("bridge writes a private runtime config and rejects requests without its token", async t => {
  const sourceRoot = path.resolve(__dirname, "..");
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mediahub-bridge-test-"));
  fs.copyFileSync(path.join(sourceRoot, "ytmusic_helper.py"), path.join(tempRoot, "ytmusic_helper.py"));
  fs.symlinkSync(path.join(sourceRoot, "vendor"), path.join(tempRoot, "vendor"), "dir");
  const bridge = new YtMusicBridge({ root: tempRoot, logger: { warn() {} } });
  t.after(() => {
    bridge.stop();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  const started = await bridge.start();
  assert.equal(started.available, true);
  const runtimeFile = path.join(tempRoot, ".runtime", "ytmusic-bridge.json");
  const config = JSON.parse(fs.readFileSync(runtimeFile, "utf8"));
  assert.match(config.token, /^[a-f0-9]{64}$/);
  if (process.platform !== "win32") assert.equal(fs.statSync(runtimeFile).mode & 0o777, 0o600);

  const denied = await fetch(`${config.url}/health`);
  assert.equal(denied.status, 401);
  const allowed = await fetch(`${config.url}/health`, { headers: { "X-MediaHub-Token": config.token } });
  assert.equal(allowed.status, 200);
  assert.deepEqual(await allowed.json(), { available: true, webSessionAvailable: false });

  const routed = [];
  bridge.call = async (action, payload) => {
    routed.push({ action, payload });
    return { action, marker: payload.marker };
  };
  for (const [route, action] of Object.entries(ROUTE_ACTIONS)) {
    const response = await fetch(`${config.url}${route}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MediaHub-Token": config.token
      },
      body: JSON.stringify({ marker: route })
    });
    assert.equal(response.status, 200, route);
    assert.deepEqual(await response.json(), { ok: true, result: { action, marker: route } });
  }
  assert.deepEqual(routed.map(entry => entry.action), Object.values(ROUTE_ACTIONS));
});

test("bridge exposes only validated YouTube Music web-session operations", async t => {
  const sourceRoot = path.resolve(__dirname, "..");
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mediahub-web-session-test-"));
  fs.copyFileSync(path.join(sourceRoot, "ytmusic_helper.py"), path.join(tempRoot, "ytmusic_helper.py"));
  fs.symlinkSync(path.join(sourceRoot, "vendor"), path.join(tempRoot, "vendor"), "dir");
  const calls = [];
  const state = { state: "paused", title: "Test", artist: "Artist", duration: 180, position: 12 };
  const webSession = {
    create(options) { calls.push(["create", options]); return { sessionId: options.sessionId, state: "idle" }; },
    getState(sessionId) { calls.push(["getState", sessionId]); return { ...state }; },
    getCapabilities() { return { commands: { play: true, pause: true, stop: true }, encryptedMedia: false }; },
    onState(_sessionId, callback) { callback(state); return () => {}; },
    onError() { return () => {}; },
    openLogin(sessionId) { calls.push(["openLogin", sessionId]); return Promise.resolve({ success: true }); },
    show(sessionId, bounds) { calls.push(["show", sessionId, bounds]); return Promise.resolve({ success: true }); },
    hide(sessionId) { calls.push(["hide", sessionId]); return { success: true }; },
    reload(sessionId) { calls.push(["reload", sessionId]); return { success: true }; },
    load(sessionId, url) { calls.push(["load", sessionId, url]); return Promise.resolve({ success: true }); },
    command(sessionId, command) { calls.push(["command", sessionId, command]); return Promise.resolve({ success: true }); }
  };
  const bridge = new YtMusicBridge({ root: tempRoot, logger: { info() {}, warn() {} }, webSession });
  t.after(() => {
    bridge.stop();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  await bridge.start();
  const config = JSON.parse(fs.readFileSync(path.join(tempRoot, ".runtime", "ytmusic-bridge.json"), "utf8"));
  assert.equal(config.webSessionAvailable, true);
  const request = async (route, payload = {}) => {
    const response = await fetch(`${config.url}${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-MediaHub-Token": config.token },
      body: JSON.stringify(payload)
    });
    return { response, body: await response.json() };
  };

  const status = await request("/v1/web-session/status");
  assert.equal(status.response.status, 200);
  assert.equal(status.body.result.available, true);

  const bounds = { x: 200, y: 100, width: 800, height: 600 };
  const login = await request("/v1/web-session/login", { bounds });
  assert.equal(login.body.result.success, true);
  const loaded = await request("/v1/web-session/load", { videoId: "qMXESlny4-I", autoplay: true });
  assert.equal(loaded.body.result.success, true);
  assert.ok(calls.some(call => call[0] === "load" && call[2] === "https://music.youtube.com/watch?v=qMXESlny4-I"));
  assert.ok(calls.some(call => call[0] === "command" && call[2].type === "play"));

  const invalid = await request("/v1/web-session/load", { videoId: "https://evil.invalid/" });
  assert.equal(invalid.response.status, 400);
});

test("browser client forwards structured catalogue responses to the renderer", async () => {
  let messageHandler;
  const posted = [];
  const parent = { postMessage(message) { posted.push(message); } };
  const requests = [];
  const context = {
    URL,
    Set,
    Date,
    Promise,
    Error,
    window: {
      parent,
      addEventListener(type, handler) {
        if (type === "message") messageHandler = handler;
      }
    },
    fetch: async (url, options = {}) => {
      requests.push({ url, options });
      if (String(url).startsWith(".runtime/")) {
        return {
          ok: true,
          json: async () => ({
            protocol: 1,
            available: true,
            url: "http://127.0.0.1:34567",
            token: "a".repeat(64)
          })
        };
      }
      return {
        ok: true,
        json: async () => ({
          ok: true,
          result: { kind: "album", title: "Testalbum", tracks: [] }
        })
      };
    }
  };
  vm.runInNewContext(
    fs.readFileSync(path.resolve(__dirname, "..", "ytmusic-client.js"), "utf8"),
    context
  );
  assert.equal(typeof messageHandler, "function");
  await messageHandler({
    source: parent,
    data: {
      source: "mediahub-ytmusic-parent",
      requestId: "detail-1",
      route: "/v1/album",
      payload: { browseId: "MPREtest" }
    }
  });
  assert.equal(requests.length, 2);
  assert.equal(requests[1].url, "http://127.0.0.1:34567/v1/album");
  assert.deepEqual(JSON.parse(JSON.stringify(posted[0])), {
    source: "mediahub-ytmusic-client",
    requestId: "detail-1",
    ok: true,
    result: { kind: "album", title: "Testalbum", tracks: [] }
  });
});
