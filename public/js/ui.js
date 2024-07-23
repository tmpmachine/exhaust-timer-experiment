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
        RemindMe,
        GetLiveRestTime: getLiveRestTime,
        TakeCustomRest, 
        StartBreakTimeFromMsDuration: startBreakTimeFromMsDuration,
        EditRestTime,
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

    let restoreRateInSeconds = 0;


    async function EditRestTime() {
        let breakTime = getLiveRestTime();
        let breakTimeInSeconds = Math.floor( breakTime / 1000);
        let defaultVal = utils.SecondsToHMS(breakTimeInSeconds);

        let userVal = await windog.prompt('Edit break time (HMS format)', defaultVal);
        if (userVal === null) return;

        compoMain.data.startTime = Date.now();
        compoMain.data.breakTime = utils.ParseHmsToMs(userVal);
        
        compoMain.Commit();
        appData.Save();

        RefreshRestTime();
    }

    // # start timer
    function Start() {
        $('._txtRestoreTime').replaceChildren();
        if (compoMain.data.startTime) return;

        let now = Date.now();

        compoMain.data.endTime = null;
        compoMain.data.startTime = now;

        compoMain.Commit();
        appData.Save();

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
        let existingTimerTime = compoMain.data.startTime ? (now - compoMain.data.startTime) : 0
        let runningTime = (compoMain.data.workDuration * 1000 - compoMain.data.workTimeElapsed) - existingTimerTime;
        
        if (runningTime < 0) {
            let secondsElapsed = Math.ceil(-runningTime / 1000);
            $('._txt').replaceChildren("-" + utils.SecondsToHMS(secondsElapsed));
        } else {
            let secondsElapsed = Math.ceil(runningTime / 1000);
            $('._txt').replaceChildren(utils.SecondsToHMS(secondsElapsed));
        }

        let addedRestTime = 0;
        if (compoMain.data.startTime) {
            let elapsedTime = now - compoMain.data.startTime;
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
        let elapsedTime = now - compoMain.data.startTime;
        let addedRestTimeInSeconds = Math.floor( (elapsedTime + local.leftOverElapsedTime) / (restoreRateInSeconds * 1000) );
        local.leftOverElapsedTime = (elapsedTime + local.leftOverElapsedTime) % (restoreRateInSeconds * 1000);

        compoMain.data.workTimeElapsed += elapsedTime;
        
        compoMain.data.breakTime = (compoMain.data.breakTime ?? 0) + addedRestTimeInSeconds * 1000;
        compoMain.data.startTime = null;
        compoMain.data.endTime = null;
           
        compoMain.Commit();
        appData.Save();
        
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
        if (compoMain.data.startTime) {
            let now = Date.now();
            let elapsedTime = now - compoMain.data.startTime;
            let addedRestTimeInSeconds = Math.floor( (elapsedTime + local.leftOverElapsedTime) / (restoreRateInSeconds * 1000) );        
            addedRestTime = addedRestTimeInSeconds * 1000;
        }

        let breakTime = (compoMain.data.breakTime ?? 0) + addedRestTime;
        return breakTime;
    }

    // # custom rest
    async function TakeCustomRest() {
        if (!hasRestTime()) return;

        let liveBreakTime = getLiveRestTime();
        let currentRestTimeStr = utils.SecondsToHMS(Math.floor(liveBreakTime / 1000))
        let userVal = await windog.prompt('Custom rest time (HMS format), e.g.: 3m, 1m30s', currentRestTimeStr);
        if (userVal === null) return;

        let duration = utils.ParseHmsToMs(userVal);
        if (!duration) return;
        
        compoCustomBreak.Add(duration, userVal);

        compoCustomBreak.Commit();
        appData.Save();

        uiCustomBreak.Refresh();
        startBreakTimeFromMsDuration(duration);
    }

    // # take rest, # break time, # resting
    function TakeRest() {
        if (!hasRestTime()) return;

        let liveBreakTime = getLiveRestTime();
        startBreakTimeFromMsDuration(liveBreakTime);
    }

    function startBreakTimeFromMsDuration(duration) {
        if (compoMain.data.breakTimeStart) return;

        if (compoMain.data.startTime) {
            Stop();
        }
        
        let now = Date.now();

        compoMain.data.breakTimeStart = now;
        compoMain.data.breakTimeDuration = duration;
          
        compoMain.Commit();
        appData.Save();
        
        $('._txtTimer').replaceChildren( utils.SecondsToHMS(Math.floor(compoMain.data.breakTimeDuration / 1000)) );
        RefreshRestTime();
        StartBreakTime();
    }

    function SetBreakDuration(amount) {
        local.breakDuration = Math.ceil(compoMain.data.workDuration * compoMain.data.workBreakRatio);
    }

    function RefreshRestTime(addedRestTime = 0) {
        let breakTime = (compoMain.data.breakTime ?? 0) + addedRestTime;
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
        localStorage.removeItem('NDQ1MjA3NzI-appData-v4')
    
        location.reload();
    }

    // # recovery, # instant
    async function Recover_() {
        let isConfirm = await windog.confirm('Are you sure?');
        if (!isConfirm) return;
    
        compoMain.data.endTime = null;
        compoMain.data.startTime = null;
        compoMain.data.workTimeElapsed = 0;
    
        viewStateUtil.Remove('mode', ['recovery']);
        $('._txt').replaceChildren(utils.SecondsToHMS(compoMain.data.workDuration));
        $('._txtRestoreTime').replaceChildren();
    
        compoMain.Commit();
        appData.Save();
    }

    async function EditWorkDuration_() {
        let userVal = await windog.prompt('Work session duration (in HMS format, e.g. 7h30m)', utils.SecondsToHMS(compoMain.data.workDuration));
        if (userVal === null) return;
    
        compoMain.data.workDuration = Math.floor(utils.ParseHmsToMs(userVal) / 1000);
        restoreRateInSeconds = Math.floor(compoMain.data.workDuration / local.breakDuration);

        compoMain.Commit();
        appData.Save();
    
        location.reload();
    }
    

    function ApplyRatio() {
        let inputEl = $('._inWorkRestRatio');
        let workBreakRatio = parseFloat(inputEl.value);
        let breakDuration = Math.ceil(compoMain.data.workDuration * workBreakRatio);

        compoMain.data.workBreakRatio = workBreakRatio;

        compoMain.Commit();
        appData.Save();

        location.reload();
    }
    
    function UpdateRatio(evt) {
        let inputEl = evt.target;

        let workBreakRatio = parseFloat(inputEl.value);
        let breakDuration = Math.ceil(compoMain.data.workDuration * workBreakRatio);

        previewRatio({
            workBreakRatio,
            breakDuration,
            workDuration: compoMain.data.workDuration,
        });
    }

    function SetBreak() {
        let userVal = window.prompt('Break time duration (minutes)', local.breakDuration / 60);
        if (userVal === null) return;

        local.breakDuration = parseInt(userVal) * 60;
        restoreRateInSeconds = Math.floor(compoMain.data.workDuration / local.breakDuration);
        
        compoMain.Commit();
        appData.Save();
    }


    function previewRatio(config) {
        let {workBreakRatio, workDuration, breakDuration} = config;
        $('._inWorkRestRatio').value = workBreakRatio;
        $('._txtWorkRestRatio').replaceChildren(workBreakRatio);
        $('._txtInfoRatioConfig ._Work').replaceChildren(utils.SecondsToHMS(workDuration));
        $('._txtInfoRatioConfig ._Break').replaceChildren(utils.SecondsToHMS(breakDuration));
    }

    function refreshRatio() {
        let {workBreakRatio, workDuration} = compoMain.data;
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
        try {
            window.Android?.cancelScheduledNotification?.();
            window.Android?.scheduleNotificationInSeconds?.(Math.floor(compoMain.data.breakTimeDuration / 1000));
        } catch (err) {
            console.error(err);
        }
        
        local.breakTimeInterval = window.setInterval(RefreshBreakTime, local.refreshInterval);
    }

    // # stop rest
    function StopRest(opt) {
        let now = Date.now();
        let breakTimeStart = compoMain.data.breakTimeStart;
        let elapsedTime = now - breakTimeStart;
        let restoredMs = elapsedTime * restoreRateInSeconds;
        let runningTime = (compoMain.data.workDuration * 1000 - compoMain.data.workTimeElapsed) + restoredMs;

        compoMain.data.breakTimeStart = null;
        compoMain.data.breakTimeDuration = 0;
        compoMain.data.breakTime = Math.max(0, compoMain.data.breakTime - elapsedTime);
        compoMain.data.workTimeElapsed = Math.max(0, compoMain.data.workTimeElapsed - restoredMs);

        compoMain.Commit();
        appData.Save();

        if (opt?.isPlayAudio) {
            compoMain.TaskPlayAlarmAudio();
            ui.TurnOnScreen();
            local.isRemindMe = false;
        }
        $('._txtTimer').replaceChildren('---');
        stopBreakTimeInterval();
        viewStateUtil.Set('timerState', ['idle']);
        ui.RefreshRestTime();
        if (!opt?.isBySystem) {
            try {
                window.Android?.cancelScheduledNotification?.();
            } catch (err) {
                console.error(err)
            }
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
        let breakTimeStart = compoMain.data.breakTimeStart;
        let breakTimeDuration = compoMain.data.breakTimeDuration;
        let timeLeft = (breakTimeStart + breakTimeDuration) - now

        if (compoMain.data.breakTimeStart && timeLeft <= 0) {
            StopRest({
                isBySystem: true,
                isPlayAudio: local.isRemindMe,
            });
            return;
        }

        let restoredMs = (now - compoMain.data.breakTimeStart) * restoreRateInSeconds;
        let runningTime = (compoMain.data.workDuration * 1000 - compoMain.data.workTimeElapsed) + restoredMs;
        
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
        
        restoreRateInSeconds = Math.ceil(compoMain.data.workDuration / local.breakDuration);

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

        $('._limit').replaceChildren(utils.SecondsToHMS(compoMain.data.workDuration));

        refreshWorkTime();
        if (compoMain.data.startTime) {
            startWorkTimer();
        }

        if (compoMain.data.breakTimeStart) {
            StartBreakTime();
        }

        refreshTimerState();

        new Promise(async () => {
            await wait.Until(() => (typeof(uiCustomBreak) != 'undefined'), null, 100);
            uiCustomBreak.Init();
        })
    }

    function refreshTimerState() {
        if (compoMain.data.startTime) {
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