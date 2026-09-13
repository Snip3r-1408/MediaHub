"use strict";

module.exports = {
  init(context) {
    context.navigation.registerItem({
      id: "mediahub", label: "MediaHub", icon: "media", route: "mediahub", order: 30
    });
    context.logger.info("MediaHub navigation registered.");
  },
  destroy() {}
};
