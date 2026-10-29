"use strict";

const VALID_PHASES = new Set(["active", "migration", "planned", "disabled"]);

function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`Provider manifest: ${field} muss ein nicht-leerer String sein.`);
  }
  return value.trim();
}

function normalizeProvider(provider) {
  if (!provider || typeof provider !== "object" || Array.isArray(provider)) {
    throw new TypeError("Provider manifest: Provider muss ein Objekt sein.");
  }
  const normalized = {
    ...provider,
    id: assertNonEmptyString(provider.id, "id"),
    name: assertNonEmptyString(provider.name, "name"),
    shortName: assertNonEmptyString(provider.shortName || provider.name, "shortName"),
    phase: assertNonEmptyString(provider.phase, "phase"),
    catalogAdapter: assertNonEmptyString(provider.catalogAdapter, "catalogAdapter"),
    playbackAdapter: assertNonEmptyString(provider.playbackAdapter, "playbackAdapter"),
    auth: assertNonEmptyString(provider.auth, "auth"),
    origin: assertNonEmptyString(provider.origin, "origin"),
    requiresSubscription: Boolean(provider.requiresSubscription),
    targetCoreCapabilities: Array.from(new Set(
      Array.isArray(provider.targetCoreCapabilities)
        ? provider.targetCoreCapabilities.map(capability => assertNonEmptyString(capability, "targetCoreCapabilities[]"))
        : []
    ))
  };
  if (!VALID_PHASES.has(normalized.phase)) {
    throw new TypeError(`Provider manifest: unbekannte Phase „${normalized.phase}“ für ${normalized.id}.`);
  }
  const parsedOrigin = new URL(normalized.origin);
  if (parsedOrigin.protocol !== "https:" || parsedOrigin.origin !== normalized.origin) {
    throw new TypeError(`Provider manifest: origin für ${normalized.id} muss ein HTTPS-Origin ohne Pfad sein.`);
  }
  return Object.freeze(normalized);
}

class ProviderRegistry {
  constructor(manifest) {
    if (!manifest || Number(manifest.schemaVersion) !== 1 || !Array.isArray(manifest.providers)) {
      throw new TypeError("Provider manifest: schemaVersion 1 und providers[] werden benötigt.");
    }
    this._providers = new Map();
    manifest.providers.forEach(entry => {
      const provider = normalizeProvider(entry);
      if (this._providers.has(provider.id)) {
        throw new TypeError(`Provider manifest: doppelte Provider-ID „${provider.id}“.`);
      }
      this._providers.set(provider.id, provider);
    });
    this.defaultProvider = assertNonEmptyString(manifest.defaultProvider, "defaultProvider");
    if (!this._providers.has(this.defaultProvider)) {
      throw new TypeError(`Provider manifest: Standard-Provider „${this.defaultProvider}“ fehlt.`);
    }
  }

  get(id) {
    return this._providers.get(String(id || "")) || null;
  }

  list({ includeDisabled = false } = {}) {
    return Array.from(this._providers.values())
      .filter(provider => includeDisabled || provider.phase !== "disabled");
  }

  isSelectable(id) {
    const provider = this.get(id);
    return Boolean(provider && (provider.phase === "active" || provider.phase === "migration"));
  }

  select(id) {
    const provider = this.get(id);
    if (!provider) throw new Error(`Unbekannter MediaHub-Provider: ${id}`);
    if (!this.isSelectable(id)) {
      throw new Error(`${provider.name} ist in dieser MediaHub-Version noch nicht verfügbar.`);
    }
    return provider;
  }

  missingTargetCapabilities(id, grantedCapabilities = []) {
    const provider = this.get(id);
    if (!provider) throw new Error(`Unbekannter MediaHub-Provider: ${id}`);
    const granted = new Set(grantedCapabilities);
    return provider.targetCoreCapabilities.filter(capability => !granted.has(capability));
  }
}

module.exports = { ProviderRegistry, normalizeProvider };
