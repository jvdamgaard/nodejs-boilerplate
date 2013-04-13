/*
 * -------------------------------------------
 *    ./assets/javascripts/master/jqmobi.js
 * -------------------------------------------
 */

/**
* jqMobi is a query selector class for HTML5 mobile apps on a WebkitBrowser.
* Since most mobile devices (Android, iOS, webOS) use a WebKit browser, you only need to target one browser.
* We are able to increase the speed greatly by removing support for legacy desktop browsers and taking advantage of browser features, like native JSON parsing and querySelectorAll


* MIT License
* @author AppMobi
* @copyright Intel
* @api private
*/
if (!window.jq || typeof (jq) !== "function") {
    /**
     *  This is our master jq object that everything is built upon.
     * $ is a pointer to this object
     * @title jqMobi
     * @api private
     */
    var jq = (function(window) {
        var undefined, document = window.document,
        emptyArray = [],
        slice = emptyArray.slice,
        classCache = {},
        eventHandlers = [],
        _eventID = 1,
        jsonPHandlers = [],
        _jsonPID = 1,
        fragementRE=/^\s*<(\w+)[^>]*>/,
        _attrCache={},
        _propCache={};


        /**
         * internal function to use domfragments for insertion
         *
         * @api private
        */
        function _insertFragments(jqm,container,insert){
            var frag=document.createDocumentFragment();
            if(insert){
                for(var j=jqm.length-1;j>=0;j--)
                {
                    frag.insertBefore(jqm[j],frag.firstChild);
                }
                container.insertBefore(frag,container.firstChild);

            }
            else {

                for(var j=0;j<jqm.length;j++)
                    frag.appendChild(jqm[j]);
                container.appendChild(frag);
            }
            frag=null;
        }





        /**
         * Internal function to test if a class name fits in a regular expression
         * @param {String} name to search against
         * @return {Boolean}
         * @api private
         */
        function classRE(name) {
            return name in classCache ? classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'));
        }

        /**
         * Internal function that returns a array of unique elements
         * @param {Array} array to compare against
         * @return {Array} array of unique elements
         * @api private
         */
        function unique(arr) {
            for (var i = 0; i < arr.length; i++) {
                if (arr.indexOf(arr[i]) != i) {
                    arr.splice(i, 1);
                    i--;
                }
            }
            return arr;
        }

        /**
         * Given a set of nodes, it returns them as an array.  Used to find
         * siblings of an element
         * @param {Nodelist} Node list to search
         * @param {Object} [element] to find siblings off of
         * @return {Array} array of sibblings
         * @api private
         */
        function siblings(nodes, element) {
            var elems = [];
            if (nodes == undefined)
                return elems;

            for (; nodes; nodes = nodes.nextSibling) {
                if (nodes.nodeType == 1 && nodes !== element) {
                    elems.push(nodes);
                }
            }
            return elems;
        }

        /**
         * This is the internal jqMobi object that gets extended and added on to it
         * This is also the start of our query selector engine
         * @param {String|Element|Object|Array} selector
         * @param {String|Element|Object} [context]
         */
        var $jqm = function(toSelect, what) {
            this.length = 0;
            if (!toSelect) {
                return this;
            } else if (toSelect instanceof $jqm && what == undefined) {
                return toSelect;
            } else if ($.isFunction(toSelect)) {
                return $(document).ready(toSelect);
            } else if ($.isArray(toSelect) && toSelect.length != undefined) { //Passing in an array or object
                for (var i = 0; i < toSelect.length; i++)
                    this[this.length++] = toSelect[i];
                return this;
            } else if ($.isObject(toSelect) && $.isObject(what)) { //var tmp=$("span");  $("p").find(tmp);
                if (toSelect.length == undefined) {
                    if (toSelect.parentNode == what)
                        this[this.length++] = toSelect;
                } else {
                    for (var i = 0; i < toSelect.length; i++)
                        if (toSelect[i].parentNode == what)
                            this[this.length++] = toSelect[i];
                }
                return this;
            } else if ($.isObject(toSelect) && what == undefined) { //Single object
                this[this.length++] = toSelect;
                return this;
            } else if (what !== undefined) {
                if (what instanceof $jqm) {
                    return what.find(toSelect);
                }

            } else {
                what = document;
            }

            return this.selector(toSelect, what);

        };

        /**
         * This calls the $jqm function
         * @param {String|Element|Object|Array} selector
         * @param {String|Element|Object} [context]
         */
        var $ = function(selector, what) {
            return new $jqm(selector, what);
        };

        /**
         * this is the query selector library for elements
         * @param {String} selector
         * @param {String|Element|Object} [context]
         * @api private
         */
    function _selectorAll(selector, what){
      try{
        return what.querySelectorAll(selector);
      } catch(e){
        return [];
      }
    };
        function _selector(selector, what) {


      selector=selector.trim();

            if (selector[0] === "#" && selector.indexOf(".")==-1 && selector.indexOf(" ")===-1 && selector.indexOf(">")===-1){
                if (what == document)
                    _shimNodes(what.getElementById(selector.replace("#", "")),this);
                else
                    _shimNodes(_selectorAll(selector, what),this);
            } else if (selector[0] === "<" && selector[selector.length - 1] === ">")  //html
            {
                var tmp = document.createElement("div");
                tmp.innerHTML = selector.trim();
                _shimNodes(tmp.childNodes,this);
            } else {
                _shimNodes((_selectorAll(selector, what)),this);
            }
            return this;
        }

        function _shimNodes(nodes,obj){
            if(!nodes)
                return;
            if(nodes.nodeType)
                return obj[obj.length++]=nodes;
            for(var i=0,iz=nodes.length;i<iz;i++)
                obj[obj.length++]=nodes[i];
        }
        /**
        * Checks to see if the parameter is a $jqm object
            ```
            var foo=$('#header');
            $.is$(foo);
            ```

        * @param {Object} element
        * @return {Boolean}
        * @title $.is$(param)
        */
    $.is$ = function(obj){return obj instanceof $jqm;}
        /**
        * Map takes in elements and executes a callback function on each and returns a collection
        ```
        $.map([1,2],function(ind){return ind+1});
        ```

        * @param {Array|Object} elements
        * @param {Function} callback
        * @return {Object} jqMobi object with elements in it
        * @title $.map(elements,callback)
        */
        $.map = function(elements, callback) {
            var value, values = [],
            i, key;
            if ($.isArray(elements))
                for (i = 0; i < elements.length; i++) {
                    value = callback(elements[i], i);
                    if (value !== undefined)
                        values.push(value);
                }
            else if ($.isObject(elements))
                for (key in elements) {
                    if (!elements.hasOwnProperty(key))
                        continue;
                    value = callback(elements[key], key);
                    if (value !== undefined)
                        values.push(value);
                }
            return $([values]);
        };

        /**
        * Iterates through elements and executes a callback.  Returns if false
        ```
        $.each([1,2],function(ind){console.log(ind);});
        ```

        * @param {Array|Object} elements
        * @param {Function} callback
        * @return {Array} elements
        * @title $.each(elements,callback)
        */
        $.each = function(elements, callback) {
            var i, key;
            if ($.isArray(elements))
                for (i = 0; i < elements.length; i++) {
                    if (callback(i, elements[i]) === false)
                        return elements;
                }
            else if ($.isObject(elements))
                for (key in elements) {
                    if (!elements.hasOwnProperty(key))
                        continue;
                    if (callback(key, elements[key]) === false)
                        return elements;
                }
            return elements;
        };

        /**
        * Extends an object with additional arguments
            ```
            $.extend({foo:'bar'});
            $.extend(element,{foo:'bar'});
            ```

        * @param {Object} [target] element
        * @param any number of additional arguments
        * @return {Object} [target]
        * @title $.extend(target,{params})
        */
        $.extend = function(target) {
            if (target == undefined)
                target = this;
            if (arguments.length === 1) {
                for (var key in target)
                    this[key] = target[key];
                return this;
            } else {
                slice.call(arguments, 1).forEach(function(source) {
                    for (var key in source)
                        target[key] = source[key];
                });
            }
            return target;
        };

        /**
        * Checks to see if the parameter is an array
            ```
            var arr=[];
            $.isArray(arr);
            ```

        * @param {Object} element
        * @return {Boolean}
        * @example $.isArray([1]);
        * @title $.isArray(param)
        */
        $.isArray = function(obj) {
            return obj instanceof Array && obj['push'] != undefined; //ios 3.1.3 doesn't have Array.isArray
        };

        /**
        * Checks to see if the parameter is a function
            ```
            var func=function(){};
            $.isFunction(func);
            ```

        * @param {Object} element
        * @return {Boolean}
        * @title $.isFunction(param)
        */
        $.isFunction = function(obj) {
            return typeof obj === "function" && !(obj instanceof RegExp);
        };
        /**
        * Checks to see if the parameter is a object
            ```
            var foo={bar:'bar'};
            $.isObject(foo);
            ```

        * @param {Object} element
        * @return {Boolean}
        * @title $.isObject(param)
        */
        $.isObject = function(obj) {
            return typeof obj === "object";
        };

        /**
         * Prototype for jqm object.  Also extens $.fn
         */
        $.fn = $jqm.prototype = {
            constructor: $jqm,
            forEach: emptyArray.forEach,
            reduce: emptyArray.reduce,
            push: emptyArray.push,
            indexOf: emptyArray.indexOf,
            concat: emptyArray.concat,
            selector: _selector,
            oldElement: undefined,
            slice: emptyArray.slice,
            /**
             * This is a utility function for .end()
             * @param {Object} params
             * @return {Object} a jqMobi with params.oldElement set to this
             * @api private
             */
            setupOld: function(params) {
                if (params == undefined)
                    return $();
                params.oldElement = this;
                return params;

            },
            /**
            * This is a wrapper to $.map on the selected elements
                ```
                $().map(function(){this.value+=ind});
                ```

            * @param {Function} callback
            * @return {Object} a jqMobi object
            * @title $().map(function)
            */
            map: function(fn) {
                var value, values = [], i;
                for (i = 0; i < this.length; i++) {
                    value = fn(i,this[i]);
                    if (value !== undefined)
                        values.push(value);
                }
                return $([values]);
            },
            /**
            * Iterates through all elements and applys a callback function
                ```
                $().each(function(){console.log(this.value)});
                ```

            * @param {Function} callback
            * @return {Object} a jqMobi object
            * @title $().each(function)
            */
            each: function(callback) {
                this.forEach(function(el, idx) {
                    callback.call(el, idx, el);
                });
                return this;
            },
            /**
            * This is executed when DOMContentLoaded happens, or after if you've registered for it.
                ```
                $(document).ready(function(){console.log('I'm ready');});
                ```

            * @param {Function} callback
            * @return {Object} a jqMobi object
            * @title $().ready(function)
            */

            ready: function(callback) {
                if (document.readyState === "complete" || document.readyState === "loaded"||(!$.os.ie&&document.readyState==="interactive")) //IE10 fires interactive too early
                    callback();
                else
                    document.addEventListener("DOMContentLoaded", callback, false);
                return this;
            },
            /**
            * Searches through the collection and reduces them to elements that match the selector
                ```
                $("#foo").find('.bar');
                $("#foo").find($('.bar'));
                $("#foo").find($('.bar').get());
                ```

            * @param {String|Object|Array} selector
            * @return {Object} a jqMobi object filtered
            * @title $().find(selector)

            */
            find: function(sel) {
                if (this.length === 0)
                    return this;
                var elems = [];
                var tmpElems;
                for (var i = 0; i < this.length; i++) {
                    tmpElems = ($(sel, this[i]));

                    for (var j = 0; j < tmpElems.length; j++) {
                        elems.push(tmpElems[j]);
                    }
                }
                return $(unique(elems));
            },
            /**
            * Gets or sets the innerHTML for the collection.
            * If used as a get, the first elements innerHTML is returned
                ```
                $("#foo").html(); //gets the first elements html
                $("#foo").html('new html');//sets the html
                $("#foo").html('new html',false); //Do not do memory management cleanup
                ```

            * @param {String} html to set
            * @param {Bool} [cleanup] - set to false for performance tests and if you do not want to execute memory management cleanup
            * @return {Object} a jqMobi object
            * @title $().html([html])
            */
            html: function(html,cleanup) {
                if (this.length === 0)
                    return this;
                if (html === undefined)
                    return this[0].innerHTML;

                for (var i = 0; i < this.length; i++) {
                    if(cleanup!==false)
                        $.cleanUpContent(this[i], false, true);
                    this[i].innerHTML = html;
                }
                return this;
            },


            /**
            * Gets or sets the innerText for the collection.
            * If used as a get, the first elements innerText is returned
                ```
                $("#foo").text(); //gets the first elements text;
                $("#foo").text('new text'); //sets the text
                ```

            * @param {String} text to set
            * @return {Object} a jqMobi object
            * @title $().text([text])
            */
            text: function(text) {
                if (this.length === 0)
                    return this;
                if (text === undefined)
                    return this[0].textContent;
                for (var i = 0; i < this.length; i++) {
                    this[i].textContent = text;
                }
                return this;
            },
            /**
            * Gets or sets a css property for the collection
            * If used as a get, the first elements css property is returned
                ```
                $().css("background"); // Gets the first elements background
                $().css("background","red")  //Sets the elements background to red
                ```

            * @param {String} attribute to get
            * @param {String} value to set as
            * @return {Object} a jqMobi object
            * @title $().css(attribute,[value])
            */
            css: function(attribute, value, obj) {
                var toAct = obj != undefined ? obj : this[0];
                if (this.length === 0)
                    return this;
                if (value == undefined && typeof (attribute) === "string") {
                    var styles = window.getComputedStyle(toAct);
                    return  toAct.style[attribute] ? toAct.style[attribute]: window.getComputedStyle(toAct)[attribute] ;
                }
                for (var i = 0; i < this.length; i++) {
                    if ($.isObject(attribute)) {
                        for (var j in attribute) {
                            this[i].style[j] = attribute[j];
                        }
                    } else {
                        this[i].style[attribute] = value;
                    }
                }
                return this;
            },
            /**
             * Gets or sets css vendor specific css properties
            * If used as a get, the first elements css property is returned
                ```
                $().css("background"); // Gets the first elements background
                $().css("background","red")  //Sets the elements background to red
                ```

            * @param {String} attribute to get
            * @param {String} value to set as
            * @return {Object} a jqMobi object
            * @title $().css(attribute,[value])
            */
            vendorCss:function(attribute,value,obj){
                return this.css($.feat.cssPrefix+attribute,value,obj);
            },
            /**
            * Sets the innerHTML of all elements to an empty string
                ```
                $().empty();
                ```

            * @return {Object} a jqMobi object
            * @title $().empty()
            */
            empty: function() {
                for (var i = 0; i < this.length; i++) {
                    $.cleanUpContent(this[i], false, true);
                    this[i].innerHTML = '';
                }
                return this;
            },
            /**
            * Sets the elements display property to "none".
            * This will also store the old property into an attribute for hide
                ```
                $().hide();
                ```

            * @return {Object} a jqMobi object
            * @title $().hide()
            */
            hide: function() {
                if (this.length === 0)
                    return this;
                for (var i = 0; i < this.length; i++) {
                    if (this.css("display", null, this[i]) != "none") {
                        this[i].setAttribute("jqmOldStyle", this.css("display", null, this[i]));
                        this[i].style.display = "none";
                    }
                }
                return this;
            },
            /**
            * Shows all the elements by setting the css display property
            * We look to see if we were retaining an old style (like table-cell) and restore that, otherwise we set it to block
                ```
                $().show();
                ```

            * @return {Object} a jqMobi object
            * @title $().show()
            */
            show: function() {
                if (this.length === 0)
                    return this;
                for (var i = 0; i < this.length; i++) {
                    if (this.css("display", null, this[i]) == "none") {
                        this[i].style.display = this[i].getAttribute("jqmOldStyle") ? this[i].getAttribute("jqmOldStyle") : 'block';
                        this[i].removeAttribute("jqmOldStyle");
                    }
                }
                return this;
            },
            /**
            * Toggle the visibility of a div
                ```
                $().toggle();
                $().toggle(true); //force showing
                ```

            * @param {Boolean} [show] -force the hiding or showing of the element
            * @return {Object} a jqMobi object
            * @title $().toggle([show])
            */
            toggle: function(show) {
                var show2 = show === true ? true : false;
                for (var i = 0; i < this.length; i++) {
                    if (window.getComputedStyle(this[i])['display'] !== "none" || (show !== undefined && show2 === false)) {
                        this[i].setAttribute("jqmOldStyle", this[i].style.display)
                        this[i].style.display = "none";
                    } else {
                        this[i].style.display = this[i].getAttribute("jqmOldStyle") != undefined ? this[i].getAttribute("jqmOldStyle") : 'block';
                        this[i].removeAttribute("jqmOldStyle");
                    }
                }
                return this;
            },
            /**
            * Gets or sets an elements value
            * If used as a getter, we return the first elements value.  If nothing is in the collection, we return undefined
                ```
                $().value; //Gets the first elements value;
                $().value="bar"; //Sets all elements value to bar
                ```

            * @param {String} [value] to set
            * @return {String|Object} A string as a getter, jqMobi object as a setter
            * @title $().val([value])
            */
            val: function(value) {
                if (this.length === 0)
                    return (value === undefined) ? undefined : this;
                if (value == undefined)
                    return this[0].value;
                for (var i = 0; i < this.length; i++) {
                    this[i].value = value;
                }
                return this;
            },
            /**
            * Gets or sets an attribute on an element
            * If used as a getter, we return the first elements value.  If nothing is in the collection, we return undefined
                ```
                $().attr("foo"); //Gets the first elements 'foo' attribute
                $().attr("foo","bar");//Sets the elements 'foo' attribute to 'bar'
                $().attr("foo",{bar:'bar'}) //Adds the object to an internal cache
                ```

            * @param {String|Object} attribute to act upon.  If it's an object (hashmap), it will set the attributes based off the kvp.
            * @param {String|Array|Object|function} [value] to set
            * @return {String|Object|Array|Function} If used as a getter, return the attribute value.  If a setter, return a jqMobi object
            * @title $().attr(attribute,[value])
            */
            attr: function(attr, value) {
                if (this.length === 0)
                    return (value === undefined) ? undefined : this;
                if (value === undefined && !$.isObject(attr)) {
                    var val = (this[0].jqmCacheId&&_attrCache[this[0].jqmCacheId][attr])?(this[0].jqmCacheId&&_attrCache[this[0].jqmCacheId][attr]):this[0].getAttribute(attr);
                    return val;
                }
                for (var i = 0; i < this.length; i++) {
                    if ($.isObject(attr)) {
                        for (var key in attr) {
                            $(this[i]).attr(key,attr[key]);
                        }
                    }
                    else if($.isArray(value)||$.isObject(value)||$.isFunction(value))
                    {

                        if(!this[i].jqmCacheId)
                            this[i].jqmCacheId=$.uuid();

                        if(!_attrCache[this[i].jqmCacheId])
                            _attrCache[this[i].jqmCacheId]={}
                        _attrCache[this[i].jqmCacheId][attr]=value;
                    }
                    else if (value == null && value !== undefined)
                    {
                        this[i].removeAttribute(attr);
                        if(this[i].jqmCacheId&&_attrCache[this[i].jqmCacheId][attr])
                            delete _attrCache[this[i].jqmCacheId][attr];
                    }
                    else{
                        this[i].setAttribute(attr, value);
                    }
                }
                return this;
            },
            /**
            * Removes an attribute on the elements
                ```
                $().removeAttr("foo");
                ```

            * @param {String} attributes that can be space delimited
            * @return {Object} jqMobi object
            * @title $().removeAttr(attribute)
            */
            removeAttr: function(attr) {
                var that = this;
                for (var i = 0; i < this.length; i++) {
                    attr.split(/\s+/g).forEach(function(param) {
                        that[i].removeAttribute(param);
                        if(that[i].jqmCacheId&&_attrCache[that[i].jqmCacheId][attr])
                            delete _attrCache[that[i].jqmCacheId][attr];
                    });
                }
                return this;
            },

            /**
            * Gets or sets a property on an element
            * If used as a getter, we return the first elements value.  If nothing is in the collection, we return undefined
                ```
                $().prop("foo"); //Gets the first elements 'foo' property
                $().prop("foo","bar");//Sets the elements 'foo' property to 'bar'
                $().prop("foo",{bar:'bar'}) //Adds the object to an internal cache
                ```

            * @param {String|Object} property to act upon.  If it's an object (hashmap), it will set the attributes based off the kvp.
            * @param {String|Array|Object|function} [value] to set
            * @return {String|Object|Array|Function} If used as a getter, return the property value.  If a setter, return a jqMobi object
            * @title $().prop(property,[value])
            */
            prop: function(prop, value) {
                if (this.length === 0)
                    return (value === undefined) ? undefined : this;
                if (value === undefined && !$.isObject(prop)) {
                    var res;
                    var val = (this[0].jqmCacheId&&_propCache[this[0].jqmCacheId][prop])?(this[0].jqmCacheId&&_propCache[this[0].jqmCacheId][prop]):!(res=this[0][prop])&&prop in this[0]?this[0][prop]:res;
                    return val;
                }
                for (var i = 0; i < this.length; i++) {
                    if ($.isObject(prop)) {
                        for (var key in prop) {
                            $(this[i]).prop(key,prop[key]);
                        }
                    }
                    else if($.isArray(value)||$.isObject(value)||$.isFunction(value))
                    {

                        if(!this[i].jqmCacheId)
                            this[i].jqmCacheId=$.uuid();

                        if(!_propCache[this[i].jqmCacheId])
                            _propCache[this[i].jqmCacheId]={}
                        _propCache[this[i].jqmCacheId][prop]=value;
                    }
                    else if (value == null && value !== undefined)
                    {
                        $(this[i]).removeProp(prop);
                    }
                    else{
                        this[i][prop]= value;
                    }
                }
                return this;
            },
            /**
            * Removes a property on the elements
                ```
                $().removeProp("foo");
                ```

            * @param {String} properties that can be space delimited
            * @return {Object} jqMobi object
            * @title $().removeProp(attribute)
            */
            removeProp: function(prop) {
                var that = this;
                for (var i = 0; i < this.length; i++) {
                    prop.split(/\s+/g).forEach(function(param) {
                        if(that[i][param])
                            delete that[i][param];
                        if(that[i].jqmCacheId&&_propCache[that[i].jqmCacheId][prop]){
                                delete _propCache[that[i].jqmCacheId][prop];
                        }
                    });
                }
                return this;
            },

            /**
            * Removes elements based off a selector
                ```
                $().remove();  //Remove all
                $().remove(".foo");//Remove off a string selector
                var element=$("#foo").get();
                $().remove(element); //Remove by an element
                $().remove($(".foo"));  //Remove by a collection

                ```

            * @param {String|Object|Array} selector to filter against
            * @return {Object} jqMobi object
            * @title $().remove(selector)
            */
            remove: function(selector) {
                var elems = $(this).filter(selector);
                if (elems == undefined)
                    return this;
                for (var i = 0; i < elems.length; i++) {
                    $.cleanUpContent(elems[i], true, true);
                    elems[i].parentNode.removeChild(elems[i]);
                }
                return this;
            },
            /**
            * Adds a css class to elements.
                ```
                $().addClass("selected");
                ```

            * @param {String} classes that are space delimited
            * @return {Object} jqMobi object
            * @title $().addClass(name)
            */
            addClass: function(name) {
                for (var i = 0; i < this.length; i++) {
                    var cls = this[i].className;
                    var classList = [];
                    var that = this;
                    name.split(/\s+/g).forEach(function(cname) {
                        if (!that.hasClass(cname, that[i]))
                            classList.push(cname);
                    });

                    this[i].className += (cls ? " " : "") + classList.join(" ");
                    this[i].className = this[i].className.trim();
                }
                return this;
            },
            /**
            * Removes a css class from elements.
                ```
                $().removeClass("foo"); //single class
                $().removeClass("foo selected");//remove multiple classess
                ```

            * @param {String} classes that are space delimited
            * @return {Object} jqMobi object
            * @title $().removeClass(name)
            */
            removeClass: function(name) {
                for (var i = 0; i < this.length; i++) {
                    if (name == undefined) {
                        this[i].className = '';
                        return this;
                    }
                    var classList = this[i].className;
                    name.split(/\s+/g).forEach(function(cname) {
                        classList = classList.replace(classRE(cname), " ");
                    });
                    if (classList.length > 0)
                        this[i].className = classList.trim();
                    else
                        this[i].className = "";
                }
                return this;
            },
            /**
            * Replaces a css class on elements.
                ```
                $().replaceClass("on", "off");
                ```

            * @param {String} classes that are space delimited
      * @param {String} classes that are space delimited
            * @return {Object} jqMobi object
            * @title $().replaceClass(old, new)
            */
            replaceClass: function(name, newName) {
                for (var i = 0; i < this.length; i++) {
                    if (name == undefined) {
                        this[i].className = newName;
                        continue;
                    }
                    var classList = this[i].className;
                    name.split(/\s+/g).concat(newName.split(/\s+/g)).forEach(function(cname) {
                        classList = classList.replace(classRE(cname), " ");
                    });
          classList=classList.trim();
                    if (classList.length > 0){
                      this[i].className = (classList+" "+newName).trim();
                    } else
                        this[i].className = newName;
                }
                return this;
            },
            /**
            * Checks to see if an element has a class.
                ```
                $().hasClass('foo');
                $().hasClass('foo',element);
                ```

            * @param {String} class name to check against
            * @param {Object} [element] to check against
            * @return {Boolean}
            * @title $().hasClass(name,[element])
            */
            hasClass: function(name, element) {
                if (this.length === 0)
                    return false;
                if (!element)
                    element = this[0];
                return classRE(name).test(element.className);
            },
            /**
            * Appends to the elements
            * We boil everything down to a jqMobi object and then loop through that.
            * If it's HTML, we create a dom element so we do not break event bindings.
            * if it's a script tag, we evaluate it.
                ```
                $().append("<div></div>"); //Creates the object from the string and appends it
                $().append($("#foo")); //Append an object;
                ```

            * @param {String|Object} Element/string to add
            * @param {Boolean} [insert] insert or append
            * @return {Object} jqMobi object
            * @title $().append(element,[insert])
            */
            append: function(element, insert) {
                if (element && element.length != undefined && element.length === 0)
                    return this;
                if ($.isArray(element) || $.isObject(element))
                    element = $(element);
                var i;


                for (i = 0; i < this.length; i++) {
                    if (element.length && typeof element != "string") {
                        element = $(element);
                        _insertFragments(element,this[i],insert);
                    } else {
                        var obj =fragementRE.test(element)?$(element):undefined;
                        if (obj == undefined || obj.length == 0) {
                            obj = document.createTextNode(element);
                        }
                        if (obj.nodeName != undefined && obj.nodeName.toLowerCase() == "script" && (!obj.type || obj.type.toLowerCase() === 'text/javascript')) {
                            window.eval(obj.innerHTML);
                        } else if(obj instanceof $jqm) {
                            _insertFragments(obj,this[i],insert);
                        }
                        else {
                            insert != undefined ? this[i].insertBefore(obj, this[i].firstChild) : this[i].appendChild(obj);
                        }
                    }
                }
                return this;
            },
             /**
            * Appends the current collection to the selector
                ```
                $().appendTo("#foo"); //Append an object;
                ```

            * @param {String|Object} Selector to append to
            * @param {Boolean} [insert] insert or append
            * @title $().appendTo(element,[insert])
            */
            appendTo:function(selector,insert){
                var tmp=$(selector);
                tmp.append(this);
                return this;
            },
             /**
            * Prepends the current collection to the selector
                ```
                $().prependTo("#foo"); //Prepend an object;
                ```

            * @param {String|Object} Selector to prepent to
            * @title $().prependTo(element)
            */
            prependTo:function(selector){
                var tmp=$(selector);
                tmp.append(this,true);
                return this;
            },
            /**
            * Prepends to the elements
            * This simply calls append and sets insert to true
                ```
                $().prepend("<div></div>");//Creates the object from the string and appends it
                $().prepend($("#foo")); //Prepends an object
                ```

            * @param {String|Object} Element/string to add
            * @return {Object} jqMobi object
            * @title $().prepend(element)
            */
            prepend: function(element) {
                return this.append(element, 1);
            },
            /**
             * Inserts collection before the target (adjacent)
                ```
                $().insertBefore(jq("#target"));
                ```

             * @param {String|Object} Target
             * @title $().insertBefore(target);
             */
            insertBefore: function(target, after) {
                if (this.length == 0)
                    return this;
                target = $(target).get(0);
                if (!target)
                    return this;
                for (var i = 0; i < this.length; i++)
                {
                    after ? target.parentNode.insertBefore(this[i], target.nextSibling) : target.parentNode.insertBefore(this[i], target);
                }
                return this;
            },
            /**
             * Inserts collection after the target (adjacent)
                ```
                $().insertAfter(jq("#target"));
                ```
             * @param {String|Object} target
             * @title $().insertAfter(target);
             */
            insertAfter: function(target) {
                this.insertBefore(target, true);
            },
            /**
            * Returns the raw DOM element.
                ```
                $().get(); //returns the first element
                $().get(2);// returns the third element
                ```

            * @param {Int} [index]
            * @return {Object} raw DOM element
            * @title $().get([index])
            */
            get: function(index) {
                index = index == undefined ? 0 : index;
                if (index < 0)
                    index += this.length;
                return (this[index]) ? this[index] : undefined;
            },
            /**
            * Returns the offset of the element, including traversing up the tree
                ```
                $().offset();
                ```

            * @return {Object} with left, top, width and height properties
            * @title $().offset()
            */
            offset: function() {
                if (this.length === 0)
                    return this;
                if(this[0]==window)
                    return {
                        left:0,
                        top:0,
                        right:0,
                        bottom:0,
                        width:window.innerWidth,
                        height:window.innerHeight
                    }
                else
                    var obj = this[0].getBoundingClientRect();
                return {
                    left: obj.left + window.pageXOffset,
                    top: obj.top + window.pageYOffset,
                    right: obj.right + window.pageXOffset,
                    bottom: obj.bottom + window.pageYOffset,
                    width: obj.right-obj.left,
                    height: obj.bottom-obj.top
                };
            },
             /**
             * returns the height of the element, including padding on IE
               ```
               $().height();
               ```
             * @return {string} height
             * @title $().height()
             */
            height:function(val){
                if (this.length === 0)
                    return this;
                if(val!=undefined)
                    return this.css("height",val);
                if(this[0]==this[0].window)
                    return window.innerHeight;
                if(this[0].nodeType==this[0].DOCUMENT_NODE)
                    return this[0].documentElement['offsetheight'];
                else{
                    var tmpVal=this.css("height").replace("px","");
                    if(tmpVal)
                        return tmpVal
                    else
                        return this.offset().height;
                }
            },
            /**
             * returns the width of the element, including padding on IE
               ```
               $().width();
               ```
             * @return {string} width
             * @title $().width()
             */
            width:function(val){
                if (this.length === 0)
                    return this;
                 if(val!=undefined)
                    return this.css("width",val);
                if(this[0]==this[0].window)
                    return window.innerWidth;
                if(this[0].nodeType==this[0].DOCUMENT_NODE)
                    return this[0].documentElement['offsetwidth'];
                else{
                    var tmpVal=this.css("width").replace("px","");
          if(tmpVal)
                        return tmpVal
                    else
             return this.offset().width;
                }
            },
            /**
            * Returns the parent nodes of the elements based off the selector
                ```
                $("#foo").parent('.bar');
                $("#foo").parent($('.bar'));
                $("#foo").parent($('.bar').get());
                ```

            * @param {String|Array|Object} [selector]
            * @return {Object} jqMobi object with unique parents
            * @title $().parent(selector)
            */
            parent: function(selector,recursive) {
                if (this.length == 0)
                    return this;
                var elems = [];
                for (var i = 0; i < this.length; i++) {
                    var tmp=this[i];
                    while(tmp.parentNode&&tmp.parentNode!=document){
                        elems.push(tmp.parentNode);
                        if(tmp.parentNode)
                            tmp=tmp.parentNode;
                        if(!recursive)
                            break;
                    }
                }
                return this.setupOld($(unique(elems)).filter(selector));
            },
             /**
            * Returns the parents of the elements based off the selector (traversing up until html document)
                ```
                $("#foo").parents('.bar');
                $("#foo").parents($('.bar'));
                $("#foo").parents($('.bar').get());
                ```

            * @param {String|Array|Object} [selector]
            * @return {Object} jqMobi object with unique parents
            * @title $().parents(selector)
            */
            parents: function(selector) {
                return this.parent(selector,true);
            },
            /**
            * Returns the child nodes of the elements based off the selector
                ```
                $("#foo").children('.bar'); //Selector
                $("#foo").children($('.bar')); //Objects
                $("#foo").children($('.bar').get()); //Single element
                ```

            * @param {String|Array|Object} [selector]
            * @return {Object} jqMobi object with unique children
            * @title $().children(selector)
            */
            children: function(selector) {

                if (this.length == 0)
                    return this;
                var elems = [];
                for (var i = 0; i < this.length; i++) {
                    elems = elems.concat(siblings(this[i].firstChild));
                }
                return this.setupOld($((elems)).filter(selector));

            },
            /**
            * Returns the siblings of the element based off the selector
                ```
                $("#foo").siblings('.bar'); //Selector
                $("#foo").siblings($('.bar')); //Objects
                $("#foo").siblings($('.bar').get()); //Single element
                ```

            * @param {String|Array|Object} [selector]
            * @return {Object} jqMobi object with unique siblings
            * @title $().siblings(selector)
            */
            siblings: function(selector) {
                if (this.length == 0)
                    return this;
                var elems = [];
                for (var i = 0; i < this.length; i++) {
                    if (this[i].parentNode)
                        elems = elems.concat(siblings(this[i].parentNode.firstChild, this[i]));
                }
                return this.setupOld($(elems).filter(selector));
            },
            /**
            * Returns the closest element based off the selector and optional context
                ```
                $("#foo").closest('.bar'); //Selector
                $("#foo").closest($('.bar')); //Objects
                $("#foo").closest($('.bar').get()); //Single element
                ```

            * @param {String|Array|Object} selector
            * @param {Object} [context]
            * @return {Object} Returns a jqMobi object with the closest element based off the selector
            * @title $().closest(selector,[context]);
            */
            closest: function(selector, context) {
                if (this.length == 0)
                    return this;
                var elems = [],
                cur = this[0];

                var start = $(selector, context);
                if (start.length == 0)
                    return $();
                while (cur && start.indexOf(cur) == -1) {
                    cur = cur !== context && cur !== document && cur.parentNode;
                }
                return $(cur);

            },
            /**
            * Filters elements based off the selector
                ```
                $("#foo").filter('.bar'); //Selector
                $("#foo").filter($('.bar')); //Objects
                $("#foo").filter($('.bar').get()); //Single element
                ```

            * @param {String|Array|Object} selector
            * @return {Object} Returns a jqMobi object after the filter was run
            * @title $().filter(selector);
            */
            filter: function(selector) {
                if (this.length == 0)
                    return this;

                if (selector == undefined)
                    return this;
                var elems = [];
                for (var i = 0; i < this.length; i++) {
                    var val = this[i];
                    if (val.parentNode && $(selector, val.parentNode).indexOf(val) >= 0)
                        elems.push(val);
                }
                return this.setupOld($(unique(elems)));
            },
            /**
            * Basically the reverse of filter.  Return all elements that do NOT match the selector
                ```
                $("#foo").not('.bar'); //Selector
                $("#foo").not($('.bar')); //Objects
                $("#foo").not($('.bar').get()); //Single element
                ```

            * @param {String|Array|Object} selector
            * @return {Object} Returns a jqMobi object after the filter was run
            * @title $().not(selector);
            */
            not: function(selector) {
                if (this.length == 0)
                    return this;
                var elems = [];
                for (var i = 0; i < this.length; i++) {
                    var val = this[i];
                    if (val.parentNode && $(selector, val.parentNode).indexOf(val) == -1)
                        elems.push(val);
                }
                return this.setupOld($(unique(elems)));
            },
            /**
            * Gets or set data-* attribute parameters on elements
            * When used as a getter, it's only the first element
                ```
                $().data("foo"); //Gets the data-foo attribute for the first element
                $().data("foo","bar"); //Sets the data-foo attribute for all elements
                $().data("foo",{bar:'bar'});//object as the data
                ```

            * @param {String} key
            * @param {String|Array|Object} value
            * @return {String|Object} returns the value or jqMobi object
            * @title $().data(key,[value]);
            */
            data: function(key, value) {
                return this.attr('data-' + key, value);
            },
            /**
            * Rolls back the jqMobi elements when filters were applied
            * This can be used after .not(), .filter(), .children(), .parent()
                ```
                $().filter(".panel").end(); //This will return the collection BEFORE filter is applied
                ```

            * @return {Object} returns the previous jqMobi object before filter was applied
            * @title $().end();
            */
            end: function() {
                return this.oldElement != undefined ? this.oldElement : $();
            },
            /**
            * Clones the nodes in the collection.
                ```
                $().clone();// Deep clone of all elements
                $().clone(false); //Shallow clone
                ```

            * @param {Boolean} [deep] - do a deep copy or not
            * @return {Object} jqMobi object of cloned nodes
            * @title $().clone();
            */
            clone: function(deep) {
                deep = deep === false ? false : true;
                if (this.length == 0)
                    return this;
                var elems = [];
                for (var i = 0; i < this.length; i++) {
                    elems.push(this[i].cloneNode(deep));
                }

                return $(elems);
            },
            /**
            * Returns the number of elements in the collection
                ```
                $().size();
                ```

            * @return {Int}
            * @title $().size();
            */
            size: function() {
                return this.length;
            },
            /**
             * Serailizes a form into a query string
               ```
               $().serialize();
               ```
             * @return {String}
             * @title $().serialize()
             */
            serialize: function() {
                if (this.length == 0)
                    return "";
                var params = [];
                for (var i = 0; i < this.length; i++)
                {
                    this.slice.call(this[i].elements).forEach(function(elem) {
                        var type = elem.getAttribute("type");
                        if (elem.nodeName.toLowerCase() != "fieldset" && !elem.disabled && type != "submit"
                        && type != "reset" && type != "button" && ((type != "radio" && type != "checkbox") || elem.checked))
                        {

                            if(elem.getAttribute("name")){
                                if(elem.type=="select-multiple"){
                                    for(var j=0;j<elem.options.length;j++){
                                        if(elem.options[j].selected)
                                            params.push(elem.getAttribute("name")+"="+encodeURIComponent(elem.options[j].value))
                                    }
                                }
                                else
                                    params.push(elem.getAttribute("name")+"="+encodeURIComponent(elem.value))
                            }
                        }
                    });
                }
                return params.join("&");
            },

            /* added in 1.2 */
            /**
             * Reduce the set of elements based off index
                ```
               $().eq(index)
               ```
             * @param {Int} index - Index to filter by. If negative, it will go back from the end
             * @return {Object} jqMobi object
             * @title $().eq(index)
             */
            eq:function(ind){
                return $(this.get(ind));
            },
            /**
             * Returns the index of the selected element in the collection
               ```
               $().index(elem)
               ```
             * @param {String|Object} element to look for.  Can be a selector or object
             * @return integer - index of selected element
             * @title $().index(elem)
             */
            index:function(elem){
                return elem?this.indexOf($(elem)[0]):this.parent().children().indexOf(this[0]);
            },
            /**
              * Returns boolean if the object is a type of the selector
              ```
              $().is(selector)
              ```
             * param {String|Object|Function} selector to act upon
             * @return boolean
             * @title $().is(selector)
             */
            is:function(selector){
                return !!selector&&this.filter(selector).length>0;
            }

        };


        /* AJAX functions */

        function empty() {
        }
        var ajaxSettings = {
            type: 'GET',
            beforeSend: empty,
            success: empty,
            error: empty,
            complete: empty,
            context: undefined,
            timeout: 0,
            crossDomain: null
        };
        /**
        * Execute a jsonP call, allowing cross domain scripting
        * options.url - URL to call
        * options.success - Success function to call
        * options.error - Error function to call
            ```
            $.jsonP({url:'mysite.php?callback=?&foo=bar',success:function(){},error:function(){}});
            ```

        * @param {Object} options
        * @title $.jsonP(options)
        */
        $.jsonP = function(options) {
            var callbackName = 'jsonp_callback' + (++_jsonPID);
            var abortTimeout = "",
            context;
            var script = document.createElement("script");
            var abort = function() {
                $(script).remove();
                if (window[callbackName])
                    window[callbackName] = empty;
            };
            window[callbackName] = function(data) {
                clearTimeout(abortTimeout);
                $(script).remove();
                delete window[callbackName];
                options.success.call(context, data);
            };
            script.src = options.url.replace(/=\?/, '=' + callbackName);
            if(options.error)
            {
               script.onerror=function(){
                  clearTimeout(abortTimeout);
                  options.error.call(context, "", 'error');
               }
            }
            $('head').append(script);
            if (options.timeout > 0)
                abortTimeout = setTimeout(function() {
                    options.error.call(context, "", 'timeout');
                }, options.timeout);
            return {};
        };

        /**
        * Execute an Ajax call with the given options
        * options.type - Type of request
        * options.beforeSend - function to execute before sending the request
        * options.success - success callback
        * options.error - error callback
        * options.complete - complete callback - callled with a success or error
        * options.timeout - timeout to wait for the request
        * options.url - URL to make request against
        * options.contentType - HTTP Request Content Type
        * options.headers - Object of headers to set
        * options.dataType - Data type of request
        * options.data - data to pass into request.  $.param is called on objects
            ```
            var opts={
            type:"GET",
            success:function(data){},
            url:"mypage.php",
            data:{bar:'bar'},
            }
            $.ajax(opts);
            ```

        * @param {Object} options
        * @title $.ajax(options)
        */
        $.ajax = function(opts) {
            var xhr;
            try {

                var settings = opts || {};
                for (var key in ajaxSettings) {
                    if (typeof(settings[key]) == 'undefined')
                        settings[key] = ajaxSettings[key];
                }

                if (!settings.url)
                    settings.url = window.location;
                if (!settings.contentType)
                    settings.contentType = "application/x-www-form-urlencoded";
                if (!settings.headers)
                    settings.headers = {};

                if(!('async' in settings)||settings.async!==false)
                    settings.async=true;

                if (!settings.dataType)
                    settings.dataType = "text/html";
                else {
                    switch (settings.dataType) {
                        case "script":
                            settings.dataType = 'text/javascript, application/javascript';
                            break;
                        case "json":
                            settings.dataType = 'application/json';
                            break;
                        case "xml":
                            settings.dataType = 'application/xml, text/xml';
                            break;
                        case "html":
                            settings.dataType = 'text/html';
                            break;
                        case "text":
                            settings.dataType = 'text/plain';
                            break;
                        default:
                            settings.dataType = "text/html";
                            break;
                        case "jsonp":
                            return $.jsonP(opts);
                            break;
                    }
                }
                if ($.isObject(settings.data))
                    settings.data = $.param(settings.data);
                if (settings.type.toLowerCase() === "get" && settings.data) {
                    if (settings.url.indexOf("?") === -1)
                        settings.url += "?" + settings.data;
                    else
                        settings.url += "&" + settings.data;
                }

                if (/=\?/.test(settings.url)) {
                    return $.jsonP(settings);
                }
                if (settings.crossDomain === null) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
                    RegExp.$2 != window.location.host;

                if(!settings.crossDomain)
                    settings.headers = $.extend({'X-Requested-With': 'XMLHttpRequest'}, settings.headers);
                var abortTimeout;
                var context = settings.context;
                var protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol;

        //ok, we are really using xhr
        xhr = new window.XMLHttpRequest();


                xhr.onreadystatechange = function() {
                    var mime = settings.dataType;
                    if (xhr.readyState === 4) {
                        clearTimeout(abortTimeout);
                        var result, error = false;
                        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0&&protocol=='file:') {
                            if (mime === 'application/json' && !(/^\s*$/.test(xhr.responseText))) {
                                try {
                                    result = JSON.parse(xhr.responseText);
                                } catch (e) {
                                    error = e;
                                }
                            } else if (mime === 'application/xml, text/xml') {
                                result = xhr.responseXML;
                            }
                            else if(mime=="text/html"){
                                result=xhr.responseText;
                                $.parseJS(result);
                            }
                            else
                                result = xhr.responseText;
                            //If we're looking at a local file, we assume that no response sent back means there was an error
                            if(xhr.status===0&&result.length===0)
                                error=true;
                            if (error)
                                settings.error.call(context, xhr, 'parsererror', error);
                            else {
                                settings.success.call(context, result, 'success', xhr);
                            }
                        } else {
                            error = true;
                            settings.error.call(context, xhr, 'error');
                        }
                        settings.complete.call(context, xhr, error ? 'error' : 'success');
                    }
                };
                xhr.open(settings.type, settings.url, settings.async);
        if (settings.withCredentials) xhr.withCredentials = true;

                if (settings.contentType)
                    settings.headers['Content-Type'] = settings.contentType;
                for (var name in settings.headers)
                    xhr.setRequestHeader(name, settings.headers[name]);
                if (settings.beforeSend.call(context, xhr, settings) === false) {
                    xhr.abort();
                    return false;
                }

                if (settings.timeout > 0)
                    abortTimeout = setTimeout(function() {
                        xhr.onreadystatechange = empty;
                        xhr.abort();
                        settings.error.call(context, xhr, 'timeout');
                    }, settings.timeout);
                xhr.send(settings.data);
            } catch (e) {
              // General errors (e.g. access denied) should also be sent to the error callback
                console.log(e);
              settings.error.call(context, xhr, 'error', e);
            }
            return xhr;
        };


        /**
        * Shorthand call to an Ajax GET request
            ```
            $.get("mypage.php?foo=bar",function(data){});
            ```

        * @param {String} url to hit
        * @param {Function} success
        * @title $.get(url,success)
        */
        $.get = function(url, success) {
            return this.ajax({
                url: url,
                success: success
            });
        };
        /**
        * Shorthand call to an Ajax POST request
            ```
            $.post("mypage.php",{bar:'bar'},function(data){});
            ```

        * @param {String} url to hit
        * @param {Object} [data] to pass in
        * @param {Function} success
        * @param {String} [dataType]
        * @title $.post(url,[data],success,[dataType])
        */
        $.post = function(url, data, success, dataType) {
            if (typeof (data) === "function") {
                success = data;
                data = {};
            }
            if (dataType === undefined)
                dataType = "html";
            return this.ajax({
                url: url,
                type: "POST",
                data: data,
                dataType: dataType,
                success: success
            });
        };
        /**
        * Shorthand call to an Ajax request that expects a JSON response
            ```
            $.getJSON("mypage.php",{bar:'bar'},function(data){});
            ```

        * @param {String} url to hit
        * @param {Object} [data]
        * @param {Function} [success]
        * @title $.getJSON(url,data,success)
        */
        $.getJSON = function(url, data, success) {
            if (typeof (data) === "function") {
                success = data;
                data = {};
            }
            return this.ajax({
                url: url,
                data: data,
                success: success,
                dataType: "json"
            });
        };

        /**
        * Converts an object into a key/value par with an optional prefix.  Used for converting objects to a query string
            ```
            var obj={
            foo:'foo',
            bar:'bar'
            }
            var kvp=$.param(obj,'data');
            ```

        * @param {Object} object
        * @param {String} [prefix]
        * @return {String} Key/value pair representation
        * @title $.param(object,[prefix];
        */
        $.param = function(obj, prefix) {
            var str = [];
            if (obj instanceof $jqm) {
                obj.each(function() {
                    var k = prefix ? prefix + "[]" : this.id,
                    v = this.value;
                    str.push((k) + "=" + encodeURIComponent(v));
                });
            } else {
                for (var p in obj) {
                    var k = prefix ? prefix + "[" + p + "]" : p,
                    v = obj[p];
                    str.push($.isObject(v) ? $.param(v, k) : (k) + "=" + encodeURIComponent(v));
                }
            }
            return str.join("&");
        };
        /**
        * Used for backwards compatibility.  Uses native JSON.parse function
            ```
            var obj=$.parseJSON("{\"bar\":\"bar\"}");
            ```

        * @params {String} string
        * @return {Object}
        * @title $.parseJSON(string)
        */
        $.parseJSON = function(string) {
            return JSON.parse(string);
        };
        /**
        * Helper function to convert XML into  the DOM node representation
            ```
            var xmlDoc=$.parseXML("<xml><foo>bar</foo></xml>");
            ```

        * @param {String} string
        * @return {Object} DOM nodes
        * @title $.parseXML(string)
        */
        $.parseXML = function(string) {
            return (new DOMParser).parseFromString(string, "text/xml");
        };
        /**
         * Helper function to parse the user agent.  Sets the following
         * .os.webkit
         * .os.android
         * .os.ipad
         * .os.iphone
         * .os.webos
         * .os.touchpad
         * .os.blackberry
         * .os.opera
         * .os.fennec
         * .os.ie
         * .os.ieTouch
         * .os.supportsTouch
         * .os.playbook
         * .feat.nativetouchScroll
         * @api private
         */
        function detectUA($, userAgent) {
            $.os = {};
            $.os.webkit = userAgent.match(/WebKit\/([\d.]+)/) ? true : false;
            $.os.android = userAgent.match(/(Android)\s+([\d.]+)/) || userAgent.match(/Silk-Accelerated/) ? true : false;
      $.os.androidICS = $.os.android && userAgent.match(/(Android)\s4/) ? true : false;
            $.os.ipad = userAgent.match(/(iPad).*OS\s([\d_]+)/) ? true : false;
            $.os.iphone = !$.os.ipad && userAgent.match(/(iPhone\sOS)\s([\d_]+)/) ? true : false;
            $.os.webos = userAgent.match(/(webOS|hpwOS)[\s\/]([\d.]+)/) ? true : false;
            $.os.touchpad = $.os.webos && userAgent.match(/TouchPad/) ? true : false;
            $.os.ios = $.os.ipad || $.os.iphone;
      $.os.playbook = userAgent.match(/PlayBook/) ? true : false;
            $.os.blackberry = $.os.playbook || userAgent.match(/BlackBerry/) ? true : false;
      $.os.blackberry10 = $.os.blackberry && userAgent.match(/Safari\/536/) ? true : false;
            $.os.chrome = userAgent.match(/Chrome/) ? true : false;
      $.os.opera = userAgent.match(/Opera/) ? true : false;
            $.os.fennec = userAgent.match(/fennec/i) ? true :userAgent.match(/Firefox/)?true: false;
            $.os.ie = userAgent.match(/MSIE 10.0/i)?true:false;
            $.os.ieTouch=$.os.ie&&userAgent.toLowerCase().match(/touch/i)?true:false;
            $.os.supportsTouch = ((window.DocumentTouch && document instanceof window.DocumentTouch) || 'ontouchstart' in window);
            //features
            $.feat = {};
            var head=document.documentElement.getElementsByTagName("head")[0];
            $.feat.nativeTouchScroll =  typeof(head.style["-webkit-overflow-scrolling"])!=="undefined"&&$.os.ios;
            $.feat.cssPrefix=$.os.webkit?"Webkit":$.os.fennec?"Moz":$.os.ie?"ms":$.os.opera?"O":"";
            $.feat.cssTransformStart=!$.os.opera?"3d(":"(";
            $.feat.cssTransformEnd=!$.os.opera?",0)":")";
            if($.os.android&&!$.os.webkit)
                $.os.android=false;
        }

        detectUA($, navigator.userAgent);
        $.__detectUA = detectUA; //needed for unit tests
        if (typeof String.prototype.trim !== 'function') {
            /**
             * Helper function for iOS 3.1.3
             */
            String.prototype.trim = function() {
                this.replace(/(\r\n|\n|\r)/gm, "").replace(/^\s+|\s+$/, '');
                return this
            };
        }

        /**
         * Utility function to create a psuedo GUID
           ```
           var id= $.uuid();
           ```
         * @title $.uuid
         */
        $.uuid = function () {
            var S4 = function () {
                return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
            }
            return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
        };

        /**
         * Gets the css matrix, or creates a fake one
           ```
           $.getCssMatrix(domElement)
           ```
           @returns matrix with postion
           */
        $.getCssMatrix=function(ele){
            if(ele==undefined) return window.WebKitCSSMatrix||window.MSCSSMatrix|| {a:0,b:0,c:0,d:0,e:0,f:0};
            try{
                if(window.WebKitCSSMatrix)
                    return new WebKitCSSMatrix(window.getComputedStyle(ele).webkitTransform)
                else if(window.MSCSSMatrix)
                    return new MSCSSMatrix(window.getComputedStyle(ele).transform);
                else {
                    //fake css matrix
                    var mat = window.getComputedStyle(ele)[$.feat.cssPrefix+'Transform'].replace(/[^0-9\-.,]/g, '').split(',');
                    return {a:+mat[0],b:+mat[1],c:+mat[2],d:+mat[3], e: +mat[4], f:+mat[5]};
                }
            }
            catch(e){
                return {a:0,b:0,c:0,d:0,e:0,f:0};
            }
        }


        /**
         Zepto.js events
         @api private
         */

        //The following is modified from Zepto.js / events.js
        //We've removed depricated jQuery events like .live and allow anonymous functions to be removed
        var handlers = {},
        _jqmid = 1;
        /**
         * Gets or sets the expando property on a javascript element
         * Also increments the internal counter for elements;
         * @param {Object} element
         * @return {Int} jqmid
         * @api private
         */
        function jqmid(element) {
            return element._jqmid || (element._jqmid = _jqmid++);
        }
        /**
         * Searches through a local array that keeps track of event handlers for proxying.
         * Since we listen for multiple events, we match up the event, function and selector.
         * This is used to find, execute, remove proxied event functions
         * @param {Object} element
         * @param {String} [event]
         * @param {Function} [function]
         * @param {String|Object|Array} [selector]
         * @return {Function|null} handler function or false if not found
         * @api private
         */
        function findHandlers(element, event, fn, selector) {
            event = parse(event);
            if (event.ns)
                var matcher = matcherFor(event.ns);
            return (handlers[jqmid(element)] || []).filter(function(handler) {
                return handler && (!event.e || handler.e == event.e) && (!event.ns || matcher.test(handler.ns)) && (!fn || handler.fn == fn || (typeof handler.fn === 'function' && typeof fn === 'function' && "" + handler.fn === "" + fn)) && (!selector || handler.sel == selector);
            });
        }
        /**
         * Splits an event name by "." to look for namespaces (e.g touch.click)
         * @param {String} event
         * @return {Object} an object with the event name and namespace
         * @api private
         */
        function parse(event) {
            var parts = ('' + event).split('.');
            return {
                e: parts[0],
                ns: parts.slice(1).sort().join(' ')
            };
        }
        /**
         * Regular expression checker for event namespace checking
         * @param {String} namespace
         * @return {Regex} regular expression
         * @api private
         */
        function matcherFor(ns) {
            return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
        }

        /**
         * Utility function that will loop through events that can be a hash or space delimited and executes the function
         * @param {String|Object} events
         * @param {Function} fn
         * @param {Iterator} [iterator]
         * @api private
         */
        function eachEvent(events, fn, iterator) {
            if ($.isObject(events))
                $.each(events, iterator);
            else
                events.split(/\s/).forEach(function(type) {
                    iterator(type, fn)
                });
        }

        /**
         * Helper function for adding an event and creating the proxy handler function.
         * All event handlers call this to wire event listeners up.  We create proxy handlers so they can be removed then.
         * This is needed for delegate/on
         * @param {Object} element
         * @param {String|Object} events
         * @param {Function} function that will be executed when event triggers
         * @param {String|Array|Object} [selector]
         * @param {Function} [getDelegate]
         * @api private
         */
        function add(element, events, fn, selector, getDelegate) {
            var id = jqmid(element),
            set = (handlers[id] || (handlers[id] = []));
            eachEvent(events, fn, function(event, fn) {
                var delegate = getDelegate && getDelegate(fn, event),
                callback = delegate || fn;
                var proxyfn = function(event) {
                    var result = callback.apply(element, [event].concat(event.data));
                    if (result === false)
                        event.preventDefault();
                    return result;
                };
                var handler = $.extend(parse(event), {
                    fn: fn,
                    proxy: proxyfn,
                    sel: selector,
                    del: delegate,
                    i: set.length
                });
                set.push(handler);
                element.addEventListener(handler.e, proxyfn, false);
            });
            //element=null;
        }

        /**
         * Helper function to remove event listeners.  We look through each event and then the proxy handler array to see if it exists
         * If found, we remove the listener and the entry from the proxy array.  If no function is specified, we remove all listeners that match
         * @param {Object} element
         * @param {String|Object} events
         * @param {Function} [fn]
         * @param {String|Array|Object} [selector]
         * @api private
         */
        function remove(element, events, fn, selector) {

            var id = jqmid(element);
            eachEvent(events || '', fn, function(event, fn) {
                findHandlers(element, event, fn, selector).forEach(function(handler) {
                    delete handlers[id][handler.i];
                    element.removeEventListener(handler.e, handler.proxy, false);
                });
            });
        }

        $.event = {
            add: add,
            remove: remove
        }

        /**
        * Binds an event to each element in the collection and executes the callback
            ```
            $().bind('click',function(){console.log('I clicked '+this.id);});
            ```

        * @param {String|Object} event
        * @param {Function} callback
        * @return {Object} jqMobi object
        * @title $().bind(event,callback)
        */
        $.fn.bind = function(event, callback) {
            for (var i = 0; i < this.length; i++) {
                add(this[i], event, callback);
            }
            return this;
        };
        /**
        * Unbinds an event to each element in the collection.  If a callback is passed in, we remove just that one, otherwise we remove all callbacks for those events
            ```
            $().unbind('click'); //Unbinds all click events
            $().unbind('click',myFunc); //Unbinds myFunc
            ```

        * @param {String|Object} event
        * @param {Function} [callback]
        * @return {Object} jqMobi object
        * @title $().unbind(event,[callback]);
        */
        $.fn.unbind = function(event, callback) {
            for (var i = 0; i < this.length; i++) {
                remove(this[i], event, callback);
            }
            return this;
        };

        /**
        * Binds an event to each element in the collection that will only execute once.  When it executes, we remove the event listener then right away so it no longer happens
            ```
            $().one('click',function(){console.log('I was clicked once');});
            ```

        * @param {String|Object} event
        * @param {Function} [callback]
        * @return jqMobi object
        * @title $().one(event,callback);
        */
        $.fn.one = function(event, callback) {
            return this.each(function(i, element) {
                add(this, event, callback, null, function(fn, type) {
                    return function() {
                        var result = fn.apply(element, arguments);
                        remove(element, type, fn);
                        return result;
                    }
                });
            });
        };

         /**
         * internal variables
         * @api private
         */

        var returnTrue = function() {
            return true
        },
        returnFalse = function() {
            return false
        },
        eventMethods = {
            preventDefault: 'isDefaultPrevented',
            stopImmediatePropagation: 'isImmediatePropagationStopped',
            stopPropagation: 'isPropagationStopped'
        };
        /**
         * Creates a proxy function for event handlers.
     * As "some" browsers dont support event.stopPropagation this call is bypassed if it cant be found on the event object.
         * @param {String} event
         * @return {Function} proxy
         * @api private
         */
        function createProxy(event) {
            var proxy = $.extend({
                originalEvent: event
            }, event);
            $.each(eventMethods, function(name, predicate) {
                proxy[name] = function() {
                    this[predicate] = returnTrue;
          if (name == "stopImmediatePropagation" || name == "stopPropagation"){
            event.cancelBubble = true;
            if(!event[name])
              return;
          }
          return event[name].apply(event, arguments);
                };
                proxy[predicate] = returnFalse;
            })
            return proxy;
        }

        /**
        * Delegate an event based off the selector.  The event will be registered at the parent level, but executes on the selector.
            ```
            $("#div").delegate("p",'click',callback);
            ```

        * @param {String|Array|Object} selector
        * @param {String|Object} event
        * @param {Function} callback
        * @return {Object} jqMobi object
        * @title $().delegate(selector,event,callback)
        */
        $.fn.delegate = function(selector, event, callback) {
            for (var i = 0; i < this.length; i++) {
                var element = this[i];
                add(element, event, callback, selector, function(fn) {
                    return function(e) {
                        var evt, match = $(e.target).closest(selector, element).get(0);
                        if (match) {
                            evt = $.extend(createProxy(e), {
                                currentTarget: match,
                                liveFired: element
                            });
                            return fn.apply(match, [evt].concat([].slice.call(arguments, 1)));
                        }
                    }
                });
            }
            return this;
        };

        /**
        * Unbinds events that were registered through delegate.  It acts upon the selector and event.  If a callback is specified, it will remove that one, otherwise it removes all of them.
            ```
            $("#div").undelegate("p",'click',callback);//Undelegates callback for the click event
            $("#div").undelegate("p",'click');//Undelegates all click events
            ```

        * @param {String|Array|Object} selector
        * @param {String|Object} event
        * @param {Function} callback
        * @return {Object} jqMobi object
        * @title $().undelegate(selector,event,[callback]);
        */
        $.fn.undelegate = function(selector, event, callback) {
            for (var i = 0; i < this.length; i++) {
                remove(this[i], event, callback, selector);
            }
            return this;
        }

        /**
        * Similar to delegate, but the function parameter order is easier to understand.
        * If selector is undefined or a function, we just call .bind, otherwise we use .delegate
            ```
            $("#div").on("click","p",callback);
            ```

        * @param {String|Array|Object} selector
        * @param {String|Object} event
        * @param {Function} callback
        * @return {Object} jqMobi object
        * @title $().on(event,selector,callback);
        */
        $.fn.on = function(event, selector, callback) {
            return selector === undefined || $.isFunction(selector) ? this.bind(event, selector) : this.delegate(selector, event, callback);
        };
        /**
        * Removes event listeners for .on()
        * If selector is undefined or a function, we call unbind, otherwise it's undelegate
            ```
            $().off("click","p",callback); //Remove callback function for click events
            $().off("click","p") //Remove all click events
            ```

        * @param {String|Object} event
        * @param {String|Array|Object} selector
        * @param {Sunction} callback
        * @return {Object} jqMobi object
        * @title $().off(event,selector,[callback])
        */
        $.fn.off = function(event, selector, callback) {
            return selector === undefined || $.isFunction(selector) ? this.unbind(event, selector) : this.undelegate(selector, event, callback);
        };

        /**
        This triggers an event to be dispatched.  Usefull for emulating events, etc.
        ```
        $().trigger("click",{foo:'bar'});//Trigger the click event and pass in data
        ```

        * @param {String|Object} event
        * @param {Object} [data]
        * @return {Object} jqMobi object
        * @title $().trigger(event,data);
        */
        $.fn.trigger = function(event, data, props) {
            if (typeof event == 'string')
                event = $.Event(event, props);
            event.data = data;
            for (var i = 0; i < this.length; i++) {
                this[i].dispatchEvent(event)
            }
            return this;
        };

        /**
         * Creates a custom event to be used internally.
         * @param {String} type
         * @param {Object} [properties]
         * @return {event} a custom event that can then be dispatched
         * @title $.Event(type,props);
         */

        $.Event = function(type, props) {
            var event = document.createEvent('Events'),
            bubbles = true;
            if (props)
                for (var name in props)
                    (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name]);
            event.initEvent(type, bubbles, true, null, null, null, null, null, null, null, null, null, null, null, null);
            return event;
        };

        /* The following are for events on objects */
    /**
         * Bind an event to an object instead of a DOM Node
           ```
           $.bind(this,'event',function(){});
           ```
         * @param {Object} object
         * @param {String} event name
         * @param {Function} function to execute
         * @title $.bind(object,event,function);
         */
    $.bind = function(obj, ev, f){
      if(!obj.__events) obj.__events = {};
      if(!$.isArray(ev)) ev = [ev];
      for(var i=0; i<ev.length; i++){
        if(!obj.__events[ev[i]]) obj.__events[ev[i]] = [];
        obj.__events[ev[i]].push(f);
      }
    };

        /**
         * Trigger an event to an object instead of a DOM Node
           ```
           $.trigger(this,'event',arguments);
           ```
         * @param {Object} object
         * @param {String} event name
         * @param {Array} arguments
         * @title $.trigger(object,event,argments);
         */
    $.trigger = function(obj, ev, args){
      var ret = true;
      if(!obj.__events) return ret;
      if(!$.isArray(ev)) ev = [ev];
      if(!$.isArray(args)) args = [];
      for(var i=0; i<ev.length; i++){
        if(obj.__events[ev[i]]){
          var evts = obj.__events[ev[i]];
          for(var j = 0; j<evts.length; j++)
            if($.isFunction(evts[j]) && evts[j].apply(obj, args)===false)
              ret = false;
        }
      }
      return ret;
    };
        /**
         * Unbind an event to an object instead of a DOM Node
           ```
           $.unbind(this,'event',function(){});
           ```
         * @param {Object} object
         * @param {String} event name
         * @param {Function} function to execute
         * @title $.unbind(object,event,function);
         */
        $.unbind = function(obj, ev, f){
      if(!obj.__events) return;
      if(!$.isArray(ev)) ev = [ev];
      for(var i=0; i<ev.length; i++){
        if(obj.__events[ev[i]]){
          var evts = obj.__events[ev[i]];
          for(var j = 0; j<evts.length; j++){
                        if(f==undefined)
                            delete evts[j];
            if(evts[j]==f) {
              evts.splice(j,1);
              break;
            }
          }
        }
      }
    };


        /**
         * Creates a proxy function so you can change the 'this' context in the function
     * Update: now also allows multiple argument call or for you to pass your own arguments
         ```
            var newObj={foo:bar}
            $("#main").bind("click",$.proxy(function(evt){console.log(this)},newObj);

      or

      ( $.proxy(function(foo, bar){console.log(this+foo+bar)}, newObj) )('foo', 'bar');

      or

      ( $.proxy(function(foo, bar){console.log(this+foo+bar)}, newObj, ['foo', 'bar']) )();
         ```

         * @param {Function} Callback
         * @param {Object} Context
         * @title $.proxy(callback,context);
         */
    $.proxy=function(f, c, args){
            return function(){
        if(args) return f.apply(c, args); //use provided arguments
                return f.apply(c, arguments); //use scope function call arguments
            }
    }


         /**
         * Removes listeners on a div and its children recursively
            ```
             cleanUpNode(node,kill)
            ```
         * @param {HTMLDivElement} the element to clean up recursively
         * @api private
         */
    function cleanUpNode(node, kill){
      //kill it before it lays eggs!
      if(kill && node.dispatchEvent){
              var e = $.Event('destroy', {bubbles:false});
              node.dispatchEvent(e);
      }
      //cleanup itself
            var id = jqmid(node);
            if(id && handlers[id]){
          for(var key in handlers[id])
              node.removeEventListener(handlers[id][key].e, handlers[id][key].proxy, false);
              delete handlers[id];
            }
    }
    function cleanUpContent(node, kill){
            if(!node) return;
      //cleanup children
            var children = node.childNodes;
            if(children && children.length > 0)
                for(var child in children)
                    cleanUpContent(children[child], kill);

      cleanUpNode(node, kill);
    }
    var cleanUpAsap = function(els, kill){
          for(var i=0;i<els.length;i++){
              cleanUpContent(els[i], kill);
            }
    }

        /**
         * Function to clean up node content to prevent memory leaks
           ```
           $.cleanUpContent(node,itself,kill)
           ```
         * @param {HTMLNode} node
         * @param {Bool} kill itself
         * @param {kill} Kill nodes
         * @title $.cleanUpContent(node,itself,kill)
         */
        $.cleanUpContent = function(node, itself, kill){
            if(!node) return;
      //cleanup children
            var cn = node.childNodes;
            if(cn && cn.length > 0){
        //destroy everything in a few ms to avoid memory leaks
        //remove them all and copy objs into new array
        $.asap(cleanUpAsap, {}, [slice.apply(cn, [0]), kill]);
            }
      //cleanUp this node
      if(itself) cleanUpNode(node, kill);
        }

        // Like setTimeout(fn, 0); but much faster
    var timeouts = [];
    var contexts = [];
    var params = [];
        /**
         * This adds a command to execute in the JS stack, but is faster then setTimeout
           ```
           $.asap(function,context,args)
           ```
         * @param {Function} function
         * @param {Object} context
         * @param {Array} arguments
         */
        $.asap = function(fn, context, args) {
      if(!$.isFunction(fn)) throw "$.asap - argument is not a valid function";
            timeouts.push(fn);
      contexts.push(context?context:{});
      params.push(args?args:[]);
      //post a message to ourselves so we know we have to execute a function from the stack
            window.postMessage("jqm-asap", "*");
        }
    window.addEventListener("message", function(event) {
            if (event.source == window && event.data == "jqm-asap") {
                event.stopPropagation();
                if (timeouts.length > 0) {  //just in case...
                    (timeouts.shift()).apply(contexts.shift(), params.shift());
                }
            }
        }, true);

        /**
         * this function executes javascript in HTML.
           ```
           $.parseJS(content)
           ```
        * @param {String|DOM} content
        * @title $.parseJS(content);
        */
        var remoteJSPages={};
        $.parseJS= function(div) {
            if (!div)
                return;
            if(typeof(div)=="string"){
                var elem=document.createElement("div");
                elem.innerHTML=div;
                div=elem;
            }
            var scripts = div.getElementsByTagName("script");
            div = null;
            for (var i = 0; i < scripts.length; i++) {
                if (scripts[i].src.length > 0 && !remoteJSPages[scripts[i].src]) {
                    var doc = document.createElement("script");
                    doc.type = scripts[i].type;
                    doc.src = scripts[i].src;
                    document.getElementsByTagName('head')[0].appendChild(doc);
                    remoteJSPages[scripts[i].src] = 1;
                    doc = null;
                } else {
                    window.eval(scripts[i].innerHTML);
                }
            }
        };


        /**
        //custom events since people want to do $().click instead of $().bind("click")
        */

        ["click","keydown","keyup","keypress","submit","load","resize","change","select","error"].forEach(function(event){
            $.fn[event]=function(cb){
                return cb?this.bind(event,cb):this.trigger(event);
            }
        });
         /**
         * End of APIS
         * @api private
         */
        return $;

    })(window);
    '$' in window || (window.$ = jq);
    //Helper function used in jq.mobi.plugins.
    if (!window.numOnly) {
        window.numOnly = function numOnly(val) {
      if (val===undefined || val==='') return 0;
      if ( isNaN( parseFloat(val) ) ){
        if(val.replace){
          val = val.replace(/[^0-9.-]/, "");
        } else return 0;
      }
            return parseFloat(val);
        }
    }
}




