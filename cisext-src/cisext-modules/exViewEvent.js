var exViewEventVersion = '1.09 beta';

/* 
V1.01 beta :
bug fix : check that the initialization is done on a view field

V1.02
update : add onload call when visiblity function is fired to update view field;

V1.03
update : add onclick event with event parameter;

V1.04 : 09/05/2022
bugfix : let default click run when one group has been clicked

V1.05 : 12/05/2022
update : if onclick return true, the default event is fire. In this case, if line is newly selected, the default popup apear 
update : add targetColumnCaption on event parameter of onclick event

V1.06 : 02/08/2022
add : onselected event on canRead Trigger of table

V1.07 : 02/08/2022
update : remove parametres of onselect event of canRead trigger of table

V1.08 : 22/08/2022
bugfix : Somme times the hoock does'nt work. It was because myTableinterval it clear fireeach time at the first call. 
Now it clear only after it found currentview.table.

V1.09 : 11 septembre 2022
update: if the onclick or onselect event returns void or false then the default Ninox event is called. 
This opens a normal popup window when the user clicks on it with standard behaviors to select the next or previous record with the arrow key.
*/

window.exViewEvent = (function () {
    var myInterval = setInterval(() => {
        var view = document.getElementsByClassName("component editor editor-list editor-4col")[0];
        if (view) {
            document.getElementsByClassName("component editor editor-list editor-4col").forEach(cpn => {
                var Do = $(cpn).data().component;
                if (Do && Do.field.base == "rev") window.nxList = Do;

                if (Do && Do.field && Do.field.base == "view" && !Object.getPrototypeOf(Do).exOldClick) {

                    Object.getPrototypeOf(Do).exOldClick = Object.getPrototypeOf(Do).click;
                    Object.getPrototypeOf(Do).click = function (e) {

                        var fireOld = true;
                        if (this.query) {

                            var numCol = null;
                            var col = document.elementsFromPoint(e.clientX, e.clientY).find(element => element.classList.contains("t-cell"))
                            if (col) {
                                numCol = Array.from(col.parentElement.children).indexOf(col);
                                if (numCol != null) {


                                    var o = $(col.parentElement);
                                    if (o.length) {
                                        var a = parseInt(o.attr("data-ridx")) + this.ridxTop,
                                            n = this.query.rows[a];
                                        if (n) {
                                            if (this.query.groups[n]) {
                                                // let défault click run;
                                            }
                                            else {
                                                if (this.field && this.field.fn) {
                                                    var fn = exUtilsNx.extractNxFonctionInScript("onclick", this.field.fn, this.field);
                                                    if (fn) {
                                                        var params = {
                                                            previousID: this.query.nidSelected,
                                                            targetID: n,
                                                            targetLineNum: a,
                                                            targetColumnNum: numCol,
                                                            targetColumnValue: col.innerText,
                                                            targetColumnCaption: this.query.cols[numCol].caption ? this.query.cols[numCol].caption : this.query.cols[numCol].field.caption
                                                        }

                                                        fn += "; onclick(" + JSON.stringify(params) + ")"

                                                        fireOld = exUtilsNx.fireEval(fn, this.query.nid, (err, res) => {

                                                            if (!res) {
                                                                // manage the click on an already selected line
                                                                if (e.target == this.$selectionEl1) {
                                                                    e.target = col;
                                                                }
                                                                // call Ninox click function
                                                                if (this.query.nidSelected == n)
                                                                    this.query.nidSelected = null;
                                                                this.exOldClick(e);
                                                            }
                                                            else {
                                                                this.query.nidSelected = n;
                                                                this.updateRows();
                                                            }
                                                        }).result;
                                                        // debugger;
                                                        // console.log('fireOld', fireOld);
                                                        // if (!fireOld) {
                                                        //     this.query.nidSelected = n;
                                                        //     this.updateRows();

                                                    }
                                                }

                                            }

                                        }
                                    }
                                }
                            }
                        }

                        if (fireOld) {
                            console.log('NINEXT default click');
                            this.exOldClick(e);
                        }
                        console.log("NINEXT view.onclick:", e);

                    }

                    Object.getPrototypeOf(Do).exOldSelect = Object.getPrototypeOf(Do).select;
                    Object.getPrototypeOf(Do).select = function (nodeId, t) {
                        var fireOld = true;
                        if (this.query && nodeId !== this.query.nidSelected) {


                            if (this.field && this.field.fn) {
                                var fn = exUtilsNx.extractNxFonctionInScript("onselect", this.field.fn, this.field);
                                if (fn) {


                                    fn += '; onselect("' + nodeId + '")';

                                    var test = exUtilsNx.fireEval(fn, this.query.nid, (err, res) => {
                                        if (!res) {
                                            //this.query.nidSelected = null;
                                            this.exOldSelect(nodeId, t);
                                        }
                                        else {
                                            this.query.nidSelected = nodeId;
                                            this.updateRows();
                                        }
                                    });

                                    fireOld = false;
                                }
                            }
                        }
                        if (fireOld) {
                            console.log('NINEXT default select');
                            this.exOldSelect(nodeId, t);

                        }
                    }

                    Object.getPrototypeOf(Do).viewKeyDown = function (e) {

                        switch (e.which) {
                            case 27:
                                this.select(-1, null),
                                    e.preventDefault();
                                break;
                            case 38:
                                this.prev(),
                                    e.preventDefault();
                                break;
                            case 40:
                                this.next(),
                                    e.preventDefault()
                        }
                    }

                    Object.getPrototypeOf(Do).exOldupdateVisibility = Object.getPrototypeOf(Do).updateVisibility;
                    Object.getPrototypeOf(Do).updateVisibility = function (e) {

                        if (this.field.visibility)
                            var fn = exUtilsNx.extractNxFonctionInScript("onload", this.field.visibility, this.field);
                        if (fn) {

                            fn += '; onload()';
                            var id = exUtilsNx.fireEval(fn, this.query.nid, (err, res) => {
                                if (!err && res) {
                                    this.query.nidSelected = res;
                                    this.updateRows();
                                }
                            });
                        }

                        this.exOldupdateVisibility(e);
                    }

                    clearInterval(myInterval);
                    //alert('hook en place');


                    var lst = cpn.getElementsByClassName("list")[0];
                    if (lst) {
                        $(lst).off("click");
                        $(lst).touch($.proxy(Do.click, Do));
                        //$(lst).addEventListener("keydown", $.proxy(Do.keydown, Do), !1)
                    }
                    // cpn.addEventListener( "keydown", viewKeyDown, false);
                    // this.keydown = $.proxy(this.keydown, this),
                    // this.$input.addEventListener("keydown", $.proxy(Object.getPrototypeOf(Do).keydown, tObject.getPrototypeOf(Do)), !1)


                }
            });
        }
    }, 1000);


    var myTableInterval = setInterval(() => {
        var table = ui.currentView ? ui.currentView.table : null;
        if (table) {


            Object.getPrototypeOf(table).exUpdateSelection = Object.getPrototypeOf(table).updateSelection;
            Object.getPrototypeOf(table).updateSelection = function () {
                this.exUpdateSelection();

                var nodeID = this.getSelectedNid();
                if (nodeID) {
                    var fn = exUtilsNx.extractNxFonctionInScript("onselected", this.type.canRead, Object.values(this.type.fields)[0])
                    if (fn) {
                        debugger;
                        fn += '; onselected()';
                        exUtilsNx.fireEval(fn, nodeID);
                        console.log("NINEXT : ", fn);

                    }
                }
            }
            clearInterval(myTableInterval);
            //alert('hook en place');
        }




    }, 1000);

    return {
        version: exViewEventVersion,
    }
})()