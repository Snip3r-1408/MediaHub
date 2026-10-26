const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const PLAYER_PATH = path.join(__dirname, "..", "player.html");

function playerScript() {
  const html = fs.readFileSync(PLAYER_PATH, "utf8");
  const match = html.match(/<script>([\s\S]*?)<\/script>/i);
  assert.ok(match, "player.html must contain an inline player script");
  return match[1];
}

function createHarness() {
  const messages = [];
  const intervals = [];
  let messageListener = null;
  let player = null;
  let now = 1_000_000;

  class FakeDate extends Date {
    static now() { return now; }
  }

  class FakePlayer {
    constructor(elementId, options) {
      this.elementId = elementId;
      this.options = options;
      this.videoId = options.videoId || "";
      this.duration = 0;
      this.currentTime = 0;
      this.calls = [];
      player = this;
    }

    loadVideoById(videoId) {
      this.calls.push(["loadVideoById", videoId]);
      this.videoId = videoId;
    }

    cueVideoById(videoId) {
      this.calls.push(["cueVideoById", videoId]);
      this.videoId = videoId;
    }

    playVideo() { this.calls.push(["playVideo"]); }
    pauseVideo() { this.calls.push(["pauseVideo"]); }
    stopVideo() { this.calls.push(["stopVideo"]); }
    setVolume(volume) { this.calls.push(["setVolume", volume]); }
    getDuration() { return this.duration; }
    getCurrentTime() { return this.currentTime; }
    getVideoData() { return { video_id: this.videoId }; }
  }

  const window = {
    parent: {
      postMessage(message) {
        messages.push({ ...message });
      }
    },
    addEventListener(type, listener) {
      if (type === "message") messageListener = listener;
    },
    setInterval(callback, delay) {
      intervals.push({ callback, delay });
      return intervals.length;
    }
  };
  const document = {
    createElement() { return {}; },
    head: { appendChild() {} }
  };
  const context = vm.createContext({
    window,
    document,
    location: { origin: "http://127.0.0.1:35785" },
    Date: FakeDate,
    Math,
    Number
  });

  vm.runInContext(playerScript(), context, { filename: PLAYER_PATH });

  const states = {
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3
  };

  return {
    messages,
    states,
    get player() { return player; },
    send(command) {
      assert.ok(messageListener, "player must register a message listener");
      messageListener({ data: command });
    },
    installYouTubeApi() {
      const YT = { Player: FakePlayer, PlayerState: states };
      context.YT = YT;
      window.YT = YT;
      assert.equal(typeof window.onYouTubeIframeAPIReady, "function");
      window.onYouTubeIframeAPIReady();
    },
    ready() {
      assert.ok(player, "YouTube player must exist before it becomes ready");
      player.options.events.onReady();
    },
    state(state) {
      assert.ok(player, "YouTube player must exist before state changes");
      player.options.events.onStateChange({ data: state });
    },
    tick() {
      assert.equal(intervals.length, 1, "player must install one fallback timer");
      intervals[0].callback();
    },
    advanceTime(milliseconds) {
      now += milliseconds;
    }
  };
}

test("keeps a pending load when volume arrives before the YouTube API", () => {
  const harness = createHarness();

  harness.send({ command: "load", videoId: "track-a", token: 7 });
  harness.send({ command: "setVolume", volume: 0.42 });
  harness.installYouTubeApi();

  assert.ok(harness.player, "the pending load must still construct the player");
  assert.equal(harness.player.videoId, "track-a");

  harness.ready();

  assert.deepEqual(
    harness.player.calls.filter(([name]) => name === "setVolume"),
    [["setVolume", 42]]
  );
  assert.deepEqual(
    harness.messages.find(message => message.type === "ready"),
    {
      source: "mediahub-player",
      type: "ready",
      videoId: "track-a",
      token: 7
    }
  );
});

