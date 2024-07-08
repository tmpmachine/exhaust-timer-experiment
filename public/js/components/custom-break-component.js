let compoCustomBreak = (function() {
  
    let SELF = {
        Commit,
        GetStoreKey,
        RestoreData,
        Add,
        server: {
            RemoveItem: (id) => server.RemoveItem(id),
            AddItem: (item) => server.AddItem(item),
            GetAll: () => server.GetAll(),
            GetById: (id) => server.GetItem(id),
            GetIndex: (id) => server.GetIndex(id),
            Clear: () => server.Clear()
        }
    };

    // # data
    let data = {
      items: [],
    };
    // # model
    let itemModel = {
        id: '',
        title: '',
    }
    // # server
    let server = new DataServer({
      dataItems: data.items,
      adaptor: {
        lookupKey: 'id',
        GetItem: (item, value) => item.id == value,
      }
    });

    // # local
    let local = {
        componentStorageKey: 'compoCustomBreak',
    }

    function Commit() {
        appData.SetComponentData(local.componentStorageKey, data);
    }
    
    function GetStoreKey() {
        return local.componentStorageKey;
    }
    
    function RestoreData(noRefData) {
      if (!data) return;

        for (let key in data) {
            if (typeof(noRefData[key]) != 'undefined' && typeof(noRefData[key]) == typeof(data[key])) {
            data[key] = noRefData[key];
            }
        } 
        server.SetDataItems(data.items);
    }
    
    function generateID() {
        return Date.now().toString();
    }

    function Add(duration, label) {
        let id = generateID();
        let item = Object.assign({}, itemModel, {
            id,
            duration,
            label,
        });

        SELF.server.AddItem(item);
    }

    return SELF;
    
})();