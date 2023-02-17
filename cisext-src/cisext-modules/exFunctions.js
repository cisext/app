var exFunctionsVersion = '1.00 beta';

// Version 1.01
// change the name of the callback function from cb to $callback

const exFunctions = [`function PrintMultipleRecords(id : text, nids : text, report : text)  do 
eval("exEvalJS", {javascript: "reports.openDesigner({ nid: id, nids: nids, reportName: report, printAllAndClose: true })", arguments:{ "id" : id,"nids" : nids,"report" : report}}); 
end;`,
    `function CopyToClipboard(textValue : text)  do 
eval("exEvalJS", {javascript: "navigator.clipboard.writeText(textValue);
alert('This is the text that is now on the clipboard : "'+ textValue+'"');", arguments:{ "textValue" : textValue}}); 
end;`]
window.exFunctions = (function () {



    //setting globalCode getter 
    if (!database.schema.exOldGlobalCodeExp) {

        database.schema.exOldGlobalCodeExp = database.schema.globalCodeExp;
        delete database.schema.globalCodeExp;
        Object.getPrototypeOf(database.schema).__defineGetter__("globalCodeExp",
            function () {
                if (!this.hasOwnProperty("exOldGlobalCode"))
                    this.exOldGlobalCode = null;
                if (this.exOldGlobalCodeExp && this.exOldGlobalCodeExp.getDefinitions) {

                    var defs = this.exOldGlobalCodeExp.getDefinitions();
                    if (!defs['#L#PrintMultipleRecords']) {
                        var r = exFunctions.join('\n');
                        this.exOldGlobalCodeExp = null;
                        this.exOldGlobalCodeExp = queries.parseSystem(this, void 0, r + this.globalCode, {});
                        this.globalScope = this.exOldGlobalCodeExp.getDefinitions();
                    }

                }
                return this.exOldGlobalCodeExp;
            })
        Object.getPrototypeOf(database.schema).__defineSetter__("globalCodeExp",
            function (codeExp) {

                this.exOldGlobalCodeExp = codeExp;
            })


    }
    return {
        version: exFunctionsVersion,
    }


})();



