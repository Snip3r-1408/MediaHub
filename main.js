"use strict";

const { YtMusicBridge } = require("./ytmusic-bridge");

let bridge = null;

module.exports = {
  init(context) {
    context.navigation.registerItem({
      id: "mediahub",
      label: "MediaHub",
      icon: "media",
      route: "mediahub",
      order: 30
    });
    context.logger.info("MediaHub navigation registered.");

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
  }
};
