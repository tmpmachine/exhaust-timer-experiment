let DOMEvents = (function() {
    
    let eventsMap = { 
        onclick: {
          'set-break': () => ui.SetBreak(),
          'set-limit': () => ui.SetLimit(),
          'apply-ratio': () => ui.ApplyRatio(),
            'pick-audio': () => app.SetAlarmAudio(), 
            'remove-audio': () => app.TaskRemoveAlarmAudio(), 
            'test-audio': () => app.TaskPlayAlarmAudio(), 
            'stop-test-audio': () => app.StopTestAlarmAudio(), 
        },
        oninput: {
          'update-ratio': (evt) => ui.UpdateRatio(evt),
          'handle-input-alarm-volume': (evt) => app.HandleInputAlarmVolume(evt),
        },
        
    };
    
    let listening = function(selector, dataKey, eventType, callbacks) {
      let elements = document.querySelectorAll(selector);
      for (let el of elements) {
        let callbackFunc = callbacks[el.dataset[dataKey]];
        el.addEventListener(eventType, callbackFunc);
      }
    };

    function Init() {
        listening('[data-onclick]', 'onclick', 'click', eventsMap.onclick);
        listening('[data-oninput]', 'oninput', 'input', eventsMap.oninput);
    }
      
    
    return {
      Init,
    };
  
})();