/*
 * ----------------------------------------------
 *    ./assets/javascripts/master/FastClick.js
 * ----------------------------------------------
 */

/**
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 0.4.7
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */

/*jslint browser:true, node:true*/
/*global define, Event, Node*/


/**
 * Instantiate fast-clicking listeners on the specificed layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 */
function FastClick(layer) {
  'use strict';
  var oldOnClick, self = this;


  /**
   * Whether a click is currently being tracked.
   *
   * @type boolean
   */
  this.trackingClick = false;


  /**
   * Timestamp for when when click tracking started.
   *
   * @type number
   */
  this.trackingClickStart = 0;


  /**
   * The element being tracked for a click.
   *
   * @type EventTarget
   */
  this.targetElement = null;


  /**
   * X-coordinate of touch start event.
   *
   * @type number
   */
  this.touchStartX = 0;


  /**
   * Y-coordinate of touch start event.
   *
   * @type number
   */
  this.touchStartY = 0;


  /**
   * ID of the last touch, retrieved from Touch.identifier.
   *
   * @type number
   */
  this.lastTouchIdentifier = 0;


  /**
   * The FastClick layer.
   *
   * @type Element
   */
  this.layer = layer;

  if (!layer || !layer.nodeType) {
    throw new TypeError('Layer must be a document node');
  }

  /** @type function() */
  this.onClick = function() {
    FastClick.prototype.onClick.apply(self, arguments);
  };

  /** @type function() */
  this.onTouchStart = function() {
    FastClick.prototype.onTouchStart.apply(self, arguments);
  };

  /** @type function() */
  this.onTouchMove = function() {
    FastClick.prototype.onTouchMove.apply(self, arguments);
  };

  /** @type function() */
  this.onTouchEnd = function() {
    FastClick.prototype.onTouchEnd.apply(self, arguments);
  };

  /** @type function() */
  this.onTouchCancel = function() {
    FastClick.prototype.onTouchCancel.apply(self, arguments);
  };

  // Devices that don't support touch don't need FastClick
  if (typeof window.ontouchstart === 'undefined') {
    return;
  }

  // Set up event handlers as required
  layer.addEventListener('click', this.onClick, true);
  layer.addEventListener('touchstart', this.onTouchStart, false);
  layer.addEventListener('touchmove', this.onTouchMove, false);
  layer.addEventListener('touchend', this.onTouchEnd, false);
  layer.addEventListener('touchcancel', this.onTouchCancel, false);

  // Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
  // which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
  // layer when they are cancelled.
  if (!Event.prototype.stopImmediatePropagation) {
    layer.removeEventListener = function(type, callback, capture) {
      var rmv = Node.prototype.removeEventListener;
      if (type === 'click') {
        rmv.call(layer, type, callback.hijacked || callback, capture);
      } else {
        rmv.call(layer, type, callback, capture);
      }
    };

    layer.addEventListener = function(type, callback, capture) {
      var adv = Node.prototype.addEventListener;
      if (type === 'click') {
        adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
          if (!event.propagationStopped) {
            callback(event);
          }
        }), capture);
      } else {
        adv.call(layer, type, callback, capture);
      }
    };
  }

  // If a handler is already declared in the element's onclick attribute, it will be fired before
  // FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
  // adding it as listener.
  if (typeof layer.onclick === 'function') {

    // Android browser on at least 3.2 requires a new reference to the function in layer.onclick
    // - the old one won't work if passed to addEventListener directly.
    oldOnClick = layer.onclick;
    layer.addEventListener('click', function(event) {
      oldOnClick(event);
    }, false);
    layer.onclick = null;
  }
}


