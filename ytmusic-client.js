(() => {
  "use strict";

  const CONFIG_PATH = ".runtime/ytmusic-bridge.json";
  const ALLOWED_ROUTES = new Set([
    "/v1/search",
    "/v1/radio",
    "/v1/genres",
    "/v1/home",
    "/v1/explore",
    "/v1/charts",
    "/v1/album",
    "/v1/artist",
    "/v1/playlist",
    "/v1/mood-playlists"
  ]);
  let configPromise = null;

  function validConfig(config) {
    if (!config || config.protocol !== 1 || config.available === false
      || !/^[a-f0-9]{64}$/i.test(String(config.token || ""))) return false;
    try {
      const url = new URL(config.url);
      return url.protocol === "http:"
        && ["127.0.0.1", "localhost", "::1"].includes(url.hostname)
        && Boolean(url.port);
    } catch {
      return false;
    }
  }

  function loadConfig() {
    if (!configPromise) {
      configPromise = fetch(`${CONFIG_PATH}?t=${Date.now()}`, { cache: "no-store" })
        .then(response => {
          if (!response.ok) throw new Error(`Bridge-Konfiguration: ${response.status}`);
          return response.json();
        })
        .then(config => {
          if (!validConfig(config)) throw new Error("YouTube-Music-Engine ist nicht bereit");
          return config;
        })
        .catch(error => {
          configPromise = null;
          throw error;
        });
    }
    return configPromise;
  }

  window.addEventListener("message", async event => {
    const message = event.data;
    if (event.source !== window.parent
      || message?.source !== "mediahub-ytmusic-parent"
      || !ALLOWED_ROUTES.has(message.route)) return;
    const responseMessage = {
      source: "mediahub-ytmusic-client",
      requestId: String(message.requestId || ""),
      ok: false
    };
    try {
      const config = await loadConfig();
      const response = await fetch(`${config.url}${message.route}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MediaHub-Token": config.token
        },
        body: JSON.stringify(message.payload || {})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `YouTube Music antwortet mit ${response.status}`);
      responseMessage.ok = true;
      responseMessage.result = data?.result ?? null;
    } catch (error) {
      responseMessage.error = error.message || "YouTube Music Anfrage fehlgeschlagen";
    }
    event.source.postMessage(responseMessage, "*");
  });
})();
