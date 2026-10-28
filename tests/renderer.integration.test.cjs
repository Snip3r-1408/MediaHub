const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const RENDERER_PATH = path.join(__dirname, "..", "renderer.js");

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

async function flush(times = 12) {
  for (let index = 0; index < times; index += 1) await Promise.resolve();
}

class FakeClassList {
  constructor(owner) {
    this.owner = owner;
    this.values = new Set();
  }

  reset(value) {
    this.values = new Set(String(value || "").split(/\s+/).filter(Boolean));
    this.sync();
  }

  sync() { this.owner._className = [...this.values].join(" "); }
  contains(value) { return this.values.has(value); }
  add(...values) { values.forEach(value => this.values.add(value)); this.sync(); }
  remove(...values) { values.forEach(value => this.values.delete(value)); this.sync(); }
  toggle(value, force) {
    const enabled = force === undefined ? !this.values.has(value) : Boolean(force);
    if (enabled) this.values.add(value);
    else this.values.delete(value);
    this.sync();
    return enabled;
  }
}

class FakeElement {
  constructor(tagName, harness) {
    this.tagName = String(tagName).toUpperCase();
    this.harness = harness;
    this.children = [];
    this.parentNode = null;
    this.listeners = new Map();
    this.attributes = new Map();
    this.classList = new FakeClassList(this);
    this._className = "";
    this._textContent = "";
    this._innerHTML = "";
    this.value = "";
    this.hidden = false;
    this.selected = false;
    if (this.tagName === "IFRAME") {
      this.contentWindow = {
        postMessage: (message, origin) => {
          harness.framePosts.push({ ...message, origin, frame: this });
          harness.handleFramePost?.(this, message, origin);
        }
      };
      harness.iframes.push(this);
    }
  }

  set className(value) { this.classList.reset(value); }
  get className() { return this._className; }
  set textContent(value) { this._textContent = String(value ?? ""); }
  get textContent() { return this._textContent; }
  set innerHTML(value) {
    this._innerHTML = String(value ?? "");
    if (this.tagName === "TEXTAREA") {
      this.value = this._innerHTML
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
    }
  }
  get innerHTML() { return this._innerHTML; }

  append(...nodes) {
    for (const node of nodes) {
      if (!node) continue;
      node.parentNode = this;
      this.children.push(node);
      if (this.tagName === "SELECT" && node.tagName === "OPTION"
        && (node.selected || !this.value)) this.value = node.value;
    }
  }

  appendChild(node) { this.append(node); return node; }

  replaceChildren(...nodes) {
    this.children.forEach(node => { node.parentNode = null; });
    this.children = [];
    this.append(...nodes);
  }

  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }

  addEventListener(type, listener, options = {}) {
    const entries = this.listeners.get(type) || [];
    entries.push({ listener, once: Boolean(options?.once) });
    this.listeners.set(type, entries);
    if (this.tagName === "IFRAME" && type === "load" && !this.loadQueued) {
      this.loadQueued = true;
      queueMicrotask(() => this.dispatchEvent({ type: "load" }));
    }
  }

  dispatchEvent(event) {
    const actual = event || {};
    actual.type ||= "unknown";
    actual.target ||= this;
    actual.currentTarget = this;
    actual.preventDefault ||= () => {};
    actual.stopPropagation ||= () => {};
    const entries = [...(this.listeners.get(actual.type) || [])];
    for (const entry of entries) {
      entry.listener(actual);
      if (entry.once) {
        const current = this.listeners.get(actual.type) || [];
        this.listeners.set(actual.type, current.filter(candidate => candidate !== entry));
      }
    }
    return true;
  }

  querySelector(selector) {
    const descendants = [];
    const visit = node => {
      node.children.forEach(child => { descendants.push(child); visit(child); });
    };
    visit(this);
    if (selector === "p:not(.mh-eyebrow)") {
      return descendants.find(node => node.tagName === "P" && !node.classList.contains("mh-eyebrow")) || null;
    }
    if (selector.startsWith(".")) {
      return descendants.find(node => node.classList.contains(selector.slice(1))) || null;
    }
    return descendants.find(node => node.tagName === selector.toUpperCase()) || null;
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter(child => child !== this);
    this.parentNode = null;
  }
}

