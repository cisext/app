
/* 
ver 1.0.0 du 9 décembre 2022
- creation

var 1.1.0 du 15 décembre 2022
- total redesign 

ver 1.1.1 beta du 28 décembre 2022

fix : with the language menu button, the admin header is wider and the tabs icon in the header body is hidden. 
      Update the width of the header body with the width of the admin header.
fix : the function getCaption in updateUI crash if captions is not initialized. 
*/

var exLanguageVersion = '1.1.1 beta';

const countriesLanguages = {
    "en": "English",
    "de": "Deutsch",
    "ca": "Canadien",
    "es": "Español",
    "fr": "Français",
    "it": "Italiano",
    "pl": "Polska",
    "pt": "Português",
    "ru": "Русский",
    "chs": "简体中文",
    "cht": "传统中国"
};

window.exLanguages = (function () {

    LocaleLanguage = LOCALE;
    interval = null;

    // update label on interface
    function updateUI() {
        try {

            // sub function to update caption of component (field or table)
            function getCaption(field) {
                var r = field.captions && field.captions[LocaleLanguage];
                r = r || field.captions && field.captions['default'];
                r = r || field.caption;
                r = database.adminMode ? field.caption : r;
                return r;
            }

            // update field labels
            var el = document.querySelectorAll(`.component > label`)
            el.forEach(l => {
                var c = $(l.closest(".component")).data('component')
                if (c && c.field)
                    l.innerText = getCaption(c.field);

            })

            // update cols labels on view 
            if (ui.currentView.table) {

                ui.currentView.table.cols.forEach(c => {
                    if (c.directFid)
                        c.$headCell.querySelector('span').innerText = getCaption(c.field);
                })
            }

            // update table menu on left on screen 
            document.querySelector('.NXTreeView_root').querySelectorAll('.nav-item-text').forEach(l => {
                var typeName = l.parentElement.getAttribute('data-testid').match(/[^nx\-tree\-view\-select\-].*/)[0];
                var type = database.schema.findType(typeName);
                if (type) {
                    l.innerText = getCaption(type);
                }
            });

            //update width of header body.
            document.querySelector('.header-body').style.marginRight = document.querySelector('.header-admin-container').clientWidth + 'px';
        }
        catch (err) {
            console.log("erreur d'affichage de la langue", err)
        }
    }

    // init the language menuDropdown
    function initLanguageMenu() {
        // toogle show/hide langage menu
        function menuClick() {
            document.getElementById("exMenuLang").classList.toggle("show");
        }

        // Close the menuDropdown if the user clicks outside of it
        window.onclick = function (event) {
            if (!event.target.matches('.menuDropbtn')) {
                var menuDropdowns = document.getElementsByClassName("menuDropdown-content");
                var i;
                for (i = 0; i < menuDropdowns.length; i++) {
                    var openDropdown = menuDropdowns[i];
                    if (openDropdown.classList.contains('show')) {
                        openDropdown.classList.remove('show');
                    }
                }
            }
        }

        //insert lang menu next to user button
        var html = `<div class="menuDropdown">
                    <button id="exMenuLangButton" onclick="document.getElementById('exMenuLang').classList.toggle('show')" class="menuDropbtn nx-button-text blue">Dropdown</button>
                    <div id="exMenuLang" class="menuDropdown-content"></div>
                </div>`;
        ui.$adminContainer[0].insertAdjacentHTML('afterbegin', html);
        ui.$menuLang = ui.$adminContainer[0].querySelector('.menuDropdown');
        ui.$menuLang.button = ui.$menuLang.querySelector('#exMenuLangButton')
        ui.$menuLang.menu = ui.$menuLang.querySelector('#exMenuLang')

        // adding action when user click on menu items
        function addLang(language, title) {
            var a = document.createElement('a');
            a.innerText = title;
            a.onclick = () => { setLocal(language) };
            return a;
        }

        // find all linguage definition present in database
        var langs = [];
        function pushLang(captions) {
            // remove default lang. It hertis from previous verison of exLanguage
            if (captions && captions['default'] != null) {
                delete captions['default'];
            }

            captions && Object.keys(captions).forEach(l => {
                langs.indexOf(l) == -1 && langs.push(l);
            })

        }
        Object.values(database.schema.types).forEach(t => {
            pushLang(t.captions)

            t.sorted.forEach(f => {
                pushLang(f.captions)
                pushLang(f.tooltips)
            })
        })

        langs.forEach(l => countriesLanguages[l] && ui.$menuLang.menu.append(addLang(l, countriesLanguages[l])))

    }

    function initLocalizationMenu() {
        // This two hook compsante the "s" put in the end of "localization" in case function inside setNavigationState
        // who is not on case function inside of createView
        ui.Views.home.prototype.setNavigationStateOld = ui.Views.home.prototype.setNavigationState;
        ui.Views.home.prototype.setNavigationState = function (view) {
            view.vid = view.vid == 'localization' ? 'localizations' : view.vid;
            return this.setNavigationStateOld(view);
        }
        ui.Views.home.prototype.createViewOld = ui.Views.home.prototype.createView;
        ui.Views.home.prototype.createView = function (view) {
            view.base = view.base == 'localizations' ? 'localization' : view.base;
            return this.createViewOld(view)
        }

        // Add Localization tab in home header of Ninox
        ui.Views.home.prototype.getTabsOld = ui.Views.home.prototype.getTabs;
        ui.Views.home.prototype.getTabs = function (tab) {
            var t = this.getTabsOld(tab);
            if (database.adminMode)
                t.push({
                    id: "localization",
                    iconClass: "",
                    isSelected: "localization" === tab,
                    text: locale.localization
                })
            return t;
        }

    }

    // set the current lagnague display
    function setLocal(v) {
        LocaleLanguage = v;
        ui.$menuLang.button.textContent = v.toUpperCase();
    }

    // start language update
    function start() {

        //Init the intervale tu refrech UI each 200ms;
        interval = setInterval(() => {
            updateUI()
        }, 200);

        initLanguageMenu();
        initLocalizationMenu();

        setLocal(LocaleLanguage)
    }

    // stop language update
    function stop() {
        clearInterval(interval);
        interval = null;

        setLocal(locale.CC);
        updateUI();
    }
    start();

    return {
        version: exLanguageVersion
    }
}());