/**
 * Android requires an exception for labels.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires an exception for alert confirm dialogs.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
  'use strict';
  switch (target.nodeName.toLowerCase()) {
  case 'label':
  case 'video':
    return true;
  default:
    return (/\bneedsclick\b/).test(target.className);
  }
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
  'use strict';
  switch (target.nodeName.toLowerCase()) {
  case 'textarea':
  case 'select':
    return true;
  case 'input':
    switch (target.type) {
    case 'button':
    case 'checkbox':
    case 'file':
    case 'image':
    case 'radio':
    case 'submit':
      return false;
    }
    return true;
  default:
    return (/\bneedsfocus\b/).test(target.className);
  }
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
  'use strict';
  var clickEvent, touch;

  // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
  if (document.activeElement && document.activeElement !== targetElement) {
    document.activeElement.blur();
  }

  touch = event.changedTouches[0];

  // Synthesise a click event, with an extra attribute so it can be tracked
  clickEvent = document.createEvent('MouseEvents');
  clickEvent.initMouseEvent('click', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
  clickEvent.forwardedTouchEvent = true;
  targetElement.dispatchEvent(clickEvent);
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
  'use strict';
  var touch = event.targetTouches[0];

  this.trackingClick = true;
  this.trackingClickStart = event.timeStamp;
  this.targetElement = event.target;

  this.touchStartX = touch.pageX;
  this.touchStartY = touch.pageY;

  // Prevent phantom clicks on fast double-tap (issue #36)
  if ((event.timeStamp - this.lastClickTime) < 200) {
    event.preventDefault();
  }

  return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
  'use strict';
  var touch = event.targetTouches[0];

  if (Math.abs(touch.pageX - this.touchStartX) > 10 || Math.abs(touch.pageY - this.touchStartY) > 10) {
    return true;
  }

  return false;
};


/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchMove = function(event) {
  'use strict';
  if (!this.trackingClick) {
    return true;
  }

  // If the touch has moved, cancel the click tracking
  if (this.targetElement !== event.target || this.touchHasMoved(event)) {
    this.trackingClick = false;
    this.targetElement = null;
  }

  return true;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
  'use strict';

  // Fast path for newer browsers supporting the HTML5 control attribute
  if (labelElement.control !== undefined) {
    return labelElement.control;
  }

  // All browsers under test that support touch events also support the HTML5 htmlFor attribute
  if (labelElement.htmlFor) {
    return document.getElementById(labelElement.htmlFor);
  }

  // If no for attribute exists, attempt to retrieve the first labellable descendant element
  // the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
  return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
  'use strict';
  var forElement, trackingClickStart, targetTagName, targetElement = this.targetElement,
    touch = event.changedTouches[0];

  if (!this.trackingClick) {
    return true;
  }

  // Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
  // when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
  // with the same identifier as the touch event that previously triggered the click that triggered the alert.
  if (this.deviceIsIOS) {
    if (touch.identifier === this.lastTouchIdentifier) {
      event.preventDefault();
      return false;
    }

    this.lastTouchIdentifier = touch.identifier;
  }

  // Prevent phantom clicks on fast double-tap (issue #36)
  if ((event.timeStamp - this.lastClickTime) < 200) {
    this.cancelNextClick = true;
    return true;
  }

  this.lastClickTime = event.timeStamp;

  trackingClickStart = this.trackingClickStart;
  this.trackingClick = false;
  this.trackingClickStart = 0;

  targetTagName = targetElement.tagName.toLowerCase();
  if (targetTagName === 'label') {
    forElement = this.findControl(targetElement);
    if (forElement) {
      targetElement.focus();
      if (this.deviceIsAndroid) {
        return false;
      }

      if (!this.needsClick(forElement)) {
        event.preventDefault();
        this.sendClick(forElement, event);
      }

      return false;
    }
  } else if (this.needsFocus(targetElement)) {

    // Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
    // Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
    if ((event.timeStamp - trackingClickStart) > 100 || (this.deviceIsIOS && window.top !== window && targetTagName === 'input')) {
      this.targetElement = null;
      return false;
    }

    targetElement.focus();

    // Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
    if (!this.deviceIsIOS4 || targetTagName !== 'select') {
      this.targetElement = null;
      event.preventDefault();
    }

    return false;
  }

  // Prevent the actual click from going though - unless the target node is marked as requiring
  // real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
  if (!this.needsClick(targetElement)) {
    event.preventDefault();
    this.sendClick(targetElement, event);
  }

  return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
  'use strict';
  this.trackingClick = false;
  this.targetElement = null;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
  'use strict';
  var oldTargetElement;

  // If a target element was never set (because a touch event was never fired) allow the click
  if (!this.targetElement) {
    return true;
  }

  if (event.forwardedTouchEvent) {
    return true;
  }

  oldTargetElement = this.targetElement;
  this.targetElement = null;

  // It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
  if (this.trackingClick) {
    this.trackingClick = false;
    return true;
  }

  // Programmatically generated events targeting a specific element should be permitted
  if (!event.cancelable) {
    return true;
  }

  // Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
  if (event.target.type === 'submit' && event.detail === 0) {
    return true;
  }

  // Derive and check the target element to see whether the click needs to be permitted;
  // unless explicitly enabled, prevent non-touch click events from triggering actions,
  // to prevent ghost/doubleclicks.
  if (!this.needsClick(oldTargetElement) || this.cancelNextClick) {
    this.cancelNextClick = false;

    // Prevent any user-added listeners declared on FastClick element from being fired.
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    } else {

      // Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
      event.propagationStopped = true;
    }

    // Cancel the event
    event.stopPropagation();
    event.preventDefault();

    return false;
  }

  // If clicks are permitted, return true for the action to go through.
  return true;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
  'use strict';
  var layer = this.layer;

  layer.removeEventListener('click', this.onClick, true);
  layer.removeEventListener('touchstart', this.onTouchStart, false);
  layer.removeEventListener('touchmove', this.onTouchMove, false);
  layer.removeEventListener('touchend', this.onTouchEnd, false);
  layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


if (typeof define !== 'undefined' && define.amd) {

  // AMD. Register as an anonymous module.
  define(function() {
    'use strict';
    return FastClick;
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = function(layer) {
    'use strict';
    return new FastClick(layer);
  };

  module.exports.FastClick = FastClick;
}



/*
 * -------------------------------------------
 *    ./assets/javascripts/master/Global.js
 * -------------------------------------------
 */

