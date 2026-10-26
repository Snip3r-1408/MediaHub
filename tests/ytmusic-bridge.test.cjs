const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");

const { YtMusicBridge, ROUTE_ACTIONS, allowedOrigin, pythonCandidates } = require("../ytmusic-bridge");

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
    "/v1/home": "home",
    "/v1/explore": "explore",
    "/v1/charts": "charts",
    "/v1/album": "album",
    "/v1/artist": "artist",
    "/v1/playlist": "playlist",
    "/v1/mood-playlists": "mood_playlists"
  });
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
  assert.deepEqual(await allowed.json(), { available: true });

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
