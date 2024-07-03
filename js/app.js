let app = (function() {

  let $ = document.querySelector.bind(document);

  let SELF = {
    Save,
    SetAlarmAudio,
    TaskRemoveAlarmAudio,
    retrieveAudioFile,
    TaskPlayAlarmAudio,
    Init,
    StopTestAlarmAudio,
    HandleInputAlarmVolume,
  };

    // # data
    let data = {
      alarmVolume: 1,
    }

    // # local
    let local = {
        audioPlayer: null,
    }

    function Save() {
      appData.energyPoint = ui.GetEnergyPoint();

      let jsonData = JSON.stringify(appData);
      localStorage.setItem('NDQ1MjA3NzI-appData-v3', jsonData);
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

// # appdata
let appData = {
  workTimeElapsed: 0,
  breakTimeStart: null,
  breakTimeDuration: 0,
  workDuration: 25 * 60,
  workBreakRatio: 5/25,
  energyPoint: null,
  breakTime: 0,
  startTime: null,
  endTime: null,
};
let savedData = localStorage.getItem('NDQ1MjA3NzI-appData-v3');
if (savedData) {
    appData = JSON.parse(savedData);
}