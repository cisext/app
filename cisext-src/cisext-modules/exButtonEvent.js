var exButtonEventVersion = '1.00d beta';




window.exButtonEvent = (function () {
    const colors = ['blue', 'red', 'grey'];
    var myInterval = setInterval(() => {
        var button = document.getElementsByClassName("component editor button");
        if (button && button.length > 0) {
            button.forEach(cpn => {
                var Bu = $(cpn).data().component;

                if (Bu && Bu.field && Bu.field.base == "button" && !Object.getPrototypeOf(Bu).exOldButtonUpdateVisibility) {

                    console.log('NINEXT init ButtonEvent', Bu);

                    Object.getPrototypeOf(Bu).exOldButtonUpdateVisibility = Object.getPrototypeOf(Bu).updateVisibility;
                    Object.getPrototypeOf(Bu).updateVisibility = function (e) {

                        this.exOldButtonUpdateVisibility(e);

                        if (this.field.visibility) {
                            var fn = exUtilsNx.extractNxFonctionInScript("onUpdate", this.field.visibility, this.field);
                            if (fn) {
                                fn += `; onUpdate({ caption: "${this.field.caption}", buttonColor : "${this.field.buttonColor}"})`;
                                var buttonValues = exUtilsNx.fireEval(fn, this.container.container.nid).result;
                                const colors = ['blue', 'red', 'grey']
                     

                                    console.log('NINEXT bouton', buttonValues);
                                    if (buttonValues && buttonValues.caption)
                                        this.button.text(buttonValues.caption);

                                    if (buttonValues && buttonValues.buttonColor && colors.includes(buttonValues.buttonColor)) {
                                        colors.forEach(c => this.button.removeClass(c));
                                        this.button.addClass(buttonValues.buttonColor);
                                    }
                                    if (buttonValues && buttonValues.title)
                                        this.el[0].title = buttonValues.title;

                                    var badge = this.button.find('span')[0];
                                    if (!badge) {
                                        badge = $(document.createElement("span"));
                                        this.button.append(badge);
                                    }
                                    if (buttonValues && buttonValues.badge) {



                                        //set the badge
                                        badge.addClass('exButtonBadge');
                                        badge.text(buttonValues.badge.caption ? buttonValues.badge.caption : "")
                                        badge.css("visibility", (buttonValues.badge.caption && buttonValues.badge.caption.length > 0) ? 'visible' : 'hidden');
                                        badge.css("backgroundColor", buttonValues.badge.color ? buttonValues.badge.color : "red");
                                    }
                                    else
                                        if (badge) badge.css('visibility', false)
                                

                            }
                        }
                    }

                    clearInterval(myInterval);
                    //alert('hook en place');

                    Bu.updateVisibility();
                }
            });
        }
    }, 1000);
    return {
        version: exButtonEventVersion,
    }
})()