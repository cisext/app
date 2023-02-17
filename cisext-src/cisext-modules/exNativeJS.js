var exNativeJSVersion = '1.0.4 beta';

/* 
Version 1.00 du septembre 2022
 creation of Native JS with :
 - Ninox variables direct acdes,
 - Return possiblity to défine return type :
    text, number, date, datetime, time, timeinterval, appointment, boolean,
    html, color, icon, email, phone, location, file, user, any,
    nid([talbe name]), rid([table name]).name
    
Version 1.0.1 du 25 septembre 2022
- bug fixe : getHumanNid does not call the callback function, which does not execute the rest of the code, if nid = null. 

Versoin 1.0.2 du 26 septembre 2022
- bug fixe : GetHumanNode return error if node parameter is null or not contain _id value. 
- add : retrieve the parameters when the code is in a global function (ApplyLambda exprs) 

Versoin 1.0.3 du 14 octobre 2022
- bug fixe : In the compilation hook, the addition of LambdaApply parameters in the variable list has been removed. 
            This caused an error when calling the NativeJS code because it tried to pass variables (the parameters of 
            the global function) that were out of its scope.. 

Versoin 1.0.4 du 22 novembre 2022
- bug fixe : the date format was not supported as a return type.  
- bug fixe : in cascading function calls, parameters were passed out of scope, which caused runtime errors.
            */