// Static class for handling globa/common methods and variables
var Global = create(function() {

  /*** Settings ***/

  this.set({
    Language: {
      country      : 'Denmark',
      languageCode : 'da',
      countryCode  : 'dk',
      days         : ['Søndag','Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag'],
      months       : ['Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December']
    }
  });


  /*** Private ***/

  var that = this;


  /*** Public ***/

  this.Date = {
    seconds: function(ms) {
      return ms/1000;
    },
    minutes: function(ms) {
      return this.seconds(ms)/60;
    },
    hours: function(ms) {
      return this.minutes(ms)/60;
    },
    days: function(ms) {
      return this.hours(ms)/24;
    },
    getDayName: function(date, lowercase) {
      var pos = date.getDay();
      var day = that.Language.days[pos];
      if(lowercase) day = day.toLowerCase();
      return day;
    },
    getShortDayName: function(date, lowercase) {
      return this.getDayName(date, lowercase).substr(0, 3);
    },
    getMonthName: function(date, lowercase) {
      var pos = date.getMonth();
      var month = that.Language.months[pos];
      if(lowercase) month = month.toLowerCase();
      return month;
    },
    getShortMonthName: function(date, lowercase) {
      return this.getMonthName(date, lowercase).substr(0, 3);
    },
    format: function(date, format) {
      // Format date to string using standart string date format: http://msdn.microsoft.com/en-us/library/8kb3ddd4.aspx
      if(!format) return date.toString();

      // Year
      var year = date.getFullYear();
      format = format.replace(/yyyy/g, year);
      format = format.replace(/yy/g, year.toString().substr(-2));

      // Month
      var month = date.getMonth();
      format = format.replace(/MMMM/g, this.getMonthName(date));
      format = format.replace(/MMM/g, this.getShortMonthName(date));
      format = (month > 8) ? format.replace(/MM/g, 'M') : format.replace(/MM/g, '0M');
      format = format.replace(/M/g, month + 1);

      // Day
      format = format.replace(/dddd/g, this.getDayName(date));
      format = format.replace(/ddd/g, this.getShortDayName(date));

      // Date
      var day = date.getDate();
      format = (day > 9) ? format.replace(/dd/g, 'd') : format.replace(/dd/g, '0d');
      format = format.replace(/d/g, day);

      // Hours
      var hours = date.getHours();
      format = (hours > 9) ? format.replace(/HH/g, 'H') : format.replace(/HH/g, '0H');
      format = format.replace(/H/g, hours);
      format = (hours % 12 > 9) ? format.replace(/hh/g, 'h') : format.replace(/hh/g, '0h');
      format = format.replace(/h/g, hours % 12);

      // Minutes
      var minutes = date.getMinutes();
      format = (minutes > 9) ? format.replace(/mm/g, 'm') : format.replace(/mm/g, '0m');
      format = format.replace(/m/g, minutes);

      return format;

    }
  };

  this.Distance = {
    round: function(km) {
      var formattedDistance;
      if(km <= 0.9) {
        formattedDistance = Math.ceil(km * 10) * 100 + ' m';
      } else if(km <= 1.9) {
        formattedDistance = Math.ceil(km * 10) / 10 + ' km';
      } else if(km <= 4.5) {
        formattedDistance = Math.ceil(km * 2) / 2 + ' km';
      } else if(km <= 14) {
        formattedDistance = Math.ceil(km) + ' km';
      } else if(km <= 45) {
        formattedDistance = Math.ceil(km / 5) * 5 + ' km';
      } else {
        formattedDistance = Math.ceil(km / 10) * 10 + ' km';
      }
      return formattedDistance;
    }
  };

  this.Cookie = {
    set: function(name, value, days) {
      var expires;
      if(days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
      } else {
        expires = "";
      }
      document.cookie = name + "=" + value + expires + "; path=/";
    },
    get: function(name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while(c.charAt(0) == ' ') c = c.substring(1, c.length);
        if(c.indexOf(nameEQ) === 0) {
          return c.substring(nameEQ.length, c.length);
        }
      }
      return null;
    },
    'delete': function(name) {
      this.set(name, "", -1);
    }
  };

  this.String = {
    stripTags: function(html) {
      var tmp = document.createElement("div");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText;
    }
  };

  this.Style = {
    getPrefix: function(propName) {
      var style = document.documentElement.style,
        prefixes = 'Moz Webkit O Ms'.split(' '),
        prefixed;

      // test standard property first
      if(typeof style[propName] === 'string') return propName;

      // capitalize
      propName = propName.charAt(0).toUpperCase() + propName.slice(1);

      // test vendor specific properties
      for(var i = 0, len = prefixes.length; i < len; i++) {
        prefixed = prefixes[i] + propName;
        if(typeof style[prefixed] === 'string') return prefixed;
      }
    },
    set: function(el, propName, val) {
      var prefix = this.getPrefix(propName);
      if (propName && el.style[prefix] !== undefined) {
        el.style[prefix] = val;
        return true;
      }
      return false;
    }
  };

});



