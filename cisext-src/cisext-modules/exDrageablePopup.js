var exDrageablePopupVersion = '1.0.3 beta';

/*

Ver 1.0.1 beta du 21 décembre 2022

add : tabs
update : design

ver 1.0.2 beta du 24 décembre 2022

update : optimize display mode when not adminMode.

ver 1.0.3 beta du 28 décembre 2022

fix : with the debugger button, the admin header is wider and the tabs icon in the header body is hidden. 
      Update the width of the header body with the width of the admin header.
*/

window.exDrageablePopup = function () {
  var state = {
    isDragging: false,
    isHidden: true,
    xDiff: 0,
    yDiff: 0,
    x: Math.max(0, (document.body.clientWidth / 2) - 75),
    y: Math.max(0, (document.body.clientHeight / 2) - 50),
  };

  var popup = null,
    btnMove = null,
    btnClose = null,
    btnDebug = null,
    forceToShow = false;

  return {
    get isVisible() { return !state.isHidden },
    init: function (parent = document.body) {

      const html = `
      <div id='exPopup' class='exPopup' style='left: 600px; top: 10px; width: 331px; height: 131px;'>
      <div
          class='exPopup-header'>

          <div class='exPopup-header exPopup-container-tab-button '>
              <div class='exPopup-simpleTabSelect'>
                  <div id='exPopupBtnMove' class='exPopup-container-tab tab-handle i-24-24 i-lighter-grey i-drag-handle'>
                  </div>
              </div>
          </div>

          <div id='exPopupTabs' class='exPopup-header exPopup-container-tab-header '>
          </div>
          <div class='exPopup-header exPopup-container-tab-button'>
              <div class='exPopup-simpleTabSelect'>
                  <div id='exPopupBtnClose' class='exPopup-container-tab tab-close i-24-24 i-white i-close exPopup-tab '>
                  </div>
              </div>
          </div>

      </div>
      <div id='exPopupBody' class='exPopup-body'>
      </div>
  </div>`;

      parent.insertAdjacentHTML('beforeend', html);

      popup = parent.querySelector('#exPopup');
      tabs = parent.querySelector('#exPopupTabs');
      bodies = parent.querySelector('#exPopupBody');
      btnMove = parent.querySelector('#exPopupBtnMove');
      btnClose = parent.querySelector('#exPopupBtnClose');

      btnMove.addEventListener('mousedown', (e) => this.onMouseDown(e));
      tabs.addEventListener('mousedown', (e) => this.onMouseDown(e));


      document.addEventListener('mousemove', (e) => this.onMouseMove(e));
      document.addEventListener('mouseup', (e) => this.onMouseUp(e));

      btnClose.addEventListener('click', (e) => this.closeWindow(e));

      ui.$adminContainer[0].querySelector('.hud-menu-button').insertAdjacentHTML('beforebegin', '<div id="btnDebug" class="exDebug-icon-debug-white i-32-24" title="Ninext debug popup"></div>');
      btnDebug = ui.$adminContainer[0].querySelector('#btnDebug');
      btnDebug.onclick = () => { this.toggle() };
      this.update();

      database.on('admin', '*', () => {
        forceToShow = false;
        this.update();
        //update the witdh of header body with width of header admin.
        document.querySelector('.header-body').style.marginRight = document.querySelector('.header-admin-container').clientWidth+'px';
      }, null);

    },
    // hehe: http://youmightnotneedjquery.com/
    ready: function (fn) {
      if (
        document.attachEvent
          ? document.readyState === 'complete'
          : document.readyState !== 'loading'
      ) {
        fn();
      } else {
        document.addEventListener('DOMContentLoaded', fn);
      }
    },

    addTab: function (tabName, childBody) {
      const tabId = tabs.children.length + 1;
      const html = `
      <div class='exPopup-simpleTabSelect'>
        <div class='exPopup-container-tab exPopup-tab' tabId=${tabId}'>${tabName}</div>
    </div>`
      tabs.insertAdjacentHTML('beforeend', html);
      tabs.children[tabId - 1].onclick = (e) => {
        this.showTab(tabId);
      }
      bodies.append(childBody);
      childBody.setAttribute('tabId', tabId)

      this.showTab(tabId)
      return tabId;
    },

    showTab: function (tabId) {
      debugger;
      var tab = tabs.children[tabId - 1];
      if (tab) {
        tabs.querySelectorAll('.exPopup-tab-selected').forEach(element => {
          element.classList.remove('exPopup-tab-selected');
        });;
        tab.children[0].classList.add('exPopup-tab-selected');

        bodies.querySelectorAll('.exPopup-body > [tabId]').forEach(element => {
          element.style.display = 'none';
        });;
        var element = document.querySelector(`.exPopup .exPopup-body > [tabId='${tabId}']`);
        if (element) element.style.display = null
      }
    },
    update: function () {
      popup.style.display = (state.isHidden || (!forceToShow && !database.adminMode)) ? 'none' : '';
      btnDebug.style.display = !database.adminMode ? 'none' : '';
      btnDebug.className = (state.isHidden ? 'exDebug-icon-debug-white' : 'exDebug-icon-debug-selected') + ' i-32-24';
      this.clipPosition();
    },

    clipPosition: function () {

      popup.style.left = state.x + 'px';
      popup.style.top = state.y + 'px';

    },

    onMouseMove: function (e) {
      if (state.isDragging && !e.target.hasAttribute('tabId')) {
        state.x = e.pageX - state.xDiff;
        state.y = e.pageY - state.yDiff;
      }

      // Update window position
      var w = document.getElementById('window');
      this.clipPosition();
    },

    onMouseDown: function (e) {
      state.isDragging = !e.target.hasAttribute('tabId');
      state.xDiff = e.pageX - state.x;
      state.yDiff = e.pageY - state.y;
    },

    onMouseUp: function (e) {
      if (state.isDragging) {
        state.isDragging = false;
        state.x = e.pageX - state.xDiff;
        state.y = e.pageY - state.yDiff;
      }
    },

    closeWindow: function () {
      state.isDragging = false;
      state.isHidden = true;

      this.update();
    },
    toggle: function () {
      forceToShow = !database.adminMode;
      state.isHidden = !state.isHidden;
      this.update();
    },
    hide: function () {
      state.isHidden = true;
      this.update();
    },
    show: function (childBody = null, x = null, y = null) {
      forceToShow = !database.adminMode;
      if (state.isHidden) {
        popup.style.width = '150px';
        popup.style.height = '100px';
      }
      setTimeout((e) => {
        popup.style.width = 'auto';
        popup.style.height = 'auto';

        setTimeout((e) => {
          this.update();
          popup.style.width = popup.clientWidth + 'px';
          popup.style.height = popup.clientHeight + 'px';

        }, 200)

      }, 200)
      if (x) state.x = x;
      if (y) state.y = y;
    
      if (childBody && childBody.hasAttribute('tabId'))
        this.showTab(childBody.getAttribute('tabId'))
      state.isHidden = false;




      // setTimeout((e) => {
      //   debugger;
      //   // popup.style.width = Math.min(Math.max(Array.from(body.children).map(e => e.scrollWidth)), window.innerWidth - state.x) + 'px';
      //   // popup.style.height = Math.min(Math.max(Array.from(body.children).map(e => e.scrollHeight)), window.innerHeight - state.y) + 'px';
      //   popup.style.width = 'auto';
      //   popup.style.height = 'auto';
      // //  this.update();
      // }, 100)

      this.update();
    },
  };
}();

exDrageablePopup.init();
