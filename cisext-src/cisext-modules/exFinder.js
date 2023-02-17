var exFinderVersion = '1.0.5 beta';

/*
V1.01 du 19 septembre 2022
- add function findError to retrieve all code errors


V1.0.2 du 2 october 2022
- optimization of the list of field dependencies

V1.0.3 du 11 october 2022
- add reaload and invalidate functions.

V1.0.4 du 12 octobre 2022 
- add typeOfLink to the elements of lstFunctions. It is used by editButton of FieldsInspector to decide which type of window is opened.

V1.0.5 du 15 octobre 2022 
- improve : the where expression of the select function was not scanned by the search engine. 
            The where expression is now taken into account in the BuildDependencies function.
*/

var strStyles = `
.ex-finder-line {
    display: flex;
    width: 100%;
    border-bottom: 1px solid lightgray;
}`;

var style = document.getElementById('exCoredMirrorStyle');
if (!style)
    style = document.createElement('style');
document.head.appendChild(style);
style.innerText = strStyles;


exFinder = (function () {
    const expsName = ["onClick", "beforeUpdate", "afterUpdate", "visibility", "canWrite", "canRead", "beforeShow", "afterHide", "referenceFormat"];

    var lstFunctions = null;

    ui.on("saveSchema", onSaveSchema, this);

    function onSaveSchema(e) {
        lstFunctions = null;
    }
    function getExpressions(obj, root) {

        var config = null;
        var lst = [];
        try {
            if (obj.fn) {
                if (!obj.exp) obj.exp = queries.parseSystem(database.schema, obj.type, obj.fn, null);
                lst.push({ typeOfLink: obj.fields ? 0 : 1, level: 0, root: root+'.'+locale.function, obj: obj, name: "fn", exp: obj.exp, caption: obj.exp.toHumanString('', 0) });
            }

            expsName.forEach(n => {
                if (obj[n] && obj[n].length && !obj[n + "Exp"]) {

                    obj[n + "Exp"] = queries.parseSystem(database.schema, obj.type, obj[n], null);
                    if (exp)
                        obj.onClickExp = exp;
                }
            })

            for (var key in Object.keys(obj)) {
                var name = Object.keys(obj)[key].match(RegExp('.*(?=Exp\\b)'));
                if (name && name[0].length) {

                    var exp = obj[name[0] + "Exp"];
                    var caption = obj[name[0]];

                    var level = (['onClick', 'afterUpdate', 'afterCreate'].includes(name[0])) ? 0 : 1;
                    lst.push({ typeOfLink: obj.fields ? 0 : 1, level: level, root: root + '.' + name, obj: obj, name: name[0], exp: exp, caption: exp.toHumanString('', 0) });
                }

            }

            if (obj.viewConfig)
                config = obj.viewConfig;
            if (obj.config)
                config = obj.config;

            if (config)
                var type = database.schema.types[config.type || config.refType.id];

            if (config && config.cols) {
                config.cols.forEach(c => {

                    var exp = queries.parseSystem(database.schema, type, c.expression, null);
                    //if (exp.hasErrors()) debugger;
                    var name = c.caption ? c.caption : exp.caption;// exp.toHumanString('', 0);
                    lst.push({ typeOfLink: obj.viewConfig ? 2 : 4, level: 2, root: root + '.col.' + name, obj: obj, name: name, exp: exp, caption: exp.toHumanString('', 0) });

                    if (c.conditionalStyling) {

                        c.conditionalStyling.forEach(cs => {
                            if (cs.operand == 'f(x)') {

                                var csExp = queries.parseSystem(database.schema, type, cs.value, null)

                                lst.push({ typeOfLink: obj.viewConfig ? 3 : 4, level: 2, root: root + '.col.' + name + '.conditionalStyling.' + csExp.caption, obj: obj, name: name + ".conditionalStyling", exp: csExp, caption: csExp.toHumanString('', 0) });
                            }
                        })
                    }
                })
            }
        }
        catch (err) {
            console.log("NINEXT getExpressions error : " + err.message)
        }
        return lst;
    }
    function getFindElements() {
        if (lstFunctions == null) {
       
            lstFunctions = [];
            for (var t in database.schema.types) {
                var type = database.schema.types[t];

                var lstExpType = getExpressions(type, 'tables.' + type.caption);
                lstExpType && lstExpType.forEach(e => {

                    var fn = { typeOfLink: e.typeOfLink, level: e.level, root: e.root, obj: e.obj, table: type.caption, tableId: type.id, field: '', fieldId: '', caption: e.exp.toHumanString('', 0), name: e.name, exp: e.exp };
                    lstFunctions.push(fn);
                });


                type.sorted.forEach(field => {
                    var lstExpType = getExpressions(field, 'tables.' + type.caption + '.' + field.caption);
                    lstExpType && lstExpType.forEach(e => {
                        var fn = {
                            typeOfLink: e.typeOfLink, level: e.level, root: e.root, obj: e.obj, table: type.caption, tableId: type.id,
                            field: field.caption, fieldId: field.id, caption: e.exp.toHumanString('', 0),
                            name: e.name, exp: e.exp, fieldObj: e.obj.fn ? e.obj : null
                        };
                        lstFunctions.push(fn);
                    });
                });
            }

            Object.values(database.views).forEach(view => {

                var type = database.schema.types[view.type];

                if (type && view.config && view.config.cols) {
                    var lstExpType = getExpressions(view, 'views.' + type.caption + '.' + view.caption);
                    lstExpType && lstExpType.forEach(e => {
                        var fn = { typeOfLink: e.typeOfLink, level: e.level, root: e.root, obj: e.obj, table: type.caption, tableId: type.id, field: '', fieldId: '', caption: e.exp.toHumanString('', 0), name: e.name, exp: e.exp };
                        lstFunctions.push(fn);
                    });
                }

            })


            function BuildDependencies(lstDependencies, exp) {
                var find = false;

                if (exp.field && exp.field.type) {
                    if (!lstDependencies[exp.field.type.id]) {
                        lstDependencies.push(exp.field.type.id);
                        lstDependencies[exp.field.type.id] = []
                    }
                    if (!lstDependencies[exp.field.type.id][exp.field.id])
                        lstDependencies[exp.field.type.id].push(exp.field.id)
                }
                for (var key in Object.keys(exp)) {
                    var name = Object.keys(exp)[key].match(RegExp('^(exp\\w+)|^(where)'));
                    e = exp[name && name[0]];
                    if (e && typeof e == 'object') {
                        if (e.forEach)
                            e.forEach(f => {
                                find |= BuildDependencies(lstDependencies, f)
                            })
                        else if (e.resolve)
                            find |= BuildDependencies(lstDependencies, e)
                        else {

                            find = null;
                        }
                    }
                }

            }

            lstFunctions.forEach(e => {
                e.lstDependencies = []
                BuildDependencies(e.lstDependencies, e.exp);
                console.log(e.lstDependencies)
            })
        }

        return lstFunctions;

    }

    function findInList(elements, value, type) {
        var lst = [];
        var table = database.schema.findType(value.field.tableName);
        var field = table.getField(value.field.fieldName);
        elements && elements.forEach(element => {
            var find = false;

            switch (type) {
                case 'text': find = (element.caption.toUpperCase().indexOf(value.text.toUpperCase()) >= 0); break;
                case 'field': {

                    find = table && field && element.lstDependencies[table.id] && element.lstDependencies[table.id].indexOf(field.id) >= 0;
                }
            }
            if (find) {
                var e = Object.assign(element);
                lst.push(element);
            }
        })
        return lst || [];
    }



    return {
        version: exFinderVersion,
        findErrors: function () {
            var lst = getFindElements();
            var lstError = [];
            lst.forEach(e => {
                if (e.exp.hasErrors())
                    lstError.push(e);
            })
            return lstError;
            //exFinder.findErrors().forEach( e => console.log(e.root, e.table+'.'+e.field ));
        },
        find: function (value, typeOfValue) {
            var lst = getFindElements();
            return findInList(lst, value, typeOfValue);
        },
        reload: function () {
            invalidate();
            getFindElements();
        },
        invalidate: function () {
            lstFunctions = null;
        },
        hmltFormat: function (lst, key) {
            var t = '';
            var f = '';
            function bolding(text, key) {
                var bt = '';
                var p = -1;
                while (p = text.toUpperCase().indexOf(key.toUpperCase()), p >= 0) {
                    bt += `${text.substr(0, p)}<span style='color:blue'><b>${text.substr(p, key.length)}</b></span>`;
                    text = text.substr(p + key.length);
                }
                return bt + text;
            }
            var typeClassName = '';
            var fieldClassName = '';

            lst.forEach((e) => {
                if (e.obj) {
                    if (e.obj.field) fieldClassName += 'i-32-24 i-field-' + e.obj.field.base;
                    if (e.obj.type)
                        typeClassName += 'nav-item-icon ' + (e.obj.type.icon ? 'ic ic-' + e.obj.type.icon : 'i-32-24 ic i-setting-table');

                }
                t += `<div class='ex-finder-line'><div class='${typeClassName}'></div><div class=''>${e.table}.</div><div class='${fieldClassName}'>${e.field} : ${e.name}</div><div style='color:grey; padding-left:10px'>${bolding(e.caption, keyword)}</div></div>`;
            })
            return t;
        }
    }

})();
