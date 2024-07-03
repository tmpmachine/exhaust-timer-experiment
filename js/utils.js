let utils = (function() {
  
    let SELF = {
        SecondsToHMS,
    };

    function SecondsToHMS(seconds) {
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

    return SELF;
    
})();