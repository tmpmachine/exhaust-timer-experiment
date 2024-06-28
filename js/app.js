let app = (function() {
  
    let SELF = {
      SetAlarmAudio,
      TaskRemoveAlarmAudio,
      retrieveAudioFile,
      TaskPlayAlarmAudio,
      Init,
      StopTestAlarmAudio,
      HandleInputAlarmVolume,
    };

    let data = {
        alarmVolume: 1,
    }
    let local = {
        audioPlayer: null,
    }

    function Init() {
        
        // alarm volume 
        let alarmVolumePreferences = localStorage.getItem('alarm-audio-volume');
        if (alarmVolumePreferences !== null) {
            data.alarmVolume = parseFloat(alarmVolumePreferences);
        } 
    }

    
  function StopTestAlarmAudio() {
    if (!local.audioPlayer) return;
    
    local.audioPlayer.pause();
  }
    
    function SetAlarmAudio() {
        let input = document.createElement('input');
        input.type ='file';
        input.accept ='audio/*';
        input.onchange = function() {
          storeAudioFile(this.files[0]);
        };
        document.body.append(input);
        input.click();
        input.remove();
      }
      
      function TaskRemoveAlarmAudio() {
        return idbKeyval.del('audioFile');
      }
      
      async function storeAudioFile(file) {
        try {
          await idbKeyval.set('audioFile', file);
        } catch (error) {
          console.error('Error storing File Handle:', error);
        }
      }
      
      async function retrieveAudioFile() {
        try {
          const file = await idbKeyval.get('audioFile');
          if (file) {
            return file;
          } else {
            console.error('File Handle not found in IndexedDB.');
          }
        } catch (error) {
          console.error('Error retrieving File Handle:', error);
        }
      }
      
      async function TaskPlayAlarmAudio() {
        let audioFile = await retrieveAudioFile();
        if (audioFile) {
          
          let audioURL = URL.createObjectURL(audioFile);
          
          if (local.audioPlayer) {
            local.audioPlayer.pause();
            local.audioPlayer.src = audioURL;
          } else {
            local.audioPlayer = new Audio(audioURL);
          }
    
          local.audioPlayer.volume = data.alarmVolume;
          local.audioPlayer.play();
    
        }
      }
      
      function HandleInputAlarmVolume(evt) {
        data.alarmVolume = parseFloat(evt.target.value);
        localStorage.setItem('alarm-audio-volume', evt.target.value);
        
        if (local.audioPlayer) {
          local.audioPlayer.volume = data.alarmVolume;
        }
      }
    
    return SELF;
    
})();

let $ = document.querySelector.bind(document);

let appData = {
    workDuration: 25 * 60,
    breakDuration: 3 * 60,
    energyPoint: null,
    startTime: null,
    endTime: null,
};
let local = {
    isRemindMe: false,
    refreshInterval: 1000,
}
let savedData = localStorage.getItem('NDQ1MjA3NzI-appData');
if (savedData) {
    appData = JSON.parse(savedData);
}

let energyPoint = appData.energyPoint ?? appData.workDuration;
let restoreRateInSeconds = Math.ceil(appData.workDuration / appData.breakDuration);

function resetData() {
    let isConfirm = window.confirm('Are you sure?');
    if (!isConfirm) return;

    localStorage.removeItem('NDQ1MjA3NzI')
    localStorage.removeItem('NDQ1MjA3NzI-allocation')
    localStorage.removeItem('NDQ1MjA3NzI-timeLimit')
    localStorage.removeItem('NDQ1MjA3NzI-appData')

    energyPoint = appData.workDuration;

    refresh();
    location.reload();
}

function Save() {
    appData.energyPoint = energyPoint;

    let jsonData = JSON.stringify(appData);
    localStorage.setItem('NDQ1MjA3NzI-appData', jsonData);
}

function remindMe() {
    local.isRemindMe = true;
    ui.TurnOffScreen_();
}

function recover() {
    let isConfirm = window.confirm('Are you sure?');
    if (!isConfirm) return;

    appData.endTime = null;
    appData.startTime = null;
    energyPoint = appData.workDuration;

    viewStateUtil.Remove('mode', ['recovery']);
    $('._txt').replaceChildren(secondsToHMS(appData.workDuration));
    $('._txtRestoreTime').replaceChildren();

    Save();
}
  