/*
 * ----------------------------------------
 *    ./assets/javascripts/master/MBP.js
 * ----------------------------------------
 */

/**
 * MBP - Mobile boilerplate helper functions
 */

(function(document) {

    window.MBP = window.MBP || {};

    /**
     * Fix for iPhone viewport scale bug
     * http://www.blog.highub.com/mobile-2/a-fix-for-iphone-viewport-scale-bug/
     */

    MBP.viewportmeta = document.querySelector && document.querySelector('meta[name="viewport"]');
    MBP.ua = navigator.userAgent;

    MBP.scaleFix = function() {
        if (MBP.viewportmeta && /iPhone|iPad|iPod/.test(MBP.ua) && !/Opera Mini/.test(MBP.ua)) {
            MBP.viewportmeta.content = 'width=device-width, minimum-scale=1.0, maximum-scale=1.0';
            document.addEventListener('gesturestart', MBP.gestureStart, false);
        }
    };

    MBP.gestureStart = function() {
        MBP.viewportmeta.content = 'width=device-width, minimum-scale=0.25, maximum-scale=1.6';
    };

    /**
     * Normalized hide address bar for iOS & Android
     * (c) Scott Jehl, scottjehl.com
     * MIT License
     */

    // If we split this up into two functions we can reuse
    // this function if we aren't doing full page reloads.

    // If we cache this we don't need to re-calibrate everytime we call
    // the hide url bar
    MBP.BODY_SCROLL_TOP = false;

    // So we don't redefine this function everytime we
    // we call hideUrlBar
    MBP.getScrollTop = function() {
        var win = window;
        var doc = document;

        return win.pageYOffset || doc.compatMode === 'CSS1Compat' && doc.documentElement.scrollTop || doc.body.scrollTop || 0;
    };

    // It should be up to the mobile
    MBP.hideUrlBar = function() {
        var win = window;

        // if there is a hash, or MBP.BODY_SCROLL_TOP hasn't been set yet, wait till that happens
        if (!location.hash && MBP.BODY_SCROLL_TOP !== false) {
            win.scrollTo( 0, MBP.BODY_SCROLL_TOP === 1 ? 0 : 1 );
        }
    };

    MBP.hideUrlBarOnLoad = function() {
        var win = window;
        var doc = win.document;
        var bodycheck;

        // If there's a hash, or addEventListener is undefined, stop here
        if ( !location.hash && win.addEventListener ) {

            // scroll to 1
            window.scrollTo( 0, 1 );
            MBP.BODY_SCROLL_TOP = 1;

            // reset to 0 on bodyready, if needed
            bodycheck = setInterval(function() {
                if ( doc.body ) {
                    clearInterval( bodycheck );
                    MBP.BODY_SCROLL_TOP = MBP.getScrollTop();
                    MBP.hideUrlBar();
                }
            }, 15 );

            win.addEventListener('load', function() {
                setTimeout(function() {
                    // at load, if user hasn't scrolled more than 20 or so...
                    if (MBP.getScrollTop() < 20) {
                        // reset to hide addr bar at onload
                        MBP.hideUrlBar();
                    }
                }, 0);
            });
        }
    };

    // /**
    //  * Fast Buttons - read wiki below before using
    //  * https://github.com/h5bp/mobile-boilerplate/wiki/JavaScript-Helper
    //  */

    // MBP.fastButton = function(element, handler, pressedClass) {
    //     this.handler = handler;
    //     // styling of .pressed is defined in the project's CSS files
    //     this.pressedClass = typeof pressedClass === 'undefined' ? 'pressed' : pressedClass;

    //     if (element.length && element.length > 1) {
    //         for (var singleElIdx in element) {
    //             this.addClickEvent(element[singleElIdx]);
    //         }
    //     } else {
    //         this.addClickEvent(element);
    //     }
    // };

    // MBP.fastButton.prototype.handleEvent = function(event) {
    //     event = event || window.event;

    //     switch (event.type) {
    //         case 'touchstart': this.onTouchStart(event); break;
    //         case 'touchmove': this.onTouchMove(event); break;
    //         case 'touchend': this.onClick(event); break;
    //         case 'click': this.onClick(event); break;
    //     }
    // };

    // MBP.fastButton.prototype.onTouchStart = function(event) {
    //     var element = event.target || event.srcElement;
    //     event.stopPropagation();
    //     element.addEventListener('touchend', this, false);
    //     document.body.addEventListener('touchmove', this, false);
    //     this.startX = event.touches[0].clientX;
    //     this.startY = event.touches[0].clientY;

    //     element.className+= ' ' + this.pressedClass;
    // };

    // MBP.fastButton.prototype.onTouchMove = function(event) {
    //     if (Math.abs(event.touches[0].clientX - this.startX) > 10 ||
    //         Math.abs(event.touches[0].clientY - this.startY) > 10) {
    //         this.reset(event);
    //     }
    // };

    // MBP.fastButton.prototype.onClick = function(event) {
    //     event = event || window.event;
    //     var element = event.target || event.srcElement;
    //     if (event.stopPropagation) {
    //         event.stopPropagation();
    //     }
    //     this.reset(event);
    //     this.handler.apply(event.currentTarget, [event]);
    //     if (event.type == 'touchend') {
    //         MBP.preventGhostClick(this.startX, this.startY);
    //     }
    //     var pattern = new RegExp(' ?' + this.pressedClass, 'gi');
    //     element.className = element.className.replace(pattern, '');
    // };

    // MBP.fastButton.prototype.reset = function(event) {
    //     var element = event.target || event.srcElement;
    //     rmEvt(element, 'touchend', this, false);
    //     rmEvt(document.body, 'touchmove', this, false);

    //     var pattern = new RegExp(' ?' + this.pressedClass, 'gi');
    //     element.className = element.className.replace(pattern, '');
    // };

    // MBP.fastButton.prototype.addClickEvent = function(element) {
    //     addEvt(element, 'touchstart', this, false);
    //     addEvt(element, 'click', this, false);
    // };

    // MBP.preventGhostClick = function(x, y) {
    //     MBP.coords.push(x, y);
    //     window.setTimeout(function() {
    //         MBP.coords.splice(0, 2);
    //     }, 2500);
    // };

    // MBP.ghostClickHandler = function(event) {
    //     if (!MBP.hadTouchEvent && MBP.dodgyAndroid) {
    //         // This is a bit of fun for Android 2.3...
    //         // If you change window.location via fastButton, a click event will fire
    //         // on the new page, as if the events are continuing from the previous page.
    //         // We pick that event up here, but MBP.coords is empty, because it's a new page,
    //         // so we don't prevent it. Here's we're assuming that click events on touch devices
    //         // that occur without a preceding touchStart are to be ignored.
    //         event.stopPropagation();
    //         event.preventDefault();
    //         return;
    //     }
    //     for (var i = 0, len = MBP.coords.length; i < len; i += 2) {
    //         var x = MBP.coords[i];
    //         var y = MBP.coords[i + 1];
    //         if (Math.abs(event.clientX - x) < 25 && Math.abs(event.clientY - y) < 25) {
    //             event.stopPropagation();
    //             event.preventDefault();
    //         }
    //     }
    // };

    // // This bug only affects touch Android 2.3 devices, but a simple ontouchstart test creates a false positive on
    // // some Blackberry devices. https://github.com/Modernizr/Modernizr/issues/372
    // // The browser sniffing is to avoid the Blackberry case. Bah
    // MBP.dodgyAndroid = ('ontouchstart' in window) && (navigator.userAgent.indexOf('Android 2.3') != -1);

    // if (document.addEventListener) {
    //     document.addEventListener('click', MBP.ghostClickHandler, true);
    // }

    // addEvt(document.documentElement, 'touchstart', function() {
    //     MBP.hadTouchEvent = true;
    // }, false);

    // MBP.coords = [];

    // // fn arg can be an object or a function, thanks to handleEvent
    // // read more about the explanation at: http://www.thecssninja.com/javascript/handleevent
    // function addEvt(el, evt, fn, bubble) {
    //     if ('addEventListener' in el) {
    //         // BBOS6 doesn't support handleEvent, catch and polyfill
    //         try {
    //             el.addEventListener(evt, fn, bubble);
    //         } catch(e) {
    //             if (typeof fn == 'object' && fn.handleEvent) {
    //                 el.addEventListener(evt, function(e){
    //                     // Bind fn as this and set first arg as event object
    //                     fn.handleEvent.call(fn,e);
    //                 }, bubble);
    //             } else {
    //                 throw e;
    //             }
    //         }
    //     } else if ('attachEvent' in el) {
    //         // check if the callback is an object and contains handleEvent
    //         if (typeof fn == 'object' && fn.handleEvent) {
    //             el.attachEvent('on' + evt, function(){
    //                 // Bind fn as this
    //                 fn.handleEvent.call(fn);
    //             });
    //         } else {
    //             el.attachEvent('on' + evt, fn);
    //         }
    //     }
    // }

    // function rmEvt(el, evt, fn, bubble) {
    //     if ('removeEventListener' in el) {
    //         // BBOS6 doesn't support handleEvent, catch and polyfill
    //         try {
    //             el.removeEventListener(evt, fn, bubble);
    //         } catch(e) {
    //             if (typeof fn == 'object' && fn.handleEvent) {
    //                 el.removeEventListener(evt, function(e){
    //                     // Bind fn as this and set first arg as event object
    //                     fn.handleEvent.call(fn,e);
    //                 }, bubble);
    //             } else {
    //                 throw e;
    //             }
    //         }
    //     } else if ('detachEvent' in el) {
    //         // check if the callback is an object and contains handleEvent
    //         if (typeof fn == 'object' && fn.handleEvent) {
    //             el.detachEvent("on" + evt, function() {
    //                 // Bind fn as this
    //                 fn.handleEvent.call(fn);
    //             });
    //         } else {
    //             el.detachEvent('on' + evt, fn);
    //         }
    //     }
    // }

    // /**
    //  * Autogrow
    //  * http://googlecode.blogspot.com/2009/07/gmail-for-mobile-html5-series.html
    //  */

    // MBP.autogrow = function(element, lh) {
    //     function handler(e) {
    //         var newHeight = this.scrollHeight;
    //         var currentHeight = this.clientHeight;
    //         if (newHeight > currentHeight) {
    //             this.style.height = newHeight + 3 * textLineHeight + 'px';
    //         }
    //     }

    //     var setLineHeight = (lh) ? lh : 12;
    //     var textLineHeight = element.currentStyle ? element.currentStyle.lineHeight : getComputedStyle(element, null).lineHeight;

    //     textLineHeight = (textLineHeight.indexOf('px') == -1) ? setLineHeight : parseInt(textLineHeight, 10);

    //     element.style.overflow = 'hidden';
    //     element.addEventListener ? element.addEventListener('input', handler, false) : element.attachEvent('onpropertychange', handler);
    // };

    /**
     * Enable CSS active pseudo styles in Mobile Safari
     * http://alxgbsn.co.uk/2011/10/17/enable-css-active-pseudo-styles-in-mobile-safari/
     */

    MBP.enableActive = function() {
        document.addEventListener('touchstart', function() {}, false);
    };

    /**
     * Prevent default scrolling on document window
     */

    MBP.preventScrolling = function() {
        document.addEventListener('touchmove', function(e) {
            if (e.target.type === 'range') { return; }
            e.preventDefault();
        }, false);
    };

    /**
     * Prevent iOS from zooming onfocus
     * https://github.com/h5bp/mobile-boilerplate/pull/108
     * Adapted from original jQuery code here: http://nerd.vasilis.nl/prevent-ios-from-zooming-onfocus/
     */

    MBP.preventZoom = function() {
        var formFields = document.querySelectorAll('input, select, textarea');
        var contentString = 'width=device-width,initial-scale=1,maximum-scale=';
        var i = 0;

        for (i = 0; i < formFields.length; i++) {
            formFields[i].onfocus = function() {
                MBP.viewportmeta.content = contentString + '1';
            };
            formFields[i].onblur = function() {
                MBP.viewportmeta.content = contentString + '10';
            };
        }
    };

    // /**
    //  * iOS Startup Image helper
    //  */

    // MBP.startupImage = function() {
    //     var portrait;
    //     var landscape;
    //     var pixelRatio;
    //     var head;
    //     var link1;
    //     var link2;

    //     pixelRatio = window.devicePixelRatio;
    //     head = document.getElementsByTagName('head')[0];

    //     if (navigator.platform === 'iPad') {
    //         portrait = pixelRatio === 2 ? 'img/startup/startup-tablet-portrait-retina.png' : 'img/startup/startup-tablet-portrait.png';
    //         landscape = pixelRatio === 2 ? 'img/startup/startup-tablet-landscape-retina.png' : 'img/startup/startup-tablet-landscape.png';

    //         link1 = document.createElement('link');
    //         link1.setAttribute('rel', 'apple-touch-startup-image');
    //         link1.setAttribute('media', 'screen and (orientation: portrait)');
    //         link1.setAttribute('href', portrait);
    //         head.appendChild(link1);

    //         link2 = document.createElement('link');
    //         link2.setAttribute('rel', 'apple-touch-startup-image');
    //         link2.setAttribute('media', 'screen and (orientation: landscape)');
    //         link2.setAttribute('href', landscape);
    //         head.appendChild(link2);
    //     } else {
    //         portrait = pixelRatio === 2 ? "img/startup/startup-retina.png" : "img/startup/startup.png";
    //         portrait = screen.height === 568 ? "img/startup/startup-retina-4in.png" : portrait;
    //         link1 = document.createElement('link');
    //         link1.setAttribute('rel', 'apple-touch-startup-image');
    //         link1.setAttribute('href', portrait);
    //         head.appendChild(link1);
    //     }

    //     //hack to fix letterboxed full screen web apps on 4" iPhone / iPod
    //     if ((navigator.platform === 'iPhone' || 'iPod') && (screen.height === 568)) {
    //         document.querySelector("meta[name=viewport]").content="width=320.1";
    //     }
    // };

})(document);




