var exFieldsInspectorVersion = '1.0.11 beta';


/*

Ver 1.01 beta du 11 septembre 2022
- update : modification of the shape of the badges so that colorblind people can recognize the level of importance. 
- fix : modification of the scroll so that it never moves,

Ver 1.02 beta du 13 septembre 2022
- improvement: the list of codes to be inspected is loaded only at startup and when the database is updated. 
- correct : only the code directly linked to the file is found. Previously, all the codes linked, directly or by another field, were recovered.
These two updates improve the display time of the field modification window,

Ver 1.0.3 du 3 octobre 2022

- added hierarchical display of dependencies 
- added a search on field names in the field edition window. 

ver 1.0.4 du 4 octobre 2022
- fixed : when a field is modified, the badges disappear and the search field no longer works. Add 

ver 1.0.5 du 6 ocotbre 2022
- fixed : replace alert popup to console.log in error case.
- check if editor contain fields before to create badges. 

ver 1.0.6 du 11 octobre 2022 
- improve : update the inspector when a field or a table is modified.

ver 1.0.7 du 12 octobre 2022
- add edit button.

ver 1.0.8 du 17 octobre 2022
- bug fixe : The title of the Ninox yes/no sliders changed from above to next to it when  the value of the field changed.
        The active and nested CSS classes had the same name as the ones in Ninox. They were changed to Ninext-active and Ninext-nested.

ver 1.0.9 du 1 novembre 2022
- bug fixe : on getEditorButton function, verify if queryAll return something before use findLast. 

var 1.0.10 du 8 décembre 2022
- update : use unique popup window for filedsInspector, codeOverview and debugConsole

var 1.0.11 du 24 décembre 2022
- update : autamoticly displays popup and FiledsInspector tab when user select field.

        */

