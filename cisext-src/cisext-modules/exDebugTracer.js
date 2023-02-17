var exDebugTracerVersion = '1.00 beta';

/*

Ver 1.0.0 beta du 21 décembre 2022

creation : 

*/

window.exDebugTracer = (function () {

    var container = document.createElement('div');
    var popup = window.exDrageablePopup;
    var body = null;
    var btnClear = null;

    popup.addTab('Debug Tracer', container);

    return {
        version: exDebugTracerVersion,
        init : function () {

            container.innerHTML = `
            <div class='exDebug'>

            <div class='exDebug-header exPopup-header'>

                <div class='exDebug-header-tab exPopup-header exPopup-container-tab-header'>
                    <div class='exPopup-simpleTabSelect'>
                        <div class='exDebug-header-emptySpace exPopup-tab'></div>
                    </div>
                </div>
                <div class='exDebug-header-tab exPopup-header exPopup-container-tab-button'>
                    <div class='exPopup-simpleTabSelect'>
                        <div id='exDebugBtnClear' class='exPopup-container-tab hud-menu-button i-24-24 i-light-grey i-setting-trash'>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class='exDebug-body'>
            <div id='scrollBody'>
            </div>
            </div>
        </div>
`;


            body = container.querySelector('#scrollBody');
            btnClear = container.querySelector('#exDebugBtnClear');
            btnClear.onclick = this.clearTrace;

            console.logOld = console.log;
            console.log = function () {
                try {
                var log = (arguments && arguments.length == 1 && arguments[0].startsWith && arguments[0].startsWith('NXDEBUG: '))?arguments[0]:null
                if (log)  {
  
                    exDebugTracer.addTrace(log.match(/[^NXDEBUG: ].*/));
                }
            }
            catch (err)
            {
                console.logOld(err);
            }
                console.logOld(arguments); 
            }
        },
        addTrace : function ( text ) {
            body.insertAdjacentHTML( 'beforeend', `<div class='exDebug-line'>${text}</div>` );
            
            var el = body.children[body.children.length-1];
            //container.scrollTo(0,el.clientX)
            el.scrollIntoView(false)
        },
        clearTrace: function () {

            while (body.children[0]) 
                body.children[0].remove();
        }
    }    
})();

exDebugTracer.init();