function setLimit() {
    let userVal = window.prompt('Work session duration (minutes)', appData.workDuration / 60);
    if (userVal === null) return;

    appData.workDuration = parseInt(userVal) * 60;
    restoreRateInSeconds = Math.floor(appData.workDuration / appData.breakDuration);
    
    Save();

    $('._limit').replaceChildren(secondsToHMS(appData.workDuration));
    refresh();
}

function setBreak() {
    let userVal = window.prompt('Break time duration (minutes)', appData.breakDuration / 60);
    if (userVal === null) return;

    appData.breakDuration = parseInt(userVal) * 60;
    restoreRateInSeconds = Math.floor(appData.workDuration / appData.breakDuration);
    
    Save();
}


  function start() {
    $('._txtRestoreTime').replaceChildren();
    if (appData.startTime) return;

    let now = Date.now();

    if (appData.endTime) {
        energyPoint = energyPoint + Math.floor((now - appData.endTime) / 1000);
    }

    appData.endTime = null;
    appData.startTime = now;

    Save();

    refresh();
  }

  function stop() {
    if (appData.endTime) return;
    
    viewStateUtil.Add('mode', ['recovery']);

    let now = Date.now();

    if (appData.startTime) {
        energyPoint = energyPoint - Math.ceil((now - appData.startTime) / 1000);
    }
    
    appData.startTime = null;
    appData.endTime = now;

    Save();
    
    refresh();
  }
  
  function refresh() {
    
    if (appData.endTime) {
        let now = Date.now();
        let secondsElapsed = Math.floor((now - appData.endTime) / 1000);
        let restoredMs = secondsElapsed * restoreRateInSeconds * 1000;
        let runningTime = energyPoint * 1000 + restoredMs;
        let elapsedSecondsUntilFullyRestored = appData.workDuration - Math.floor(runningTime / 1000);
        runningTime = Math.min(appData.workDuration * 1000, runningTime);

        viewStateUtil.Add('mode', ['recovery']);

        if (runningTime >= appData.workDuration * 1000) {
            appData.endTime = null;
            energyPoint = appData.workDuration;
            viewStateUtil.Remove('mode', ['recovery']);
            app.TaskPlayAlarmAudio();

            if (local.isRemindMe) {
                local.isRemindMe = false;
                ui.TurnOnScreen();
            }

            Save();
        }

        if (runningTime < 0) {
            $('._txt').replaceChildren("-" + secondsToHMS(Math.ceil(-runningTime / 1000)));
        } else {
            $('._txt').replaceChildren(secondsToHMS(Math.floor(runningTime / 1000)));
        }

        if (elapsedSecondsUntilFullyRestored > 0) {
            $('._txtRestoreTime').replaceChildren("Time until fully restored : " + secondsToHMS(Math.ceil(elapsedSecondsUntilFullyRestored / restoreRateInSeconds)));
        } else {
            $('._txtRestoreTime').replaceChildren();
        }

    } else if (appData.startTime) {
        let now = Date.now();
        let runningTime = energyPoint * 1000 - (now - appData.startTime);

        if (runningTime < 0) {
            $('._txt').replaceChildren("-" + secondsToHMS(Math.ceil(-runningTime / 1000)));
        } else {
            $('._txt').replaceChildren(secondsToHMS(Math.floor(runningTime / 1000)));
        }
    }

  }

  
  function secondsToHMS(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainderSeconds = seconds % 60;
    let timeString = '';
  
    if (hours > 0) {
      timeString += `${hours}h`;
    }
  
    if (minutes > 0 || hours > 0) {
      timeString += `${minutes}m`;
    }
  
    if (remainderSeconds > 0 || (hours === 0 && minutes === 0)) {
      timeString += `${remainderSeconds}s`;
    }
  
    if (seconds === 0) {
      timeString = '0s';
    }
  
    return timeString;
  }

window.setInterval(refresh, local.refreshInterval);
$('._limit').replaceChildren(secondsToHMS(appData.workDuration));
$('._txt').replaceChildren(secondsToHMS(energyPoint));
refresh();