window.exNativeJS = (function () {



    // code to add JS code inside of Ninox script with #{}# notation

    // search returnType in raw code
    queries.JS.prototype.__defineGetter__('codeHead', function () {

        try {
            const matchOptions = /^(:(\w+)\(([^)]+)\))|^:(\w+)/
            var c = this.code;
            var ch = c.match(matchOptions);
            ch = ch ? ch : ['', '', null, null, 'string'];
            if (ch && ch[2] && ch[3])
                ch[2] = ch[2].replace('nid', 'Nid').replace('rid', 'Rid');
            var head = { head: ch[0], type: ch[2] || ch[4], table: ch[3], beginOfCode: ch[0].length };

            while (ch) {
                c = c.substr(ch[0].length);
                var ch = c.match(matchOptions);
                if (ch && (ch[2] || ch[4])) {
                    head['is' + (ch[2] || ch[4])] = true;
                    head.beginOfCode += ch[0].length;
                }
            }
            return head
        }
        catch (err) {
            throw new Error('JavaScript type error : ' + err);
        }
    })

    // return JS part of raw code
    queries.JS.prototype.__defineGetter__('codeBody', function () {
        var ch = this.codeHead;
        return ch && ch.head ? this.code.substr(ch.beginOfCode) : this.code;
    })

    // retriev return type 
    queries.JS.prototype.__defineGetter__('returnType', function () {
        return this.exReturnType ? this.exReturnType : schemas.tstring;
    });
    queries.JS.prototype.__defineSetter__('returnType', function (f) {
        delete this.returnType
        var ret = schemas.tstring;
        try {
            var ch = this.codeHead
            if (ch && ch.type) {
                if (ch && ch.type == 'any') {
                    if (ch.table == 'array')
                        this.isMulti = true;
                    ret = schemas['t' + ch.type];
                }
                else
                    if (ch.table && database.schema.findType(ch.table)) {
                        ret = new schemas['T' + ch.type](database.schema.findType(ch.table));
                        this.isMulti = true;
                    }
                    else if (ch && ch.type == 'date') {
                        // debugger;
                        ret = database.schema.getGlobalType("date");
                    }
                    else
                        ret = schemas['t' + ch.type];
            }
        }
        catch (err) {
            throw new Error('JavaScript return type error : ' + err);
        }
        this.exReturnType = ret;
    });

    // retriev tag depend of return type
    queries.JS.prototype.__defineGetter__('flags', function () {
        var r = this.returnType;
        return 0xFE5 | ((this.isMulti) ? 8 : 0) & ~((this.codeHead.isasync || this.codeHead.iscallback) ? 16 : 0)
    });
    queries.JS.prototype.__defineSetter__('flags', function (f) { delete this.flags });

    // Ninox pre-compilation
    queries.JS.prototype._compileSyncJS = function (e) {
        var vs = [], vn = [], vc = []; vnode = [];
        function addVar(v) {
            vn.push(`'${v.caption}'`);
            switch (v.returnType.base) {
                case 'nid':
                    vc.push({
                        begin: `return exNativeJS.getHumanNid(s${v.symbol}, (err, node) => {var ${v.caption}=err?err:node;\n`,
                        end: `})`
                    });
                    vs.push(`${v.caption}`);
                    break;
                case 'node':
                    vc.push({ begin: `var ${v.caption}=exNativeJS.getHumanNode(s${v.symbol});\n`, end: '' });
                    vs.push(`${v.caption}`);
                    break;
                default:
                    vs.push('s' + v.symbol);
                    break;
            }
        }

        function addFunction(f) {
            vn.push(`'${f.id}'`);
            vs.push(`(function () {${f.exSymbol}(...arguments,() => {} )})`);
        }

        e.exDefinedVariables && e.exDefinedVariables.forEach((v) => addVar(v));
        e.exLambda && e.exLambda.forEach((l) => { addFunction(l) });

        var c = '`' + (this.codeBody).replaceAll('`', '\\`').replaceAll('${', '\\${') + '`';
        if (this.codeHead.isasync || this.codeHead.iscallback) {
            vn.push("'callback'");
            vs.push("cb");
        }

        var r = `try {${vnode.join(';')};
    var $code = ${c};
    var exRet = ( Function(...[${vn}],$code)(...[${vs}]) ); 
    return (exRet && exRet.exProxy)?exRet.toString():exRet} 
catch(e) {
        console.error('JS error : ',e,$code); 
        ${this.codeHead.isasync || this.codeHead.iscallback ? "cb('JavaScript code error : '+e)" : ""}
        return ('JavaScript code error : '+e);
}`

        vc.forEach(f => {
            r = `${f.begin}${r}${f.end}`;
        })
        // debugger;
        r = `(function() {${r}})()`;
        console.log('NINEXT exNativeJS', r);

        return r;
    }
    queries.JS.prototype._compileAsyncJS = function (e) {
        if (this.codeHead.isasync || this.codeHead.iscallback)
            return `(function(cb){${this._compileSyncJS(e)}})`
        else
            return `(function(cb){cb( ${this._compileSyncJS(e)} )})`
    }

    // collect all variables from the code and pass them to the JS function
    function initProp(proto, func) {
        var old = 'old' + func;
        if (!proto[old])
            proto[old] = proto[func];
        proto[func] = function (e, t) {
            if (!e.exDefinedVariables) {
                e.exDefinedVariables = [];
                e.exLambda = [];
                e.context = [];
            }
            if (['let', 'var', 'for', 'forfromto', 'forin'].includes(this.base))
                e.exDefinedVariables.push(this.scopeVariable);
            if (['variable'].includes(this.base))
                e.exDefinedVariables.push(this);
            if (this.base == 'apply') {
                // debugger;
            }

            if (this.base == 'lambda') {
                // debugger;
                this.params.forEach(p => e.exDefinedVariables.push(p));
                this.exSymbol = e.requireLambdaAsync(this);
                e.exLambda.push(this);
            }
            if (this.base == 'applylambda' && this.lambda && !this.lambda.exSymbol) {
                e.context.push(e.exDefinedVariables);
                e.exDefinedVariables = [];
                this.lambda.params.forEach(p => e.exDefinedVariables.push(p));
                // debugger;
            }

            
            var r = this[old](e, t);

            if (this.base == 'applylambda' && this.lambda && !this.lambda.exSymbol) {
//                debugger;
                this.lambda.params.forEach(p => e.exDefinedVariables.pop());
                e.exDefinedVariables = e.context.pop();
            }
            if (this.base == 'apply') {
               
            }
            if (this.base == 'lambda') {
                // debugger;
                this.params.forEach(p => e.exDefinedVariables.pop());
            }
            if (['let', 'var', 'for', 'forfromto', 'forin', 'variable'].includes(this.base))
                e.exDefinedVariables.pop();

            return r;
        }
    }
    initProp(queries.Var.prototype, '_compileAsyncJS');
    initProp(queries.Var.prototype, '_compileSyncJS');
    initProp(queries.Let.prototype, '_compileAsyncJS');
    initProp(queries.Let.prototype, '_compileSyncJS');

    initProp(queries.ForEach.prototype, '_compileAsyncJS');
    initProp(queries.ForEach.prototype, '_compileSyncJS');
    initProp(queries.ForFromTo.prototype, '_compileAsyncJS');
    initProp(queries.ForFromTo.prototype, '_compileSyncJS');
    initProp(queries.ForIn.prototype, '_compileAsyncJS');
    initProp(queries.ForIn.prototype, '_compileSyncJS');
    initProp(queries.ScopeVariable.prototype, '_compileAsyncJS');
    initProp(queries.ScopeVariable.prototype, '_compileSyncJS');
    initProp(queries.Lambda.prototype, '_compileAsyncJS');
    initProp(queries.Lambda.prototype, '_compileSyncJS');
    initProp(queries.ApplyLambda.prototype, '_compileAsyncJS');
    initProp(queries.ApplyLambda.prototype, '_compileSyncJS');
    initProp(queries.ApplyFunction.prototype, '_compileAsyncJS');
    initProp(queries.ApplyFunction.prototype, '_compileSyncJS');


    return {
        // return the actuel version 
        version: exNativeJSVersion,
        getHumanNode(node) {
            var field = {};
            var type = (node && node._id) ? database.schema.typeOf(node._id) : null;
            if (type) {
                function pushField(f) { field[f.caption] = node[f.id] }
                pushField(type.field_cd);
                pushField(type.field_cu);
                pushField(type.field_id);
                pushField(type.field_md);
                pushField(type.field_mu);
                Object.entries(type.fields).forEach(f => pushField(f[1]));
                field.ID = node._id;
                field.Id = node._id;
                field.id = node._id;
                return field;
            }
            else return node;
        },
        getHumanNid(nid, callback) {

            if (typeof nid == 'string')
                return database.loadNode(nid, (err, node) => callback(err, this.getHumanNode(node)));
            else if (typeof nid == 'object')
                return callback(null, nid);
            else return callback(null, nid);
        },

    }
})();

