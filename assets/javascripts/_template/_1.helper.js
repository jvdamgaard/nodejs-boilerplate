/*
 * Used for helper functions which could be used in plugins
 * Rank: 1
 */

var MyHelper = create(Class, function() {
  var that = this; // always include in classes


  /*** Setings ***/

  this.options = {};


  /*** Code base ***/

  // Private objects and function
  var privateOptions = {};
  function pivateMethod() { return privateOptions; }

  // Attach public methods to 'this'
  this.method = function() {
    that = this; // alway include in public methods

    return that.options;
  };

});