function instrumentedRenderer() {
  const source = fs.readFileSync(RENDERER_PATH, "utf8");
  const marker = "    renderPicker();\n    renderPlayMode();";
  assert.ok(source.includes(marker), "renderer test hook marker must stay recognizable");
  return source.replace(marker, `    window.__mediaHubRendererTest = {
      play,
      receivePlayerMessage,
      ensureMixBuffer,
      scheduleMixRetry,
      nodes: {
        picker,
        mixStylePicker,
        mixButton,
        homeNav,
        discoverNav,
        libraryNav,
        catalogueView,
        resultsView,
        playlistOverview
      },
      get frame() { return frame; },
      get playbackToken() { return playbackToken; },
      get mixRefillPromise() { return mixRefillPromise; },
      playlists() { return JSON.parse(JSON.stringify(playlists)); }
    };
${marker}`);
}

async function createHarness(options = {}) {
  const framePosts = [];
  const iframes = [];
  const timers = [];
  const windowListeners = new Map();
  const storage = new Map(Object.entries(options.storage || {}));
  const activations = [];
  const searchCalls = [];
  const assetRequests = [];
  const harnessState = { framePosts, iframes };
  let nextTimerId = 1;
  let plugin = null;
  let viewRenderer = null;

  const document = {
    elements: [],
    head: null,
    body: null,
    createElement(tag) {
      const element = new FakeElement(tag, harnessState);
      this.elements.push(element);
      return element;
    },
    createElementNS(_namespace, tag) { return this.createElement(tag); },
    getElementById(id) { return this.elements.find(element => element.id === id) || null; }
  };
  document.head = document.createElement("head");
  document.body = document.createElement("body");

  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  };

  const playerAPI = {
    setActiveProvider() {
      if (options.setActiveProvider) return options.setActiveProvider();
      if (!options.deferActivations) return Promise.resolve({ ok: true });
      const activation = deferred();
      activations.push(activation);
      return activation.promise;
    },
    reportProviderState(...args) {
      options.providerReports?.push(args);
      return Promise.resolve();
    },
    onCommand(listener) {
      playerAPI.commandListener = listener;
      return () => { playerAPI.commandListener = null; };
    }
  };

  const mediaHubAuth = {
    status: async () => ({ connected: true }),
    signIn: async () => {},
    signOut: async () => {},
    search(query) {
      searchCalls.push(query);
      return options.search ? options.search(query, searchCalls.length) : Promise.resolve([]);
    }
  };

  const window = {
    mediaHubAuth,
    playerAPI,
    pluginHttpAPI: {
      getAssetUrl: async (_pluginId, relativePath) => {
        assetRequests.push(relativePath);
        return `http://127.0.0.1:35785/mediahub/${relativePath}`;
      }
    },
    uiRegistry: {
      registerView(_id, _name, renderer) { viewRenderer = renderer; }
    },
    registerPlugin(value) { plugin = value; },
    addEventListener(type, listener) {
      const listeners = windowListeners.get(type) || new Set();
      listeners.add(listener);
      windowListeners.set(type, listeners);
    },
    removeEventListener(type, listener) { windowListeners.get(type)?.delete(listener); },
    setTimeout(callback, delay) {
      const timer = { id: nextTimerId++, callback, delay, cleared: false };
      timers.push(timer);
      return timer.id;
    },
    clearTimeout(id) {
      const timer = timers.find(candidate => candidate.id === id);
      if (timer) timer.cleared = true;
    },
    prompt: () => null,
    confirm: () => true
  };

  harnessState.handleFramePost = (frame, message) => {
    if (!String(frame.src || "").includes("ytmusic-client.html")
      || message?.source !== "mediahub-ytmusic-parent") return;
    Promise.resolve(options.ytMusic?.(message.route, message.payload) ?? null).then(result => {
      const data = result === null
        ? { source: "mediahub-ytmusic-client", requestId: message.requestId, ok: false, error: "unavailable" }
        : { source: "mediahub-ytmusic-client", requestId: message.requestId, ok: true, result };
      for (const listener of windowListeners.get("message") || []) {
        listener({ source: frame.contentWindow, origin: "http://127.0.0.1:35785", data });
      }
    });
  };

  const context = vm.createContext({
    window,
    document,
    localStorage,
    console,
    URL,
    URLSearchParams,
    AbortController,
    Date,
    Math,
    Number,
    Promise,
    fetch: options.fetch || (async () => ({ ok: true, json: async () => ({ artists: [] }) }))
  });
  vm.runInContext(instrumentedRenderer(), context, { filename: RENDERER_PATH });
  assert.ok(plugin, "renderer must register the plugin");
  plugin.activate();
  assert.equal(typeof viewRenderer, "function");
  const root = viewRenderer();
  document.body.append(root);
  await flush();

  return {
    window,
    hooks: window.__mediaHubRendererTest,
    framePosts,
    iframes,
    timers,
    storage,
    activations,
    searchCalls,
    assetRequests,
    playerFrame() {
      return iframes.find(frame => String(frame.src || "").includes("player.html"));
    },
    async flush(times) { await flush(times); },
    dispatchMessage(source, data, origin = "") {
      for (const listener of windowListeners.get("message") || []) listener({ source, data, origin });
    }
  };
}

