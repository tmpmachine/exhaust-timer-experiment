import { loadScripts } from './script-loader.js';

(function() {

  loadScripts([
    {
      urls: [
        'js/dom-events.js',
        'js/view-states-map.js',
        'js/utils/view-state-util.js',
      ],
      callback: function() {
        DOMEvents.Init();
        viewStateUtil.Init(viewStatesMap); 
      }
    },
    {
      urls: [
        'js/utils/awake-util.js',
        'js/ui.js',
        'js/app.js',
      ],
      callback: function() {
        app.Init();
        ui.Init();
      }
    },
    {
      urls: [
        "js/lib/idb-keyval@6.js",
      ]
    },
  ]);
  
})();