test("associates events with the active video token and ignores stale video events", () => {
  const harness = createHarness();
  harness.installYouTubeApi();
  harness.send({ command: "load", videoId: "track-a", token: 11 });
  harness.ready();

  harness.state(harness.states.PLAYING);
  const playing = harness.messages.find(message => message.type === "state" && message.state === "playing");
  assert.equal(playing.videoId, "track-a");
  assert.equal(playing.token, 11);

  harness.send({ command: "load", videoId: "track-b", token: 22 });

  harness.player.videoId = "track-a";
  harness.state(harness.states.ENDED);
  assert.equal(
    harness.messages.filter(message => message.type === "ended").length,
    0,
    "a late ended event from track-a must not advance track-b"
  );

  harness.player.videoId = "track-b";
  harness.state(harness.states.ENDED);
  assert.deepEqual(
    harness.messages.find(message => message.type === "ended"),
    {
      source: "mediahub-player",
      type: "ended",
      videoId: "track-b",
      token: 22,
      state: "stopped"
    }
  );
});

test("does not emit the ended fallback while playback is paused", () => {
  const harness = createHarness();
  harness.installYouTubeApi();
  harness.send({ command: "load", videoId: "track-a", token: 31 });
  harness.ready();

  harness.player.duration = 100;
  harness.player.currentTime = 99.8;
  harness.state(harness.states.PLAYING);
  harness.state(harness.states.PAUSED);
  harness.tick();

  assert.equal(
    harness.messages.filter(message => message.type === "ended").length,
    0,
    "being near the end while paused must not advance the playlist"
  );

  harness.state(harness.states.PLAYING);
  harness.tick();
  const ended = harness.messages.find(message => message.type === "ended");
  assert.equal(ended.videoId, "track-a");
  assert.equal(ended.token, 31);
  assert.equal(ended.fallback, true);
});

test("a requested stop never emits ended or advances automatically", () => {
  const harness = createHarness();
  harness.installYouTubeApi();
  harness.send({ command: "load", videoId: "track-a", token: 41 });
  harness.ready();
  harness.state(harness.states.PLAYING);

  harness.send({ command: "stop" });
  assert.deepEqual(
    harness.player.calls.filter(([name]) => name === "stopVideo"),
    [["stopVideo"]]
  );

  harness.state(harness.states.ENDED);
  harness.tick();

  assert.equal(
    harness.messages.filter(message => message.type === "ended").length,
    0,
    "a deliberate stop must not look like a naturally ended title"
  );
  assert.deepEqual(
    harness.messages.find(message => message.type === "state" && message.state === "stopped"),
    {
      source: "mediahub-player",
      type: "state",
      videoId: "track-a",
      token: 41,
      state: "stopped"
    }
  );
});

test("a new load clears a stop that was queued before player readiness", () => {
  const harness = createHarness();

  harness.send({ command: "load", videoId: "track-a", token: 51 });
  harness.send({ command: "stop" });
  harness.send({ command: "load", videoId: "track-b", token: 52 });
  harness.installYouTubeApi();
  harness.ready();

  assert.equal(harness.player.videoId, "track-b");
  assert.equal(
    harness.player.calls.some(([name]) => name === "stopVideo"),
    false,
    "the old pending stop must not stop the newer load"
  );

  harness.state(harness.states.PLAYING);
  harness.state(harness.states.ENDED);
  assert.deepEqual(
    harness.messages.find(message => message.type === "ended"),
    {
      source: "mediahub-player",
      type: "ended",
      videoId: "track-b",
      token: 52,
      state: "stopped"
    },
    "track-b must retain normal end-of-track behavior"
  );
});

test("reports a 30-second playback stall exactly once", () => {
  const harness = createHarness();
  harness.installYouTubeApi();
  harness.send({ command: "load", videoId: "track-a", token: 61 });
  harness.ready();

  harness.player.duration = 240;
  harness.player.currentTime = 30;
  harness.state(harness.states.PLAYING);
  harness.advanceTime(30_001);
  harness.tick();
  harness.advanceTime(10_000);
  harness.tick();

  const stalled = harness.messages.filter(message => message.type === "stalled");
  assert.equal(stalled.length, 1);
  assert.deepEqual(stalled[0], {
    source: "mediahub-player",
    type: "stalled",
    videoId: "track-a",
    token: 61,
    state: "loading"
  });
  assert.equal(
    harness.messages.filter(message => message.type === "ended").length,
    0,
    "a stall is recoverable and must not masquerade as a natural end"
  );
});