window.exFieldsInspector = function () {
    var editType = null;
    var type = null;
    var fields = null;
    var myInterval = null;
    var currentField = null;
    var popup = window.exDrageablePopup;

    var stack = [];

    var container = document.createElement('div');
    var head = document.createElement('div');
    var search = null;
    var clearIcon = null;
    var lstTypes = document.createElement('select');
    var lstFields = document.createElement('select');
    var body = document.createElement('div');
    var masterEditButton = document.createElement('div');

    createBodyOfPopup();
    var fieldTab = popup.addTab('Fields', container);

    database.on("schema", "*", () => {
        update(true);
    }, popup);

    database.on("admin", "*", () => {
        refreshMasterEditButton();
    }, popup);

    database.on("*", "*", () => {

    })

    function createBodyOfPopup() {

        head.append(lstTypes);
        head.append(lstFields);
        container.appendChild(head);
        container.appendChild(body);

        head.className = 'exHeaderContainer';

        lstTypes.innerHTML = "";
        Object.values(database.schema.types).forEach(type => {
            opt = document.createElement('option');
            opt.label = type.caption;
            opt.value = type.id;
            opt.type = type;
            lstTypes.append(opt);
        })

        lstTypes.className = 'exlistFields input-text';
        lstTypes.onchange = (e) => {
            if (lstTypes.selectedOptions[0]) {
                var type = lstTypes.selectedOptions[0].type;
                lstFields.innerHTML = "";
                Object.values(type.fields).forEach(field => {
                    opt = document.createElement('option');

                    opt.label = field.caption;
                    var lst = exFinder.find({ field: { fieldName: field.caption, tableName: field.type.caption } }, "field");
                    if (lst && lst.length)
                        opt.label += ` [ ${lst.length.toString()} ]`;

                    opt.value = field.id;
                    opt.field = field;
                    lstFields.append(opt);
                })
                lstFields.onchange();
            }
        }

        lstFields.className = 'exlistFields input-text';
        lstFields.onchange = (e) => {
            if (lstFields.selectedOptions[0]) {
                debugger;
                currentField = lstFields.selectedOptions[0].field;

                var findList = exFinder.find({ field: { fieldName: currentField.caption, tableName: currentField.type.caption } }, "field");
                var detail = document.createElement('div');
                detail.className = "exFieldDetailContainer";
                addLinkedField(currentField, findList, detail, true);
                setBodyElement(detail);
            }
        }

        masterEditButton.className = 'exFieldDetailEditButton i-32-24 i-white i-setting-tool';
        masterEditButton.style = 'align-self: center;';

        head.append(masterEditButton);

        masterEditButton.onmouseover = e => setEditButtonState(masterEditButton);
        setInterval(() => {
            setEditButtonState(masterEditButton);
        }, 500);

        masterEditButton.onclick = (event) => {
            if (currentField && editButtonClick({ typeOfLink: 1, tableId: currentField.type.id, fieldId: currentField.id }))
                event.stopPropagation();
        }

        refreshMasterEditButton();


    }

    function setBodyElement(element) {
        while (body.firstChild) {
            body.removeChild(body.firstChild);
        }
        body.append(element);
    }
    function addLinkedField(field, findList, parentElement, visible) {
        lineFieldName = document.createElement('div');
        lineFieldName.className = 'exFieldTitle';
        lineFieldName.append($.parseHTML(`<div style='width:100%'>${field.type.caption + '.' + field.caption}</div>`)[0])
        if (!visible)
            lineFieldName.classList.add('ninext-nested');
        else {
            {
                lineFieldName.style.marginLeft = '0px';
                stack = [];
                stack.push(field.type.caption + "." + field.caption);

                //                                        lineRefresh = $.parseHTML(`<div class='i-16 i-light-grey i-reload' style='width:16px, height:16px'>${field.type.caption + '.' + field.caption}</div>`)[0])

            }
        }
        parentElement.append(lineFieldName);
        findList.map((e) => {
            var line = document.createElement('div');
            line.className = 'exFieldDetail'

            var lineTitle = document.createElement('div');
            lineTitle.className = 'exFieldDetailTitle';

            var caret = document.createElement('div');
            caret.className = 'i-32-24 i-light-grey  i-line-down i-line-right';
            lineTitle.append(caret);
            lineTitle.onclick = (e) => {
                lineTitle.parentElement.children.forEach((c) => {
                    if (c != lineTitle) c.classList.toggle("ninext-active")
                });
                caret.classList.toggle("i-line-right");

            }
            line.append(lineTitle);

            icon = document.createElement('div');
            icon.className = `t-columneditor-icon i-32-24 i-light-grey`;
            if (e.fieldObj)
                icon.classList.add(`i-field-${e.fieldObj.base}`)
            else
                icon.classList.add(`i-field-${e.exp.returnType.base}`)

            lineTitle.append(icon);

            var badge = document.createElement('div');
            badge.className = `exFieldBadge exTooltip exFieldBadgeLevel${e.level ? e.level : 0}`
            icon.append(badge);

            var title = document.createElement('span');
            title.className = 'exFieldDetailTitle-title';

            e.root.split('.').forEach(t => {
                title.insertAdjacentHTML('beforeend', '<div class="fn-breadcrumb-arrow i-18-18 i-dark-grey i-arrow-solid-right"></div>');
                title.insertAdjacentHTML('beforeend', t);
            })
            title.children[0].remove();
            lineTitle.append(title);


            var button = document.createElement('div');
            button.className = 'exFieldDetailEditIcon i-32-24 i-white i-setting-tool';
            lineTitle.append(button);

            lineTitle.onmouseover = () => setEditButtonState(button);

            button.onclick = (event) => {
                if (editButtonClick(e))
                    event.stopPropagation();
            }

            if (!visible)
                line.classList.add('ninext-nested');
            else
                line.style.marginLeft = '0px';

            parentElement.append(line);

            var fieldCode = document.createElement('pre');
            fieldCode.className = 'exFieldCode ninext-nested';
            var r = util.escapeId(field.caption).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
            var begin = (r[0] == "'") ? '\\B' : '\\b';
            var end = (r[r.length - 1] == "'") ? '\\B' : '\\b';
            fieldCode.innerHTML = e.caption.replace(RegExp(`${begin}${r}${end}`, 'g'), `<b>${util.escapeId(field.caption)}</b>`)
            line.append(fieldCode);

            if (e.fieldObj && stack.indexOf(e.table + "." + e.field) == -1) {
                stack.push(e.table + "." + e.field);
                var lst = exFinder.find({ field: { fieldName: e.field, tableName: e.table } }, "field");
                if (lst && lst.length) {
                    addLinkedField(e.fieldObj, lst, line, false);
                    badge.textContent = lst.length.toString();
                }
            }
        });
    }

    function editButtonClick(findElement) {
        if (editingInProgress())
            alert('please, finish current editing before')
        else {
            closeCurrentsEditors()
                .then(() => {
                    openTable(findElement.tableId)
                    switch (findElement.typeOfLink) {
                        case 0: openFieldsEditor();
                            break;
                        case 1: openFieldsEditor();
                            openFieldEditor(findElement.fieldId);
                            break;
                        case 2:
                        case 3: openFieldsEditor();
                            openFieldEditor(findElement.fieldId);
                            openFieldEditColumns();
                            openColumnEditor(findElement.name);
                            break;
                        case 4:
                        case 5: openColumnsEditor();
                            openColumnEditor(findElement.name);
                            break;
                    }

                });
            return true;
        }
    }

    function setEditButtonState(button) {
        button.style.backgroundColor = editingInProgress() ? 'lightgray' : null;
        button.style.visibility = database.adminMode ? 'visible' : 'hidden';
    };

    function refreshMasterEditButton() {
        masterEditButton.style.display = database.adminMode ? 'block' : 'none';
        setEditButtonState(masterEditButton);
    }

    function setField(f) {
        lstTypes.value = f.type.id;
        lstTypes.onchange();
        lstFields.value = f.id;
        lstFields.onchange();
        popup.showTab(fieldTab);
    };

    function update(discret = false) {
        exFinder.invalidate();
        createBodyOfPopup();
        if (!discret) {
            if (currentField) setField(currentField)
            else lstTypes.onchange();
        }
    };

    function closeCurrentsEditors() {
        return new Promise(async (resolve) => {

            while (getCloseButton()) {
                getCloseButton().click();
                await new Promise(r => setTimeout(r, 10));
            }
            resolve();
        });
    }

    function openTable(typeId) {
        ui.openTable(typeId);
    }
    function openFieldsEditor() {
        ui.views.table.table.menuEditTable();
    }

    function openColumnsEditor() {
        ui.views.table.table.menuEditColumns();
    }

    function openFieldEditColumns() {
        var btn = getEditorButton(getLocale().editColumns);
        btn && btn.click();
    }
    function getTypeEditor() { return document.querySelector('.typeeditor') };
    function getCloseButton() {
        return getEditorButton(getLocale().okay);
    };

    function editingInProgress() {
        return getEditorButton(getLocale().save) || (getEditorButton(getLocale().cancel) && getEditorButton(getLocale().cancel).style.display != 'none');
    }

    function getEditorButton(buttonName) {
        // ver 1.0.8        return Object.values(document.querySelectorAll('.nx-button-text')).findLast((b) => (b.textContent == buttonName) && b.closest('.nx-backplane'))
        var bt = document.querySelectorAll('.nx-button-text');
        return bt && Object.values(bt).findLast && Object.values(bt).findLast((b) => (b.textContent == buttonName) && b.closest && b.closest('.nx-backplane'))
    }
    function openColumnEditor(colName) {
        var col = Array.from(document.querySelector('.vieweditor').querySelector('.accordion-pane').querySelectorAll('.t-columneditor-label')).find(e => e.textContent == colName)
        if (col) {
            var evt = new MouseEvent("mouseup", {
                bubbles: true,
                cancelable: true,
                view: window
            });
            col.dispatchEvent(evt);
        }
    }
    function openFieldEditor(fieldId) {
        fields = Array.from(document.querySelector('.typeeditor').querySelector('.accordion-pane').querySelectorAll('.t-columneditor-column'));
        var fld = fields && fields.find(e => { var cpn = $(e).data('field'); return cpn && cpn.id == fieldId })
        if (fld) {
            var evt = new MouseEvent("mouseup", {
                bubbles: true,
                cancelable: true,
                view: window
            });
            fld.dispatchEvent(evt);
        }
        return fld;
    }

    update();
    return {
        version: exFieldsInspectorVersion,
        set field(f) {
            debugger;
            currentField = f;
            setField(f.field);

            var r = exUtilsNx.getBoundingRect(f.label, document.body);
            if (!popup.isVisible)
                popup.show(container, r.left + r.width + 10, r.top);
        },
        get field() { return currentField }
    }
}();