function song(id, artist = "Test Artist") {
  return {
    id,
    title: `${artist} - Song ${id}`,
    channel: `${artist} Official`,
    thumbnail: `https://img.invalid/${id}.jpg`,
    durationSeconds: 210
  };
}

test("catalogue navigation loads YouTube Music home and explore without rebuilding the player", async () => {
  const catalogueSong = {
    kind: "song",
    id: "catalogue-track",
    videoId: "catalogue-track",
    title: "Catalogue Song",
    channel: "Catalogue Artist",
    subtitle: "Catalogue Artist",
    thumbnail: "https://img.invalid/catalogue.jpg",
    durationSeconds: 180
  };
  const harness = await createHarness({
    ytMusic(route) {
      if (route === "/v1/home") return [{ title: "Schnelle Auswahl", items: [catalogueSong] }];
      if (route === "/v1/explore") {
        return [{ title: "Neu veröffentlicht", items: [{ ...catalogueSong, id: "explore-track", videoId: "explore-track" }] }];
      }
      return [];
    }
  });
  await harness.flush(30);

  assert.ok(harness.framePosts.some(call => call.route === "/v1/home"));
  assert.equal(harness.hooks.nodes.catalogueView.classList.contains("mh-hidden"), false);
  const firstCard = harness.hooks.nodes.catalogueView.querySelector(".mh-catalog-card");
  assert.ok(firstCard, "the home response should render a catalogue card");
  const openButton = firstCard.querySelector(".mh-catalog-open");
  assert.ok(openButton, "catalogue cards should expose a native open button");
  openButton.dispatchEvent({ type: "click" });
  await harness.flush(30);
  assert.deepEqual(
    harness.framePosts.filter(message => message.command === "load").map(message => message.videoId),
    ["catalogue-track"]
  );

  harness.hooks.nodes.discoverNav.dispatchEvent({ type: "click" });
  await harness.flush(30);
  assert.ok(harness.framePosts.some(call => call.route === "/v1/explore"));
  assert.equal(harness.hooks.nodes.catalogueView.classList.contains("mh-hidden"), false);
  assert.equal(harness.hooks.nodes.resultsView.classList.contains("mh-hidden"), true);

  harness.hooks.nodes.libraryNav.dispatchEvent({ type: "click" });
  assert.equal(harness.hooks.nodes.catalogueView.classList.contains("mh-hidden"), true);
  assert.equal(harness.hooks.nodes.playlistOverview.classList.contains("mh-hidden"), false);
  assert.ok(harness.playerFrame(), "switching views must preserve the existing player iframe");
});

