let appData = (function() {
  
    let SELF = {
      SetComponentData,
      GetComponentData,
      Save,
      Init,
    };
    
    // data
    let data = {
        components: {
            compoMain: {},
            compoCustomBreak: {},
        },
    };

    // # local
    let local = {
        storeKey: 'NDQ1MjA3NzI-appData-v3',
    };
    
    function SetComponentData(key, componentData) {
      data.components[key] = componentData;
    }
  
    function GetComponentData(componentKey) {
      if (!data.components[componentKey]) return null;
  
      return clearReference(data.components[componentKey]);
    }
    
    function clearReference(data) {
        return JSON.parse(JSON.stringify(data));
    }

    function Init() {
        let savedData = localStorage.getItem(local.storeKey);
        if (savedData) {
            data = JSON.parse(savedData);
        }
    }
    
    function Save() {
      localStorage.setItem(local.storeKey, JSON.stringify(data));
    }
    
    return SELF;
    
})();