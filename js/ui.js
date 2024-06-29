let ui = (function() {
  
    let $ = document.querySelector.bind(document);

    let SELF = {
        TurnOffScreen_,
        TurnOnScreen,
        Init,
        ApplyRatio,
        UpdateRatio,
        SetLimit,
        SetBreak,
    };

    function SetLimit() {
        let userVal = window.prompt('Work session duration (minutes)', appData.workDuration / 60);
        if (userVal === null) return;
    
        appData.workDuration = parseInt(userVal) * 60;
        restoreRateInSeconds = Math.floor(appData.workDuration / local.breakDuration);

        Save();
    
        location.reload();
        // $('._limit').replaceChildren(secondsToHMS(appData.workDuration));
        // refresh();
    }
    

    function ApplyRatio() {
        let inputEl = $('._inWorkRestRatio');
        let workBreakRatio = parseFloat(inputEl.value);
        let breakDuration = Math.ceil(appData.workDuration * workBreakRatio);

        appData.workBreakRatio = workBreakRatio;

        Save();

        // refreshRatio();
        location.reload();
    }
    
    function UpdateRatio(evt) {
        let inputEl = evt.target;

        let workBreakRatio = parseFloat(inputEl.value);
        let breakDuration = Math.ceil(appData.workDuration * workBreakRatio);

        previewRatio({
            workBreakRatio,
            breakDuration,
            workDuration: appData.workDuration,
        });
        // refreshRatio();
    }

    function SetBreak() {
        let userVal = window.prompt('Break time duration (minutes)', local.breakDuration / 60);
        if (userVal === null) return;

        local.breakDuration = parseInt(userVal) * 60;
        restoreRateInSeconds = Math.floor(appData.workDuration / local.breakDuration);
        
        Save();
    }


    function previewRatio(config) {
        let {workBreakRatio, workDuration, breakDuration} = config;
        $('._inWorkRestRatio').value = workBreakRatio;
        $('._txtWorkRestRatio').replaceChildren(workBreakRatio);
        $('._txtInfoRatioConfig ._Work').replaceChildren(secondsToHMS(workDuration));
        $('._txtInfoRatioConfig ._Break').replaceChildren(secondsToHMS(breakDuration));
    }

    function refreshRatio() {
        let {workBreakRatio, workDuration} = appData;
        let {breakDuration} = local;
        previewRatio({
            workBreakRatio,
            workDuration,
            breakDuration,
        });
    }

    async function TurnOffScreen_() {
        let isEnabled = await awakeUtil.TaskEnable();
        if (isEnabled) {
            document.body.classList.add('__screen-off');
            enterFullScreen();
        }
    }

    async function TurnOnScreen() {
      awakeUtil.Disable();
      document.body.classList.remove('__screen-off');
      exitFullscreen();
    }

    function enterFullScreen() {
        let elem = document.body;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch((err) => {
                
            });
        }
    }
    
    function exitFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }
    
    function Init() {

        refreshRatio();

        document.addEventListener("fullscreenchange", fullscreenchanged);
      
        let lastTapTime = 0;
        let tapDelay = 300;
        
        $('._container-screen-off').addEventListener('touchstart', function(event) {
          let currentTime = new Date().getTime();
          let tapTimeDifference = currentTime - lastTapTime;
        
          if (tapTimeDifference < tapDelay) {
            lastTapTime = 0;
            ui.TurnOnScreen();
          } else {
            lastTapTime = currentTime;
          }
          event.preventDefault();
        });
    }

    function fullscreenchanged(event) {
        if (!document.fullscreenElement) {
            TurnOnScreen();
        }
    }

    return SELF;
    
})();