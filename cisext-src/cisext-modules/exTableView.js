const htmlfilter = `
    <div id="exColumnFilter" class="ninext-fliterbox t-head-cell" >
        <div class="i-24-16 i-light-grey i-setting-filter">
        </div>
        <span id="exColumnFilter-title">column : sreach text</span>
        <div id="exColumnFilter-close" class="i-24-16 i-light-grey i-close"></div>
    </div>
`;

var exTableViewVersion = '1.0.1 beta';
/* 
ver 1.0.0 du 5 décembre 2022
- add : add filter box on table view
- fixed : seach value cleared when filter is set.

ver 1.0.1 du 6 décembre 2022
- fixed : when first displayed, the filters box does not appear.
*/

window.exTableView = (function () {


    // fix bug : shearch value is cleared after filter is modified.
    util.oldGetPersistentView = util.getPersistentView;
    util.getPersistentView = function (view) {
        var r = this.oldGetPersistentView(view);
        r.searchString = view.searchString;
        return r;
    };


    // place hoo function on showView to display filter box
    // Object.getPrototypeOf(ui.views.table).old = Object.getPrototypeOf(ui.views.table).updateSwitch;
    // Object.getPrototypeOf(ui.views.table).updateSwitch = function () {

    //         // call orginial function
    //         this.old();
    //         alert('updateSwitch');

    // }    

    window.addEventListener("resize", (event) => {
        ui.$menu[0].style.right = (parseInt(window.getComputedStyle(ui.$menuRight[0]).width) + parseInt(window.getComputedStyle(ui.$menuRight[0]).right)).toString() + "px";
    });

    // place hoo function on showView to display filter box
    Object.getPrototypeOf(ui.views.table).oldShowView = Object.getPrototypeOf(ui.views.table).showView;
    Object.getPrototypeOf(ui.views.table).showView = function () {
        try {
            // remove all previus filter box
            document.querySelectorAll('#exColumnFilter').forEach(e => e.remove());

            // call orginial function
            this.oldShowView();

            const view = this;
            // update menu to avoid overlapping of the navitation buttons by the box filters
  
            ui.$menu[0].style.right = (parseInt(window.getComputedStyle(ui.$menuRight[0]).width) + parseInt(window.getComputedStyle(ui.$menuRight[0]).right)).toString() + "px";
            ui.$menu[0].style.overflow = "hidden";
            ui.$menu[0].style.overflowX = "auto";
  
            ui.views.table.$searchPlaceholder[0].style.height = "30px";
            ui.views.table.$search[0].style.height = "30px";
            ui.views.table.$searchContainer[0].style.alignItems = "center";

            view.table.cols.forEach(c => {

                if (c.filter) {
                    // add filter box
                    var f = document.createElement('div');
                    f.innerHTML = htmlfilter;
                    f = f.children[0];
                    (view.table.$controls ? view.table.$controls : ui.views.table.$controls).append(f);
                    f.colIndex = view.table.cols.indexOf(c);
                    f.onclick = (event) => {
                        
                        view.table.popupColumnMenu(f.colIndex, event)
                    }

                    var value = isNaN(c.filter) ? c.filter : c.expression.returnType.format(Number(c.filter));
                    f.querySelector('#exColumnFilter-title').innerText = (c.caption ? c.caption : c.expression.caption) + " : " + value

                    f.querySelector('#exColumnFilter-close').onclick = (event) => {
                        // remove the filter
                        delete c.filter;
                        // reload the table and save config
                        view.table.reload();
                        view.table.rowsChanged();
                        view.table.saveView();
                        // remove the current filter box
                        event.target.parentElement.remove()

                        // refresh search value
                        view.searchChanged();

                        event.stopPropagation();
                    }

                }
            })

        }
        catch (err) {
            alert(err);
        }

    }


    // refresh current view with new showView function 
    if (ui.views && ui.views.table) {
        ui.views.table.reload();
        ui.views.table.rowsChanged();
        ui.views.table.showView();
    }


    return {
        version: exTableViewVersion
    }
})();