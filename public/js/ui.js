let ui = (function() {
  
    let $ = document.querySelector.bind(document);

    let SELF = {
        TakeRest,
        TurnOffScreen_,
        TurnOnScreen,
        Init,
        Start,
        Stop,
        ApplyRatio,
        UpdateRatio,
        EditWorkDuration_,
        Recover_,
        StopRest,
        SetBreak,
        ResetData_,
        NavigateScreen,
        RefreshRestTime,
        StartBreakTime,
        SetBreakDuration,
        GetEnergyPoint,
        RemindMe,
        TakeCustomRest, 
    };

    // # local
    let local = {
        breakDuration: 0,
        workTimeInterval: null,
        breakTimeInterval: null,
        isRemindMe: false,
        refreshInterval: 1000,
        leftOverElapsedTime: 0,
    };

    let energyPoint = 0;
    let restoreRateInSeconds = 0;

    function GetEnergyPoint() {
        return energyPoint;
    }

    // # start timer
    function Start() {
        $('._txtRestoreTime').replaceChildren();
        if (appData.startTime) return;

        let now = Date.now();

        appData.endTime = null;
        appData.startTime = now;

        app.Save();

        viewStateUtil.Set('timerState', ['started']);
        refreshWorkTime();
        startWorkTimer();
    }

    function startWorkTimer() {
        stopWorkInterval();
        local.workTimeInterval = window.setInterval(refreshWorkTime, local.refreshInterval);
    }

    function refreshWorkTime() {
        let now = Date.now();
        let existingTimerTime = appData.startTime ? (now - appData.startTime) : 0
        let runningTime = (appData.workDuration * 1000 - appData.workTimeElapsed) - existingTimerTime;
        
        if (runningTime < 0) {
            let secondsElapsed = Math.ceil(-runningTime / 1000);
            $('._txt').replaceChildren("-" + utils.SecondsToHMS(secondsElapsed));
        } else {
            let secondsElapsed = Math.ceil(runningTime / 1000);
            $('._txt').replaceChildren(utils.SecondsToHMS(secondsElapsed));
        }

        let addedRestTime = 0;
        if (appData.startTime) {
            let elapsedTime = now - appData.startTime;
            let addedRestTimeInSeconds = Math.floor( (elapsedTime + local.leftOverElapsedTime) / (restoreRateInSeconds * 1000) );        
            addedRestTime = addedRestTimeInSeconds * 1000;
        }
        RefreshRestTime(addedRestTime);
    }

    function stopWorkInterval() {
        window.clearInterval(local.workTimeInterval);
    }

    // # stop timer, # pause
    function Stop() {
        stopWorkInterval();
        
        let now = Date.now();
        let elapsedTime = now - appData.startTime;
        let addedRestTimeInSeconds = Math.floor( (elapsedTime + local.leftOverElapsedTime) / (restoreRateInSeconds * 1000) );
        local.leftOverElapsedTime = (elapsedTime + local.leftOverElapsedTime) % (restoreRateInSeconds * 1000);

        appData.workTimeElapsed += elapsedTime;
        
        appData.breakTime = (appData.breakTime ?? 0) + addedRestTimeInSeconds * 1000;
        appData.startTime = null;
        appData.endTime = null;
            
        app.Save();
        
        viewStateUtil.Set('timerState', ['idle']);
        viewStateUtil.Add('mode', ['recovery']);
        RefreshRestTime();
    }

    function hasRestTime() {
        let breakTime = getLiveRestTime();
        let breakTimeInSeconds = Math.floor( breakTime / 1000);
        return (breakTimeInSeconds > 0);
    }

    function getLiveRestTime() {
        let addedRestTime = 0;
        if (appData.startTime) {
            let now = Date.now();
            let elapsedTime = now - appData.startTime;
            let addedRestTimeInSeconds = Math.floor( (elapsedTime + local.leftOverElapsedTime) / (restoreRateInSeconds * 1000) );        
            addedRestTime = addedRestTimeInSeconds * 1000;
        }

        let breakTime = (appData.breakTime ?? 0) + addedRestTime;
        return breakTime;
    }

    // # custom rest
    async function TakeCustomRest() {
        if (!hasRestTime()) return;

        let liveBreakTime = getLiveRestTime();
        let currentRestTimeStr= utils.SecondsToHMS(Math.floor(liveBreakTime / 1000))
        let userVal = await windog.prompt('Custom rest time (HMS format), e.g.: 3m, 1m30s', currentRestTimeStr);
        if (userVal === null) return;

        let duration = utils.ParseHmsToMs(userVal);
        if (!duration) return;

        startBreakTimeFromMsDuration(duration);
    }

    // # take rest, # break time, # resting
    function TakeRest() {
        if (!hasRestTime()) return;

        startBreakTimeFromMsDuration(appData.breakTime);
    }

    function startBreakTimeFromMsDuration(duration) {
        
        if (appData.startTime) {
            Stop();
        }
        
        let now = Date.now();

        appData.breakTimeStart = now;
        appData.breakTimeDuration = duration;
          
        app.Save();
        
        $('._txtTimer').replaceChildren( utils.SecondsToHMS(Math.floor(appData.breakTimeDuration / 1000)) );
        RefreshRestTime();
        StartBreakTime();
    }

    function SetBreakDuration(amount) {
        local.breakDuration = Math.ceil(appData.workDuration * appData.workBreakRatio);
    }

    function RefreshRestTime(addedRestTime = 0) {
        let breakTime = (appData.breakTime ?? 0) + addedRestTime;
        let breakTimeInSeconds = Math.floor( breakTime / 1000);
        let timeStr = utils.SecondsToHMS(breakTimeInSeconds)
        $('._txtEstRestTime').replaceChildren(timeStr);
    }

    function NavigateScreen(evt) {
        let btnEl = evt.target;
        let screenName = btnEl.dataset.target;
        
        screenStateUtil.NavigateTo(screenName);
    }

    async function ResetData_() {
        let isConfirm = await windog.confirm('Are you sure?');
        if (!isConfirm) return;
    
        localStorage.removeItem('NDQ1MjA3NzI')
        localStorage.removeItem('NDQ1MjA3NzI-allocation')
        localStorage.removeItem('NDQ1MjA3NzI-timeLimit')
        localStorage.removeItem('NDQ1MjA3NzI-appData')
        localStorage.removeItem('NDQ1MjA3NzI-appData-v2')
        localStorage.removeItem('NDQ1MjA3NzI-appData-v3')
    
        energyPoint = appData.workDuration;
    
        location.reload();
    }

    // # recovery, # instant
    async function Recover_() {
        let isConfirm = await windog.confirm('Are you sure?');
        if (!isConfirm) return;
    
        appData.endTime = null;
        appData.startTime = null;
        appData.workTimeElapsed = 0;
    
        viewStateUtil.Remove('mode', ['recovery']);
        $('._txt').replaceChildren(utils.SecondsToHMS(appData.workDuration));
        $('._txtRestoreTime').replaceChildren();
    
        app.Save();
    }

    async function EditWorkDuration_() {
        let userVal = await windog.prompt('Work session duration (in minutes)', appData.workDuration / 60);
        if (userVal === null) return;
    
        appData.workDuration = parseInt(userVal) * 60;
        restoreRateInSeconds = Math.floor(appData.workDuration / local.breakDuration);

        app.Save();
    
        location.reload();
    }
    

    function ApplyRatio() {
        let inputEl = $('._inWorkRestRatio');
        let workBreakRatio = parseFloat(inputEl.value);
        let breakDuration = Math.ceil(appData.workDuration * workBreakRatio);

        appData.workBreakRatio = workBreakRatio;

        app.Save();

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
    }

    function SetBreak() {
        let userVal = window.prompt('Break time duration (minutes)', local.breakDuration / 60);
        if (userVal === null) return;

        local.breakDuration = parseInt(userVal) * 60;
        restoreRateInSeconds = Math.floor(appData.workDuration / local.breakDuration);
        
        app.Save();
    }


    function previewRatio(config) {
        let {workBreakRatio, workDuration, breakDuration} = config;
        $('._inWorkRestRatio').value = workBreakRatio;
        $('._txtWorkRestRatio').replaceChildren(workBreakRatio);
        $('._txtInfoRatioConfig ._Work').replaceChildren(utils.SecondsToHMS(workDuration));
        $('._txtInfoRatioConfig ._Break').replaceChildren(utils.SecondsToHMS(breakDuration));
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

    function StartBreakTime() {
        stopBreakTimeInterval();
        viewStateUtil.Add('mode', ['recovery']);
        viewStateUtil.Set('timerState', ['recovery']);
        RefreshBreakTime();
        window.Android?.cancelScheduledNotification?.();
        window.Android?.scheduleNotificationInSeconds?.(Math.floor(appData.breakTimeDuration / 1000));
        
        local.breakTimeInterval = window.setInterval(RefreshBreakTime, local.refreshInterval);
    }

    // # stop rest
    function StopRest(opt) {
        let now = Date.now();
        let breakTimeStart = appData.breakTimeStart;
        let elapsedTime = now - breakTimeStart;
        let restoredMs = elapsedTime * restoreRateInSeconds;
        let runningTime = (appData.workDuration * 1000 - appData.workTimeElapsed) + restoredMs;
        console.log(runningTime)

        appData.breakTimeStart = null;
        appData.breakTimeDuration = 0;
        appData.breakTime = Math.max(0, appData.breakTime - elapsedTime);
        appData.workTimeElapsed = Math.max(0, appData.workTimeElapsed - restoredMs);

        app.Save();

        if (opt?.isPlayAudio) {
            app.TaskPlayAlarmAudio();
            ui.TurnOnScreen();
            local.isRemindMe = false;
        }
        $('._txtTimer').replaceChildren('---');
        stopBreakTimeInterval();
        viewStateUtil.Set('timerState', ['idle']);
        ui.RefreshRestTime();
        if (!opt?.isBySystem) {
            window.Android?.cancelScheduledNotification?.();
        }

        if (runningTime < 0) {
            let restoredWorkTime = Math.ceil(-runningTime / 1000);
            $('._txt').replaceChildren("-" + utils.SecondsToHMS(restoredWorkTime));
        } else {
            let restoredWorkTime = Math.ceil(runningTime / 1000);
            $('._txt').replaceChildren(utils.SecondsToHMS(restoredWorkTime));
        }
    }

    function stopBreakTimeInterval() {
        window.clearInterval(local.breakTimeInterval);
    }

    function RemindMe() {
        local.isRemindMe = true;
        TurnOffScreen_();
    }

    function RefreshBreakTime() {
        let now = Date.now();
        let breakTimeStart = appData.breakTimeStart;
        let breakTimeDuration = appData.breakTimeDuration;
        let timeLeft = (breakTimeStart + breakTimeDuration) - now

        if (timeLeft <= 0) {
            StopRest({
                isBySystem: true,
                isPlayAudio: local.isRemindMe,
            });
            return;
        }

        let restoredMs = (now - appData.breakTimeStart) * restoreRateInSeconds;
        let runningTime = (appData.workDuration * 1000 - appData.workTimeElapsed) + restoredMs;
        
        if (runningTime < 0) {
            let restoredWorkTime = Math.ceil(-runningTime / 1000);
            $('._txt').replaceChildren("-" + utils.SecondsToHMS(restoredWorkTime));
        } else {
            let restoredWorkTime = Math.ceil(runningTime / 1000);
            $('._txt').replaceChildren(utils.SecondsToHMS(restoredWorkTime));
        }
        $('._txtTimer').replaceChildren( utils.SecondsToHMS( Math.ceil(timeLeft / 1000) ) );
    }
    
    function Init() {

        SetBreakDuration();
        
        energyPoint = Math.min(appData.energyPoint ?? appData.workDuration, appData.workDuration);
        restoreRateInSeconds = Math.ceil(appData.workDuration / local.breakDuration);

        refreshRatio();
        RefreshRestTime();

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

        $('._limit').replaceChildren(utils.SecondsToHMS(appData.workDuration));
        // $('._txt').replaceChildren(utils.SecondsToHMS(energyPoint));

        refreshWorkTime();
        if (appData.startTime) {
            startWorkTimer();
        }

        if (appData.breakTimeStart) {
            StartBreakTime();
        }

        refreshTimerState();
    }

    function refreshTimerState() {
        if (appData.startTime) {
            viewStateUtil.Set('timerState', ['started']);
        }
    }

    function fullscreenchanged(event) {
        if (!document.fullscreenElement) {
            TurnOnScreen();
        }
    }

    return SELF;
    
})();