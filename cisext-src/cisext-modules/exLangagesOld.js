
/* 
ver 1.0.0 du 9 décembre 2022
- creation


*/

var exLanguageVersion = '1.0.0 beta';

window.exLanguages = (function () {

    LocaleLanguage = LOCALE;

    // Label de composant
    //document.querySelectorAll('.component > label')

    // Colonne de cellule
    //document.querySelectorAll('.t-head-cell > span')
    //ui.currentView.table.cols[0].$headCell.querySelector('span') = getCaption()

    // Manu table;
    //document.querySelector('.NXTreeView_root').querySelectorAll('.nav-item-text')

    function setLocal(button, v) {
        LocaleLanguage = v;
        Object.values(database.schema.types).forEach(t => t.queryCache = {})

        ui.navigation.updateUI();
        if (ui.currentView && ui.currentView.tid)
            ui.openTable(ui.currentView.tid)

        if (ui.sideEditor)
            ui.sideEditor.updateStructure()

        button.parentElement.parentElement.children.forEach(e => e.children[0].className = 'SimpleTabSelectionRow_view FastClickContainer_root');
        button.className = 'SimpleTabSelectionRow_viewSelected SimpleTabSelectionRow_view FastClickContainer_root';
    }

    function addButton(language, title) {
        var u = document.createElement('div');
        u.className = 'SimpleTabSelectionRow_itemContainer';
        var d = document.createElement('div');
        d.innerText = title;
        d.className = 'SimpleTabSelectionRow_view SimpleTabSelectionRow_viewSelected FastClickContainer_root';
        d.classList.toggle('SimpleTabSelectionRow_viewSelected', language == LocaleLanguage);
        d.style.marginLeft = '5px'
        d.onclick = () => { setLocal(d, language) };
        u.append(d);
        return u;
    }

    var div = document.createElement('div');
    div.style.display = 'flex';
    ui.$headerContainer.append(div);

    window.exLocalize = addButton('default', 'Localization');
    exLocalize.onclick = () => {
        ui.openHome();
        ui.views.home.createView({ base: 'localization' })
    };
    exLocalize.style.display = 'none';
    div.append(exLocalize);

    div.append(addButton('es', 'Español'));
    div.append(addButton('en', 'English'));
    div.append(addButton('fr', 'Français'));
    div.append(addButton('cat', 'Catalan'));
    div.append(addButton('euq', 'Basque'));
    div.append(addButton('gal', 'Galician'));





    function initTranslation(schema) {
        var changed = false;
        function assignCaptions(o) {
            if (!o.captions || !o.captions['default']) {
                // var a = Object.assign({}, o.captions)
                // delete o.captions;
                // o.captions = a;
                // o.captions['default'] = o.caption;
                // changed = true;
            }
            Object(o).__defineGetter__('caption', function () {
                return this.captions[LocaleLanguage] || this.captions['default'] ||
                    Object.values(this.captions)[0];
            })
            Object(o).__defineSetter__('caption', function (v) {
                var a = Object.assign({}, this.captions)
                delete this.captions;
                this.captions = a;
                this.captions[LocaleLanguage] = v
            })
        }

        function assignTooltips(o) {
            if (!o.tooltips || !o.tooltips['default']) {
                /*                var a = Object.assign({}, o.tooltips)
                                delete o.tooltips;
                                o.tooltips = a;
                                o.tooltips['default'] = o.tooltip;
                                changed = true;*/
            }
            Object(o).__defineGetter__('tooltip', function () {
                return this.tooltips[LocaleLanguage] || this.tooltips['default'] ||
                    Object.values(this.tooltips)[0];
            })
            Object(o).__defineSetter__('tooltip', function (v) {
                var a = Object.assign({}, this.tooltips)
                delete this.tooltips;
                this.tooltips = a;
                this.tooltips[LocaleLanguage] = v
            })
        }


        Object.values(schema.types).forEach(t => {
            assignCaptions(t);
            //           assignTooltips(t);
            t.sorted.forEach(f => {
                assignCaptions(f);
                assignTooltips(f);
            })
        })

        if (changed) {
            debugger;
            database.schemaChanged();

        }
    }

    //debugger

    initTranslation(database.schema);
    ;
    database.schema.cloneOld = database.schema.clone;
    database.schema.clone = function () {
        debugger;
        var clone = this.cloneOld();
        initTranslation(clone);
        return clone;
    }

    database.setSchemaOld = database.setSchema;
    database.setSchema = function (s) {
        debugger;
        this.setSchemaOld(s);
        initTranslation(this.schema);
    }

    database.on('schema', '*', () => {
        debugger;
        initTranslation(database.schema);

    }, null);

    database.on('admin', '*', () => {
        //debugger;
        exLocalize.style.display = database.adminMode ? 'flex' : 'none';
    }, null);


    return {
        version: exLanguageVersion
    }
}());