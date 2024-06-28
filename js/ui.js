let ui = (function() {
  
    let SELF = {
        TurnOffScreen_,
        TurnOnScreen,
        Init,
    };
    
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