test("two competing play calls post only the newer load", async () => {
  const harness = await createHarness({ deferActivations: true });
  const firstPlay = harness.hooks.play(song("track-a", "Artist A"));
  const secondPlay = harness.hooks.play(song("track-b", "Artist B"));
  assert.equal(harness.activations.length, 2);

  harness.activations[1].resolve({ ok: true });
  assert.equal(await secondPlay, true);
  harness.activations[0].resolve({ ok: true });
  assert.equal(await firstPlay, false);

  const loads = harness.framePosts.filter(message => message.command === "load");
  assert.deepEqual(loads.map(message => message.videoId), ["track-b"]);
  assert.equal(loads[0].token, 2);
});

test("an ended event from an old token cannot skip the new title", async () => {
  const harness = await createHarness();
  assert.equal(await harness.hooks.play(song("track-a", "Artist A")), true);
  assert.equal(await harness.hooks.play(song("track-b", "Artist B")), true);
  const loadsBefore = harness.framePosts.filter(message => message.command === "load");
  assert.deepEqual(loadsBefore.map(message => message.videoId), ["track-a", "track-b"]);

  harness.dispatchMessage(harness.playerFrame().contentWindow, {
    source: "mediahub-player",
    type: "ended",
    videoId: "track-a",
    token: loadsBefore[0].token
  });
  await harness.flush();

  const loadsAfter = harness.framePosts.filter(message => message.command === "load");
  assert.deepEqual(loadsAfter.map(message => message.videoId), ["track-a", "track-b"]);
  assert.equal(harness.hooks.playbackToken, loadsBefore[1].token);
});

for (const contextChange of ["playlist", "mix style"]) {
  test(`a retry started in an old context cannot insert after a ${contextChange} change`, async () => {
    const retrySearch = deferred();
    const playlists = [
      { id: "list-a", name: "A", items: [song("seed", "Seed Artist")] },
      { id: "list-b", name: "B", items: [] }
    ];
    const storage = {
      "mediahub-auto-mix-v1": "true",
      "mediahub-playlists-v1": JSON.stringify(playlists),
      "mediahub-genre-cache-v1": JSON.stringify({
        "seed artist": { tags: ["metalcore"], savedAt: Date.now() }
      })
    };
    const harness = await createHarness({
      storage,
      search(_query, callNumber) {
        if (callNumber <= 4) return Promise.resolve([]);
        if (callNumber === 5) return retrySearch.promise;
        return Promise.resolve([]);
      }
    });

    await harness.hooks.ensureMixBuffer({ force: true });
    const retryTimer = harness.timers.find(timer => !timer.cleared && timer.delay === 5000);
    assert.ok(retryTimer, "an empty refill should schedule the first retry");
    retryTimer.callback();
    await harness.flush();
    assert.equal(harness.searchCalls.length, 5, "the retry must reach its deferred search");
    const oldRetryPromise = harness.hooks.mixRefillPromise;
    assert.ok(oldRetryPromise);

    if (contextChange === "playlist") {
      harness.hooks.nodes.picker.value = "list-b";
      harness.hooks.nodes.picker.dispatchEvent({ type: "change" });
    } else {
      harness.hooks.nodes.mixStylePicker.value = "wide";
      harness.hooks.nodes.mixStylePicker.dispatchEvent({ type: "change" });
    }

    retrySearch.resolve([song("stale-result", "Old Context Artist")]);
    await oldRetryPromise;
    await harness.flush(30);

    const allIds = harness.hooks.playlists().flatMap(list => list.items.map(item => item.id));
    assert.equal(allIds.includes("stale-result"), false);
  });
}

