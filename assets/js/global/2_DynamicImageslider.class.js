/*
 * Dynamicly load slideshow from external json file/api
 */

var DynamicImageslider = extend(Imageslider, function() {

  /*** Settings ***/


  /*** Private ***/

  function getFromUrl(jq, callback) {
    var url = jq.data('url');
    $.getJSON(url, function(data) {
      createMarkup(jq, data, callback);
    });
  }

  function createMarkup(jq, slides, callback) {
    var ul = jq.find('ul');

    var height = jq.data('height') || '';
    var width = jq.data('width') || '';

    // Create new lis element if none exists
    if (ul.length === 0) ul = $('<ul></ul>').appendTo(jq);

    slides.forEach(function(slide) {
      if (slide.href === '') slide.href = "#";
      var li = $('<li><a href="'+slide.href+'"><img src="'+slide.src+'" width="'+width+'" height="'+height+'"></a></li>').appendTo(ul);

      // Prevent click on #
      if (slide.href === '#') {
        li.find('a').click(function(e) {
          e.preventDefault();
        });
      }
    });
    callback();
  }


  /*** Public ***/

  this.createMarkup = function(jq) {
    that = this;

    jq.addClass('loading');

    getFromUrl(jq, function() {
      jq.removeClass('loading');
      that.init(jq);
    });

    return that;

  };

});