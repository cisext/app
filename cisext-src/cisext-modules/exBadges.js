var exBadgesVersion = '1.0.7';

//V1.02 du 9 mai 2022
//bug fix :
// minor bug : test if file icon is present before traitement.

//V1.03 du 9 juin 2022
//bug fix :
// correct gestion of comments on Mac App : call it if database.loadComments function exist not if schemas.envConfig.userEnvName != 'mac'. 

//V1.04 du 24 aout 2022
// add onUpdate call to custom tabs.

//V1.05 du 24 aout 2022
// ajout de formBackGroundColor dans la structure tabValues pour pouvoir le modifier indépendamment de backgroundColor de l'onglet.

//V1.06 du 19 septembre 2022
// bug fix : the initialization was made according to exModule.myDiv or if the initialization window disappeared myDiv disappeared too. 
//             The initialization is now done via ui.getEditor()
// add : selected.color and selected.backgroundColor

//V1.0.6 du 20 septembre 2022
// bug fix :  if selected.color and/or selected.backgroundColor were not initialized, an error could appear and disturb Ninox behaviors: 
//              the bottom edit bar disappears, the permision is disturbed...


//create global object to manage exBadges.
if (!window.exBadges) window.exBadges = { version: exBadgesVersion };


// color of selection
var filesColor = '#4970ff';
var oldCommentColor = '#999999';
var newCommentColor = 'red';
// Threshold of new or old comment in ms. For 1 day = 1000ms * 60s * 60mn * 24h = 86400000ms
var oldCommentThreshold = 1000 * 60 * 60 * 24;

function updateTab() {
    this.oldUpdateTab();
    try {

        if (this.field && this.field.visibility) {
            var fn = exUtilsNx.extractNxFonctionInScript("onUpdate", this.field.visibility, this.field);
            if (fn) {

                //            fn += `; onUpdate({ caption: "${this.field.caption}", tabColor : "${this.field.bgColor ? this.field.bgColor : ""}"})`;
                fn += `; onUpdate(${this.tabValues ? JSON.stringify(this.tabValues) : '{}'})`;
                console.log('NINEXT call onUpdate : ', fn);
                var res = exUtilsNx.fireEval(fn, this.container.container.nid);

                this.tabValues = res.result;


                /*
                tableValue = {
                    caption :,
                    tootip :,
                    color :,
                    backgroundColor :,
                    selected : {
                        color :,
                        backgroundColor :
                    },
                    badge : {
                        caption :,
                        color :,
                        backgroundColor :,
                    }
                }
                */
            }
        }

        console.log('NINEXT tab', this.tabValues);

        if (this.tabValues && this.tabValues.caption)
            this.textContainer.text(this.tabValues.caption);

        if (this.tabValues) {


            // in case of tab is selected
            if (this.elTab[0].classList.contains("selected")) {
                // clear the color and bk color of tab 
                this.elTab[0].style.backgroundColor = this.tabValues.selected && this.tabValues.selected.backgroundColor ? this.tabValues.selected.backgroundColor : null;
                this.elTab[0].style.color = this.tabValues.selected && this.tabValues.selected.color ? this.tabValues.selected.color : null;

                //put the bk color of form
                this.container.container.el[0].style.backgroundColor = this.tabValues.formBackgroundColor ? this.tabValues.formBackgroundColor : (this.field.bgColor ? this.field.bgColor : null);

            }
            else {
                // else, put the color and bk color to tab.
                this.elTab[0].style.color = this.tabValues.color ? this.tabValues.color : null;
                this.elTab[0].style.backgroundColor = this.tabValues.backgroundColor ? this.tabValues.backgroundColor : null;
            }
        }

        if (this.tabValues && this.tabValues.tooltip)
            this.elTab[0].title = this.tabValues.tooltip;

        //this.badge = elTab.find('span')[0];
        if (!this.badge) {
            this.badge = $(document.createElement("span"));
            this.elTab.append(this.badge);
        }
        if (this.tabValues && this.tabValues.badge) {



            //set the badge
            this.badge.addClass('exCommunBadge')
            this.badge.text(this.tabValues.badge.caption ? this.tabValues.badge.caption : "")
            this.badge.css("visibility", (this.tabValues.badge.caption && this.tabValues.badge.caption.length > 0) ? 'visible' : 'hidden');
            this.badge.css("color", this.tabValues.badge.color ? this.tabValues.badge.color : "white");
            this.badge.css("backgroundColor", this.tabValues.badge.backgroundColor ? this.tabValues.badge.backgroundColor : "red");
        }
        else {
            if (this.badge) this.badge.css('visibility', 'hidden')
        }

    }
    catch (err) {
        console.log('NINEXT badges updateTab error : ', err)
    }
}
function updateVisibility() {

    this.oldUpdateVisibility();

    this.updateTab();
}

