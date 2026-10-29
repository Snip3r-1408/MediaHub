"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const manifest = require("../providers.json");
const { ProviderRegistry } = require("../provider-registry");

test("provider manifest exposes the four planned MediaHub services", () => {
  const registry = new ProviderRegistry(manifest);
  assert.equal(registry.defaultProvider, "youtube-music");
  assert.deepEqual(
    registry.list().map(provider => provider.id),
    ["youtube-music", "spotify", "apple-music", "amazon-music"]
  );
});

test("only implemented or migrating providers can be selected", () => {
  const registry = new ProviderRegistry(manifest);
  assert.equal(registry.select("youtube-music").name, "YouTube Music");
  assert.throws(() => registry.select("spotify"), /noch nicht verfügbar/);
  assert.throws(() => registry.select("missing"), /Unbekannter/);
});

test("registry reports the generic WebRadio capabilities needed by a provider", () => {
  const registry = new ProviderRegistry(manifest);
  assert.deepEqual(
    registry.missingTargetCapabilities("youtube-music", ["web-session"]),
    ["web-session-media"]
  );
  assert.deepEqual(
    registry.missingTargetCapabilities("spotify", ["provider-oauth"]),
    ["encrypted-media"]
  );
});

test("provider origins must be exact HTTPS origins", () => {
  const broken = JSON.parse(JSON.stringify(manifest));
  broken.providers[0].origin = "https://music.youtube.com/watch?v=test";
  assert.throws(() => new ProviderRegistry(broken), /HTTPS-Origin ohne Pfad/);
});
