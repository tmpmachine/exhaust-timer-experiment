import { loadScripts } from './script-loader.js';

(function() {

  loadScripts([
    {
      urls: [
        "js/dom-events.js",
        "js/utils/screen-state-util.js",
        "js/view-states-map.js",
        "js/utils/view-state-util.js",
        "js/utils/wait.js",
        "js/utils/list-container-builder.js",
        "js/utils/data-server-util.js",
      ],
      callback: function() {
        DOMEvents.Init();
        viewStateUtil.Init(viewStatesMap); 
      }
    },
    {
      urls: [
        "js/app-data.js",
        "js/utils/awake-util.js",
        "js/utils.js",
        "js/ui.js",
        "js/main.js",
      ],
      callback: function() {
        appData.Init();
        compoMain.Init();
      }
    },
    {
      urls: [
        "js/lib/windog.js",
        "js/lib/idb-keyval@6.js",
        "js/components/custom-break-component.js",
        "js/uis/custom-break-ui.js",
      ],
    },
  ]);
  
})();