test("global stop then start lets the restarted title end normally", async () => {
  const first = song("track-a", "Artist A");
  const second = song("track-b", "Artist B");
  const harness = await createHarness({
    storage: {
      "mediahub-playlists-v1": JSON.stringify([
        { id: "queue", name: "Queue", items: [first, second] }
      ])
    }
  });

  assert.equal(await harness.hooks.play(first), true);
  const firstLoad = harness.framePosts.find(message => message.command === "load");
  assert.ok(firstLoad);

  harness.window.playerAPI.commandListener({ providerId: "mediahub", command: "stop" });
  harness.window.playerAPI.commandListener({ providerId: "mediahub", command: "play" });

  const restartedLoads = harness.framePosts.filter(message => message.command === "load");
  assert.deepEqual(restartedLoads.map(message => message.videoId), ["track-a", "track-a"]);
  assert.equal(restartedLoads[1].token, firstLoad.token);

  harness.dispatchMessage(harness.playerFrame().contentWindow, {
    source: "mediahub-player",
    type: "ended",
    videoId: "track-a",
    token: firstLoad.token
  });
  await harness.flush(30);

  const loadsAfterEnd = harness.framePosts.filter(message => message.command === "load");
  assert.deepEqual(loadsAfterEnd.map(message => message.videoId), ["track-a", "track-a", "track-b"]);
});

test("the endless mixer prefers YouTube Music radio and keeps the classic search as fallback", async () => {
  const seed = song("seed-video", "Falling In Reverse");
  const radioTracks = Array.from({ length: 15 }, (_value, index) => song(`radio-${index}`, `Related Artist ${index}`));
  const harness = await createHarness({
    storage: {
      "mediahub-auto-mix-v1": "true",
      "mediahub-mix-style-v1": "wide",
      "mediahub-playlists-v1": JSON.stringify([
        { id: "queue", name: "Queue", items: [seed] }
      ])
    },
    ytMusic(route) {
      return route === "/v1/radio" ? radioTracks : [];
    }
  });

  const additions = await harness.hooks.ensureMixBuffer({ force: true, seedItem: seed });
  assert.equal(additions.length, 11);
  assert.equal(harness.searchCalls.length, 0, "classic Google search should not run when radio filled the queue");
  const radioCall = harness.framePosts.find(call => call.source === "mediahub-ytmusic-parent" && call.route === "/v1/radio");
  assert.ok(radioCall);
  assert.equal(radioCall.payload.videoId, "seed-video");
  assert.equal(harness.hooks.playlists()[0].items.length, 12);
});