/*
 * ---------------------------------------------
 *    ./assets/javascripts/master/jq.touch.js
 * ---------------------------------------------
 */

//Touch events are from zepto/touch.js
;(function($){
  var touch = {},
    touchTimeout, tapTimeout, swipeTimeout,
    longTapDelay = 750, longTapTimeout;

  function parentIfText(node) {
    return 'tagName' in node ? node : node.parentNode;
  }

  function swipeDirection(x1, x2, y1, y2) {
    var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2);
    return xDelta >= yDelta ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down');
  }

  function longTap() {
    longTapTimeout = null;
    if (touch.last) {
      touch.el.trigger('longTap');
      touch = {};
    }
  }

  function cancelLongTap() {
    if (longTapTimeout) clearTimeout(longTapTimeout);
    longTapTimeout = null;
  }

  function cancelAll() {
    if (touchTimeout) clearTimeout(touchTimeout);
    if (tapTimeout) clearTimeout(tapTimeout);
    if (swipeTimeout) clearTimeout(swipeTimeout);
    if (longTapTimeout) clearTimeout(longTapTimeout);
    touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null;
    touch = {};
  }

  $(document).ready(function(){
    var now, delta;

    $(document.body)
      .bind('touchstart', function(e){
        now = Date.now();
        delta = now - (touch.last || now);
        touch.el = $(parentIfText(e.originalEvent.touches[0].target));
        touchTimeout && clearTimeout(touchTimeout);
        touch.x1 = e.originalEvent.touches[0].pageX;
        touch.y1 = e.originalEvent.touches[0].pageY;
        if (delta > 0 && delta <= 250) touch.isDoubleTap = true;
        touch.last = now;
        longTapTimeout = setTimeout(longTap, longTapDelay);
      })
      .bind('touchmove', function(e){
        cancelLongTap();
        touch.x2 = e.originalEvent.touches[0].pageX;
        touch.y2 = e.originalEvent.touches[0].pageY;
        if(touch.x2 && Math.abs(touch.x1-touch.x2)>10){
          e.preventDefault();
        }
      })
      .bind('touchend', function(e){
         cancelLongTap();

        // swipe
        if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
            (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))

          swipeTimeout = setTimeout(function() {
            touch.el.trigger('swipe');
            touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)));
            touch = {};
          }, 0);

        // normal tap
        else if ('last' in touch)

          // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
          // ('tap' fires before 'scroll')
          tapTimeout = setTimeout(function() {

            // trigger universal 'tap' with the option to cancelTouch()
            // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
            var event = $.Event('tap');
            event.cancelTouch = cancelAll;
            touch.el.trigger(event);

            // trigger double tap immediately
            if (touch.isDoubleTap) {
              touch.el.trigger('doubleTap');
              touch = {};
            }

            // trigger single tap after 250ms of inactivity
            else {
              touchTimeout = setTimeout(function(){
                touchTimeout = null;
                touch.el.trigger('singleTap');
                touch = {};
              }, 250);
            }

          }, 0);

      })
      .bind('touchcancel', cancelAll);

    $(window).bind('scroll', cancelAll);
  })

  ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(m){
    $.fn[m] = function(callback){ return this.bind(m, callback); };
  });
})(jQuery);



/*
 * ------------------------------------------
 *    ./assets/javascripts/master/touch.js
 * ------------------------------------------
 */

// Avoid 300ms delay on touch click
(function() {
  if (Modernizr.touch) {
    new FastClick(document.body);
  }
}());



/*
 * -------------------------------------------
 *    ./assets/javascripts/master/master.js
 * -------------------------------------------
 */

MBP.scaleFix();
MBP.hideUrlBarOnLoad();
MBP.preventZoom();



