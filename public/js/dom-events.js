let DOMEvents = (function() {
    
    let eventsMap = { 
        onclick: {
          'set-break': () => ui.SetBreak(),
          'set-limit': () => ui.EditWorkDuration_(),
          'apply-ratio': () => ui.ApplyRatio(),
          'pick-audio': () => app.SetAlarmAudio(), 
          'remove-audio': () => app.TaskRemoveAlarmAudio(), 
          'reset-data': () => ui.ResetData_(), 
          'test-audio': () => app.TaskPlayAlarmAudio(), 
          'stop-test-audio': () => app.StopTestAlarmAudio(), 
          'instant-recovery': () => ui.Recover_(),
          'navigate': (evt) => ui.NavigateScreen(evt),
          'handle-click-recent-rest': (evt) => uiCustomBreak.HandleClickList(evt),
          'edit-rest-time': () => ui.EditRestTime(),
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