test("same-genre mode keeps a fixed manual seed and limits radio drift", async () => {
  const metalSeed = song("metal-seed", "Falling In Reverse");
  const driftedTrack = { ...song("rap-tail", "Rap Artist"), mediaHubAutoAdded: true };
  const radioTracks = [
    song("wrong-genre", "Hip Hop Artist"),
    ...Array.from({ length: 14 }, (_value, index) => song(`radio-${index}`, `Metal Radio Artist ${index}`))
  ];
  const genreCache = {
    "falling in reverse": { tags: ["metalcore", "post-hardcore"], savedAt: Date.now() },
    "hip hop artist": { tags: ["hip hop", "rap"], savedAt: Date.now() }
  };
  for (let index = 0; index < 14; index += 1) {
    genreCache[`metal radio artist ${index}`] = { tags: ["metalcore"], savedAt: Date.now() };
  }
  for (let call = 1; call <= 4; call += 1) {
    for (let index = 0; index < 12; index += 1) {
      genreCache[`metal artist ${call}-${index}`] = { tags: ["alternative metal"], savedAt: Date.now() };
    }
  }
  const harness = await createHarness({
    storage: {
      "mediahub-auto-mix-v1": "true",
      "mediahub-mix-style-v1": "genre",
      "mediahub-playlists-v1": JSON.stringify([
        { id: "queue", name: "Queue", items: [metalSeed, driftedTrack] }
      ]),
      "mediahub-genre-cache-v1": JSON.stringify(genreCache)
    },
    ytMusic(route) {
      return route === "/v1/radio" ? radioTracks : [];
    },
    search(_query, callNumber) {
      return Promise.resolve(Array.from({ length: 12 }, (_value, index) => song(`genre-${callNumber}-${index}`, `Metal Artist ${callNumber}-${index}`)));
    }
  });

  const additions = await harness.hooks.ensureMixBuffer({ force: true });
  const radioCall = harness.framePosts.find(call => call.source === "mediahub-ytmusic-parent" && call.route === "/v1/radio");
  assert.equal(radioCall.payload.videoId, "metal-seed", "the last auto-added title must not become the genre anchor");
  assert.ok(additions.filter(item => item.id.startsWith("radio-")).length <= 4, "free radio suggestions are capped in same-genre mode");
  assert.equal(additions.some(item => item.id === "wrong-genre"), false, "a hip-hop candidate must not enter a metal mix");
  assert.ok(harness.searchCalls.some(query => query.toLowerCase().includes("metalcore")));
});

test("an activation infrastructure failure does not mark the title unavailable", async () => {
  const first = song("track-a", "Artist A");
  const second = song("track-b", "Artist B");
  const third = song("track-c", "Artist C");
  let activationCall = 0;
  const harness = await createHarness({
    storage: {
      "mediahub-playlists-v1": JSON.stringify([
        { id: "queue", name: "Queue", items: [first, second, third] }
      ])
    },
    setActiveProvider() {
      activationCall += 1;
      if (activationCall === 2) return Promise.reject(new Error("provider temporarily unavailable"));
      return Promise.resolve({ ok: true });
    }
  });

  assert.equal(await harness.hooks.play(first), true);
  const firstLoad = harness.framePosts.find(message => message.command === "load");
  harness.dispatchMessage(harness.playerFrame().contentWindow, {
    source: "mediahub-player",
    type: "ended",
    videoId: "track-a",
    token: firstLoad.token
  });
  await harness.flush(30);

  assert.equal(activationCall, 2, "automatic advance must attempt track-b once");
  assert.deepEqual(
    harness.framePosts.filter(message => message.command === "load").map(message => message.videoId),
    ["track-a"],
    "a failed provider activation must not pretend track-b was loaded"
  );
  const persistedSecond = harness.hooks.playlists()[0].items.find(item => item.id === "track-b");
  assert.equal(Boolean(persistedSecond.mediaHubUnavailable), false);

  assert.equal(await harness.hooks.play(second), true, "the same title must remain retryable");
  assert.deepEqual(
    harness.framePosts.filter(message => message.command === "load").map(message => message.videoId),
    ["track-a", "track-b"]
  );
});

test("automatic advance skips a persisted unavailable item", async () => {
  const first = song("track-a", "Artist A");
  const unavailable = { ...song("track-b", "Artist B"), mediaHubUnavailable: true };
  const third = song("track-c", "Artist C");
  const harness = await createHarness({
    storage: {
      "mediahub-playlists-v1": JSON.stringify([
        { id: "queue", name: "Queue", items: [first, unavailable, third] }
      ])
    }
  });

  assert.equal(await harness.hooks.play(first), true);
  const firstLoad = harness.framePosts.find(message => message.command === "load");
  harness.dispatchMessage(harness.playerFrame().contentWindow, {
    source: "mediahub-player",
    type: "ended",
    videoId: "track-a",
    token: firstLoad.token
  });
  await harness.flush(30);

  assert.deepEqual(
    harness.framePosts.filter(message => message.command === "load").map(message => message.videoId),
    ["track-a", "track-c"]
  );
});
