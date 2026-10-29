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

    bridge = new YtMusicBridge({ root: __dirname, logger: context.logger });
    bridge.start()
      .then(result => context.logger.info(
        result.available
          ? "YouTube-Music-Engine ist bereit."
          : "YouTube-Music-Engine ist nicht verfügbar; der klassische Mixer bleibt aktiv."
      ))
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
