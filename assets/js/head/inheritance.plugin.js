(function() {

  var root = this;

  // Create Prototpe object for inheritance use
  var Prototype = {};

  // Set properties on object
  Prototype.set = function(key, value) {

    // Maps a key, value set to this object
    if (typeof key === 'string') {
      this[key] = value;

    // Maps all key,value setis in array to this object
    } else if (key !== null && typeof key === 'object') {
      var settings = key;
      for (var i in settings) this[i] = settings[i];
    }

    return this;
  };

  // Check/get parent
  Prototype.instanceOf = function(proto) {
    var parent = Object.getPrototypeOf(this);

    // Ignore Prototype
    if (parent === Prototype) parent = undefined;

    if (proto) return (proto === parent);

    return parent;
  };

  // Check/get ancestors
  Prototype.inheritsFrom = function(proto) {
    var tree = [];
    var parent = this.instanceOf();

    while (parent) {

      // Return booelean if proto is defined
      if (proto && proto === parent) return true;

      // Add ancestors to tree
      tree.push(parent);

      parent = parent.instanceOf();
    }

    // No match found for proto
    if (proto) return false;

    return tree;

  };

  // Create new instance for prototypal inheritance
  root.create = function(proto, settings) {

    // Rearrange attributes if proto don't inherit from Prototype: Use Prototype as standard proto
    if (!proto || proto.instanceOf !== Prototype.instanceOf) {
      settings = proto;
      proto = Prototype;
    }

    // Create new object with proto as prototype
    function O() {}
    O.prototype = proto;
    var that = new O();

    // Bind properties to new object with function closure
    if (typeof settings === 'function') {
      settings.call(that);

    // Map object to new object
    } else if (typeof settings === 'object') {
      that.set(settings);
    }

    return that;
  };

  // Semantic. Same as create()
  root.extend = function(proto, settings) {
    return create(proto, settings);
  };

}(this));