//event function called when tab changeed or popup opened
function selectTab(tabName) {
    //call the original event fonction selectTab
    if (this.oldSelectTab) this.oldSelectTab(tabName);


    try {
        //recordver the current exBadges.editor with links to html components
        if (this.container) {
            console.log('NINEXT badges : files load')
            //load files of current record (is async function)
            database.loadFiles(this.container.nid, (e, i) => {
                // e = error text
                // i = files array of id record this._id

                console.log('NINEXT badges : files refresh')

                // recover the attached files icon on current exBadges.editor
                var files = this.files ? this.files.elTab[0] : null;
                if (files) {
                    //recover or create the badge
                    var badge = files.getElementsByTagName('span')[0];
                    if (!badge) {
                        badge = document.createElement('span');
                        files.appendChild(badge);
                    }

                    //reading file list en exclude files connected to fields
                    var n = database.typeOf(this.container.nid);
                    var r = database.loadNodeSync(this.container.nid);
                    if (n && r) {
                        var s = {},
                            l = n.fields;
                        for (var c in l) {
                            if (l.hasOwnProperty(c))
                                if ('file' === l[c].base) {
                                    var d = r[c];
                                    d && (s[d] = !0)
                                }
                        }
                        let f = []
                        for (var u = 0; u < i.length; u++)
                            s[(d = i[u]).name] || f.push(d);

                        //number attached files
                        var cnt = f.length;

                        //set the badge
                        badge.className = 'exCommunBadge'
                        badge.innerText = cnt.toString();
                        badge.style.visibility = (cnt > 0) ? 'visible' : 'hidden';
                        badge.style.backgroundColor = filesColor;
                    }
                };
            });

            // load the comment only for the cloud database when loadComments function exist.
            if (database.loadComments) {
                console.log('NINEXT badges : comments load')

                //load files of current record (is async function)
                database.loadComments(this.container.nid, (e, i) => {
                    // e = error text
                    // i = comments array of id record this._id

                    console.log('NINEXT badges : comments refresh')

                    // recover the comment icon
                    var comments = this.comments ? this.comments.elTab[0] : null;
                    if (comments) {

                        //recover or create the badge
                        var badge = comments.getElementsByTagName('span')[0];
                        if (!badge) {
                            badge = document.createElement('span');
                            comments.appendChild(badge);

                        }

                        //get durrent time to compare with comment date
                        var ms = Date.now();

                        //count the number of new and old comments 
                        var cntNew = i.reduce((total, el) => {
                            if (ms - el[0] < oldCommentThreshold) total += 1;
                            return total;
                        }, 0);
                        var cntAll = i.length;

                        //set the badge with different color to indicate if there is new comments
                        badge.className = 'exCommunBadge';
                        badge.innerText = cntNew ? cntNew.toString() : cntAll.toString();
                        badge.style.visibility = (cntAll + cntNew > 0) ? 'visible' : 'hidden';
                        badge.style.backgroundColor = (cntNew > 0) ? newCommentColor : oldCommentColor;

                    };
                })
            }
        }

    } catch (err) {
        console.log('NINEXT badges error : ' + String(err.message));
    }

}

// On first call, put this selectTab in place to Ninox function and save the oldest
function setHook() {
    try {
        //exBadges.editor = ui.getCurrentEditor();
        if (!exBadges.editor) {
            if (ui.getCurrentEditor() && ui.getCurrentEditor().container && ui.getCurrentEditor().container.editor) {
                exBadges.editor = ui.getCurrentEditor().container.editor;
            }

        }



        if (exBadges.editor && exBadges.editor.container && !Object.getPrototypeOf(exBadges.editor).oldSelectTab) {
            if (!Object.getPrototypeOf(exBadges.editor).oldSelectTab) {
                Object.getPrototypeOf(exBadges.editor).oldSelectTab = Object.getPrototypeOf(exBadges.editor).selectTab;
                Object.getPrototypeOf(exBadges.editor).selectTab = selectTab;
                console.log('NINEXT badges initalized');

                //call onUpdate event function to customize Tab style and badge.
                var tab = exBadges.editor.tabs[0];
                // set the hook when tab is field's tab and system's tab

                if (tab && tab.field && tab.elTab)
                    if (!Object.getPrototypeOf(tab).oldUpdateVisibility) {

                        Object.getPrototypeOf(tab).oldUpdateVisibility = Object.getPrototypeOf(tab).updateVisibility;
                        Object.getPrototypeOf(tab).updateVisibility = updateVisibility;

                        Object.getPrototypeOf(tab).oldUpdateTab = Object.getPrototypeOf(tab).updateTab;
                        Object.getPrototypeOf(tab).updateTab = updateTab;
                        console.log('NINEXT Custom tabs initalized')

                        tab.container.container.updateStructure();
                    }

                exBadges.initalized = true;
                exBadges.editor.selectTab(exBadges.editor.currentTab.id);

                if (ui && ui.getCurrentEditor()) {

                    database.resetSchema();
                    //ui.getCurrentEditor().container.updateStructure();
                    //ui.getCurrentEditor().currentTab.updateTab();
                }
            }



        }


    } catch (err) {
        console.log('badges error : ' + String(err.message));
    }
    if (!exBadges.initalized)
        setTimeout(setHook, 100);
}

setHook();
