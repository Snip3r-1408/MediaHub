"use strict";

const { YtMusicBridge } = require("./ytmusic-bridge");
const { ProviderRegistry } = require("./provider-registry");
const providerManifest = require("./providers.json");

let bridge = null;
let providers = null;

module.exports = {
  init(context) {
    providers = new ProviderRegistry(providerManifest);
    context.navigation.registerItem({
      id: "mediahub",
      label: "MediaHub",
      icon: "media",
      route: "mediahub",
      order: 30
    });
    context.logger.info("MediaHub navigation registered.");
    context.logger.info(
      `MediaHub provider platform ready: ${providers.list().map(provider => provider.id).join(", ")}`
    );

    bridge = new YtMusicBridge({
      root: __dirname,
      logger: context.logger,
      pluginId: "mediahub",
      webSession: context.capabilities.has("web-session") ? context.webSession : null
    });
    bridge.start()
      .then(result => {
        context.logger.info(
          result.available
            ? "YouTube-Music-Katalogengine ist bereit."
            : "YouTube-Music-Katalogengine ist nicht verfügbar; der klassische Mixer bleibt aktiv."
        );
        context.logger.info(
          result.webSessionAvailable
            ? "Sichere YouTube-Music-Wiedergabe ist bereit."
            : "Sichere YouTube-Music-Wiedergabe ist in dieser WebRadio-Version nicht verfügbar."
        );
      })
      .catch(error => context.logger.warn(
        `YouTube-Music-Engine konnte nicht gestartet werden: ${error.message}`
      ));
  },
  destroy() {
    bridge?.stop();
    bridge = null;
    providers = null;
  }
};
