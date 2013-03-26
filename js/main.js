(function($){

    //detect ie: http://james.padolsey.com/javascript/detect-ie-in-js-using-conditional-comments/
    var ie = (function(){
        var undef,
            v = 3,
            div = document.createElement('div'),
            all = div.getElementsByTagName('i');

        while (
            div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
                all[0]
            );

        return v > 4 ? v : undef;
    }());

    //ie requires className in setAttribute, while everyone else requires class
    var classNameValue = ie===6 ? "className" : "class";

    var sanitizeClassName = function(className) {
        return " "+className.replace(/[\t\r\n]/g, " ").replace(/ /g, "  ")+" ";
    };

    //Cross Browser watch:
    //http://johndyer.name/native-browser-get-set-properties-in-javascript/

    window.watcherStyle = "no watcher called";
    var unwatchChange = function(obj, prop) {
        delete obj[prop];
    }
    var watchChange =function(obj, prop, onSet) {
        var
            oldVal = obj[prop],
            getFunc = function() {
                return oldVal;
            },
            setFunc = function(newVal) {
                return oldVal = onSet.apply(obj, [newVal])
            }
        ;

        //official ecma script way
        if(Object.defineProperty) {
            window.watcherStyle = "ECMA Style";
            Object.defineProperty(obj, prop, {
                set: setFunc,
                get: getFunc
            });

        //old JS way
        } else if(obj.__defineGetter__) {
            window.watcherStyle = "Old JS Style";
            obj.__defineSetter__(prop, setFunc);
            obj.__defineGetter__(prop, getFunc);

        //IE6-7
        //must be real DOM object and must be attached to the DOM tree
        } else {
            window.watcherStyle = "IE Style";
            var onPropertyChange = function(e) {
                if(event.propertyName == prop) {
                    //avoid double fire
                    obj.detachEvent("onpropertychange", onPropertyChange);

                    setFunc(obj[prop]);

                    //reattach event
                    obj.attachEvent("onpropertychange", onPropertyChange);
                }
            }

            obj.attachEvent("onpropertychange", onPropertyChange);
        }
    };

    var getClassesFromString = function(classes) {
        return (classes || "").match(/\S+/g) || [];
    };

    var pinClassSetAttributeWatcher = function(key, val) {
        if(key === classNameValue) {
            return this.className=val;
        } else {
            return this._setAttribute(key, val);
        }
    };

    var pinClassSetWatcher = function(newVal) {
        if(!this._pinnedClassList)
            return this.className;

        var classList = getClassesFromString(newVal);
        var needToSetClassName=false;

        for(var i=0, c=this._pinnedClassList.length; i<c; ++i) {
            if($.inArray(this._pinnedClassList[i], classList)===-1) {
                classList.push(this._pinnedClassList[i]);
                needToSetClassName=true;
            }
        }

        var newClassName = classList.join(" ");

        window.watcherRewroteClassName = true;

        this._setAttribute(classNameValue,newClassName);
        return newClassName;
    };

    $.fn.pinClass=function(classes) {
        var classList = getClassesFromString(classes);

        return this.each(function() {
            this._pinnedClassList = classList;
            watchChange(this, "className", pinClassSetWatcher);
            this._setAttribute = this.setAttribute;
            this.setAttribute = pinClassSetAttributeWatcher;
        })
    };

    $.fn.unpinClass=function(classes) {
        var classList = getClassesFromString(classes);

        return this.each(function() {
            if(!this._pinnedClassList) return;
            this._pinnedClassList = $.grep(this._pinnedClassList, function(e) { return $.inArray(e, classes)!==-1});
        })
    };
})(jQuery);

