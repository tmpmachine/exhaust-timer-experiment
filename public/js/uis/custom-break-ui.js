let uiCustomBreak = (function() {
  
    let SELF = {
      Init,
      Refresh,
      HandleClickList,
    };

    let listContainer = new ListContainerBuilder({
      container: '._listBreakSuggestion',
      template: '#tmp-list-break-suggestion',
      builder: (node, item) => buildListItem(node, item),
      lookup: (containerEl, item) => containerEl.querySelector(`[data-id="${item.id}"]`),
    });

    // # dom events
    function handleClickAction(itemEl, action) {
      
      let {id, duration} = itemEl.dataset;

      let data = {
          id,
          duration: parseInt(duration),
      };
      
      // # events map
      switch (action) {
        case 'delete': deleteItem(data.id); break;
        default: takeBreakFromRecent(data.duration);
      }
    }

    function deleteItem(id) {
      compoCustomBreak.server.RemoveItem(id);
      
      compoCustomBreak.Commit();
      appData.Save();
      
      refreshListItem();
    }

    async function takeBreakFromRecent(duration) {
      let liveBreakTime = ui.GetLiveRestTime();

      if (duration > liveBreakTime) return;

      ui.StartBreakTimeFromMsDuration(duration);
    }

    function HandleClickList(evt) {
      let targetEl = evt.target;
      let itemEl = targetEl?.closest('[data-kind="item"]');
      let action = targetEl?.closest('[data-action]')?.dataset.action;
      
      if (!itemEl) return;

      handleClickAction(itemEl, action);
    }

    function Refresh() {
      refreshListItem();
    }
    
    function buildListItem(node, item) {
      let itemEl = node.querySelector('[data-kind="item"]') ?? node;

      let {id, label, duration} = item;
      
      itemEl.dataset.id = id;
      itemEl.dataset.duration = duration;
      itemEl.querySelector('._labelValue').textContent = label;

      return itemEl;
    }
  
    function refreshListItem() {
      let items = compoCustomBreak.server.GetAll();
      listContainer.Refresh(items);
    }

    function Init() {
      refreshListItem();
    }
    
    return SELF;
    
})();