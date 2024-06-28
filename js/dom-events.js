let DOMEvents = (function() {
    
    let eventsMap = { 
        onclick: {
            'pick-audio': () => app.SetAlarmAudio(), 
            'remove-audio': () => app.TaskRemoveAlarmAudio(), 
            'test-audio': () => app.TaskPlayAlarmAudio(), 
            'stop-test-audio': () => app.StopTestAlarmAudio(), 
        },
        oninput: {
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
    }
      
    
    return {
      Init,
    };
  
})();