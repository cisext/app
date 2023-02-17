var exFieldsEditorVersion = '1.0.11 beta';


/*

Ver 1.0.11 beta du 27 décembre 2022
- creation : separation from FiledsInspector.js 
        */

window.exFieldsEditor = function () {
    var editType = null;
    var type = null;

    var myInterval = null;

    var search = null;
    var clearIcon = null;

    function getFields() {
        debugger;
        return Array.from(document.querySelector('.typeeditor').querySelector('.accordion-pane').querySelectorAll('.t-columneditor-column')).map((c) => {
            return {
                el: c,
                icon: c.querySelector('.t-columneditor-icon'),
                label: c.querySelector('.t-columneditor-label'),
                field: $(c).data('field')
            }
        })
    }
    function addSearchOnEditor() {
        var headEditor = document.querySelector('.typeeditor').querySelector('.accordion-head');
        headEditor.style.display = 'flex';
        headEditor.style.padding = '0px 5px 0px 5px';
        headEditor.textContent = 'Fields : ';


        //search = $.parseHTML( `<input type="text" placeholder="Serch..." class="hud-menu-search-input" style="display: none;">`)[0];

        var stringEditor = $.parseHTML(`<div class="string-editor" style="flex: 1 1 auto; position: relative">
            <div class="nx-input" style ="box-sizing: border-box; height: 100%">
                <input class="nx-input__input" type="text" value="" style="display:none">
            </div>
        </div>`)[0];
        var inputBox = stringEditor.querySelector('.nx-input');
        search = stringEditor.querySelector('.nx-input__input');

        search.onkeyup = (event) = updateUIFromSearch;

        search.onblur = (event) => {
            search.style.display = 'none';
            searchIcon.style.display = '';
        }
        headEditor.append(stringEditor)

        var searchIcon = $.parseHTML(`<div class="hud-menu-search-placeholder" style="">
                                    <div class="i-24-16 i-light-grey i-search" style="opacity: 0.5;margin-left: 3px;"></div>
                                    <div id='searchTitle' style="overflow: hidden;text-overflow: ellipsis;white-space: nowrap; cursor : text">Search...</div>
                                </div>`)[0];
        searchIcon.onclick = (event) => {
            searchIcon.style.display = 'none';
            search.style.display = '';
            search.focus();

        };
        var searchTitle = searchIcon.querySelector('#searchTitle');
        inputBox.append(searchIcon);

        clearIcon = $.parseHTML(`<div style="width:0;flex:0 0 0px;-webkit-flex:0 0 0px">
                                    <div class="i-32-16 i-light-grey i-close" style="margin-left: -32px; margin-top: 4px; cursor:pointer"></div>
                                </div>`)[0];
        clearIcon.onclick = (event) => {
            search.value = '';
            search.onkeyup(event);
            searchTitle.textContent = 'Search...';
        }

        inputBox.append(clearIcon);
    };

    function addBadgesOnFields() {
        debugger;

        getFields().forEach((f) => {
            if (f.field.base == 'tab')
                f.el.style.backgroundColor = '#eff1f9';
            if (!f.field.isUI) {
                f.findList = exFinder.find({ field: { fieldName: f.field.id, tableName: f.field.type.caption } }, "field");

                f.findList && f.findList.length && (f.minLevel = Math.min(...f.findList.map(e => e.level)));

                f.badge = document.createElement("span");
                f.badge.className = 'exFieldBadge exTooltip exFieldBadgeLevel' + (f.minLevel ? f.minLevel : 0);
                f.badge.style.visibility = f.findList && f.findList.length ? 'visible' : 'hidden';
                f.badge.innerText = f.findList && f.findList.length;
                f.icon.append(f.badge);
                f.badge.addEventListener('mouseup', (e) => e.stopPropagation());
                f.badge.addEventListener('mousedown', (e) => e.stopPropagation());
                f.badge.addEventListener('click', (e) => {
                    exFieldsInspector.field = f;
                })
            }
        });
    };

    function updateUIFromSearch() {
        var filter = exUtilsNx.removeAccent(search.value.toUpperCase());
        searchTitle.textContent = search.value;
        clearIcon.style.display = searchTitle.textContent.length ? '' : 'none';
        getFields().forEach((field) => {
            txtValue = exUtilsNx.removeAccent(field.el.textContent || field.el.innerText);
            if (field.field.base == 'tab' || (txtValue.toUpperCase().indexOf(filter) > -1))
                field.el.style.display = "";
            else
                field.el.style.display = "none";
        })

    }


    function getTypeEditor() { return document.querySelector('.typeeditor') };


    return {
        version: exFieldsEditorVersion,
        // On first call, put this selectTab in place to Ninox function and save the oldest
        set field(f) {
            setField(f);
        },
        hook: () => {
            try {
                if (document.querySelector('.typeeditor') && document.querySelector('.typeeditor').querySelector('.component')) {
                    // Checks if the editor has already been scanned since it opened

                    if (!type) {
                        editType = $(document.querySelector('.typeeditor').querySelector('.component')).data('component');
                        type = editType.model.object;

                        addSearchOnEditor();
                    }

                    // check if the first field has already been modified to display the badges
                    if (document.querySelector('.typeeditor') && document.querySelector('.typeeditor').querySelector('.accordion-pane') &&
                        document.querySelector('.typeeditor').querySelector('.accordion-pane').querySelector('.t-columneditor-column') &&
                        !document.querySelector('.typeeditor').querySelector('.accordion-pane').querySelector('.t-columneditor-column').listed) {
                        document.querySelector('.typeeditor').querySelector('.accordion-pane').querySelector('.t-columneditor-column').listed = true;
                        {
                            //debugger;
                            addBadgesOnFields();
                            updateUIFromSearch();
                        }

                    }
                }
                else {
                    type = null;
                    exFinder.invalidate();

                }


            } catch (err) {
                console.log('FieldsInscpector error : ' + String(err.message));

            }
        },
        startHook: function () {
            if (myInterval) this.stopHook();
            myInterval = setInterval(this.hook, 200);

        },
        stopHook: function () {
            clearInterval(myInterval);
            myInterval = null;
        }
    }

}();

exFieldsEditor.startHook();