window.exPolyVar = function (value, typeID) {
    exPolyVarHandler.type = database.schema.types[typeID];
    return new Proxy(new Object(value), exPolyVarHandler);
}

window.exPolyVarHandler = {
    get typeID() { return this.type && this.type.id },
    type: null,
    get fields() {
        var field = [];
        function pushField(f) { field.push(`'${f.caption}': s${variable.symbol}.${f.id}`) }
        pushField(type.field_cd);
        pushField(type.field_cu);
        pushField(type.field_id);
        pushField(type.field_md);
        pushField(type.field_mu);
        Object.entries(this.type.fields).forEach(f => pushField(f[1]));
        return field;
    },
    exProxy: true,
    get(target, key, receiver) {
        try {

            if (key == '__proto__')
                return $.extend(Object.getPrototypeOf(target), fields);
            if (key == 'prototype' && !target.prototype)
                return target;
            else {
                field = this.type && this.type.getField(key);
                if (this.type && field && typeof field != 'function')
                    return (target instanceof String) ? database.nodes[target][field.id] : target[field.id]
                else
                    if (typeof target[key] == 'function')
                        return (...theArgs) => { return target[key](...theArgs) }
                    else
                        if (Array.isArray(target) && (target.includes(key) || Number.isInteger(Number(key)))) {

                            return new exPolyVar(target[key], this.typeID)
                        }
                        else

                            Reflect.get(Object(target), key, receiver)


            }
        }
        catch (err) {
            console.log('NINEXT Porxy.get : ', err);
        }
    },
    set(target, key, value, receiver) {
        Reflect.set(Object(target), key, value, receiver)
    }
    ,
    ownKeys(target) {
        debugger;
        return Reflect.ownKeys(target);
    },
    has(target, key) {
        debugger;
        return key in target;
    },
    apply(target, thisArg, argumentsList) {
        debugger;
        return target;
    },
    [Symbol.toPrimitive](hint) {
        debugger;
        return Reflect.toString();
    }

};


// IMPORTANT: force Ninox to be updated to take into account the extended functions
if (!database.adminMode) {
    database.resetSchema();

}