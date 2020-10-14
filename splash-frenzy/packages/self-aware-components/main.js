'use strict';

const listener = new Editor.IpcListener();

// Track prefabs by when the prefab editor is opened so that we can let TableViews know which
//  cells should be reloaded when the scene is restored
let lastModifiedPrefab = null;

function onPrefabOpen(evt, uuid) {
  lastModifiedPrefab = uuid;
}

module.exports = {
  load () {
    // Send message to SharedComponentUtils.js to clear component inspector script cache
    Editor.Ipc.sendToAll('self-aware-components:clear-inspector-cache');
    // Recompile when loading this package to allow script cache busting with query parameters
    // See https://wiki.bigfish.lan/display/sageng/Cocos+Creator#CocosCreator-CustomComponentPanelUI
    Editor.QuickCompiler.compileAndReload();
    listener.on('scene:enter-prefab-edit-mode', onPrefabOpen);
  },

  unload () {
    listener.clear();
  },

  // register your ipc messages here
  messages: {
    'last-modified-prefab'(evt) {
      if (evt.reply) {
        evt.reply(null, lastModifiedPrefab);
      } else {
        Editor.error("Cannot reply to request for last modified prefab");
      }
    }
  },
};