let compoMain = (function() {

  let $ = document.querySelector.bind(document);

  let SELF = {
    // Save,
    SetAlarmAudio,
    TaskRemoveAlarmAudio,
    retrieveAudioFile,
    TaskPlayAlarmAudio,
    Init,
    StopTestAlarmAudio,
    HandleInputAlarmVolume,
    Commit,
  };

  Object.defineProperty(SELF, 'data', {
    get: () => data,
  });

    // # data
    let data = {
      alarmVolume: 1,
      workTimeElapsed: 0,
      breakTimeStart: 0,
      breakTimeDuration: 0,
      workDuration: 25 * 60,
      workBreakRatio: 5/25,
      breakTime: 0,
      startTime: 0,
      endTime: 0,
    }

    // # local
    let local = {
      componentStorageKey: 'compoMain',
      audioPlayer: null,
    }

    function Commit() {
      appData.SetComponentData(local.componentStorageKey, data);
    }
    
    function getStoreKey() {
      return local.componentStorageKey;
    }
    
    function restoreData(noRefData) {
      if (!data) return;
      
      for (let key in data) {
        if (typeof(noRefData[key]) != 'undefined' && typeof(noRefData[key]) == typeof(data[key])) {
          data[key] = noRefData[key];
        }
      } 
    }
  
    // # restore
    function restoreAppData() {
      // main
      {
        let data = appData.GetComponentData(getStoreKey());
        restoreData(data);
      }
      // custom break
      {
        new Promise(async () => {
          await wait.Until(() => (typeof(compoCustomBreak) != 'undefined'), null, 100);
          let data = appData.GetComponentData(compoCustomBreak.GetStoreKey());
          compoCustomBreak.RestoreData(data);
        })
      }
    }

    function Init() {
        // alarm volume 
        let alarmVolumePreferences = localStorage.getItem('alarm-audio-volume');
        if (alarmVolumePreferences !== null) {
            data.alarmVolume = parseFloat(alarmVolumePreferences);
        } 
        
        restoreAppData();

        ui.Init();
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