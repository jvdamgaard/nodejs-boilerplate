// Introduce Object.create on old js engines
if(typeof Object.create !== "function") {
  Object.create = function(o) {
    function F() {}
    F.prototype = o;
    return new F();
  };
}

// Create global Class object for inheritance use
var Class = {
  'set':          function(key, o) {
                    if (typeof key === 'string') {
                      this[key] = o;
                    } else if (key !== null && typeof key === 'object') {
                      o = key;
                      for (var k in o) this[k] = o[k];
                    }
                    return this;
                  },
  'create':       function(o) {
                    var that = Object.create(this);
                    if (typeof o === 'function') {
                      o.call(that);
                    } else if (typeof o === 'object') {
                      that.set(o);
                    }
                    return that;
                  },
  'instanceOf':   function(o) {
                    var proto = Object.getPrototypeOf(this);
                    if (o) return (proto === o);
                    return proto;
                  },
  'inheritsFrom': function(o) {
                    var tree = [];
                    var proto = this.instanceOf();
                    while (proto.instanceOf) {
                      if (o && proto === o) return true;
                      tree.push(proto);
                      proto = proto.instanceOf();
                    }
                    if (o) return false;
                    return tree;
                  }
};

// Semantic helper functions
function create(c, o) {
  if (!c || !c.create) {
    o = c;
    c = Class;
  }
  return c.create(o);
}
function extend(c, o) {
  return create(c, o);
}