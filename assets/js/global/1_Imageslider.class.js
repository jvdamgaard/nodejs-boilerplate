/*
 *  Handle imageslider. If more than one slide sliding effects are added
 */

var Imageslider = create(Class, function() {

  /*** Settings ***/

  // Use init(jq) to set these values
  this.set({
    jq: {},
    timer: 0,
    slides: 0,
    width: 0,
    position: 0
  });


  /*** Private ***/

  var rightOffset = 4; // Ekstra slide added to the right -> make it look like a infinite loop of slides

  // silent: no animation
  // force: go to slide outside the main area (use for infinity loop)
  function change(that, to, silent, forcePosition) {

    if(silent) that.jq.removeClass('animate');

    that.position += to;

    if(!forcePosition) {
      that.position %= that.slides;
      if(that.position <= 0) that.position += that.slides;
    }

    // Set animation of ul
    var ul = that.list[0];
    var offset = (-(that.position) * that.width) + 'px';

    // Set prefixed transform. Fallback: use margin-left
    if (!Global.Style.set(ul,'transform', 'translateX(' + offset + ')')) ul.style.marginLeft = offset;

    // Activate element in navigation
    that.jq.find('nav span.active').removeClass('active');
    $(that.jq.find('nav span')[that.position % that.slides]).addClass('active');

    // Reset timer
    if(that.timer) start(that);

    if(silent) {
      setTimeout(function() {
        that.jq.addClass('animate');
      }, 50);
    }

  }

  stop = function(that) {
    clearTimeout(that.clock);
  };

  start = function(that) {
    stop(that);
    that.clock = setTimeout(function() {

      // Avoid sliding when modular is active
      if(Modular.active) {
        start(that);
      } else {
        that.next();
      }
    }, that.timer);
  };


  /*** Public ***/

  // o: jQuery object with ul of slides
  this.init = function(o) {

    this.set({
      jq  : o,
      timer  : o.data('timer'),
      list   : o.find('ul'),
      slides : o.find('ul').find('li').length,
      width  : o.find('ul').find('li').width()
    });

    var that = this;

    // Add sliding behaviour and navigation if more than one slide
    if(that.slides > 1) {

      // Add ekstra slides to avoid seeing whitespace
      for(var i = 0; i < rightOffset; i++) {
        that.list.append(that.list.find('li')[i % that.slides].outerHTML);
      }

      // Next and prev buttons
      $('<a class="next no-touch" href="#">&#9658;</a>').appendTo(that.jq).click(function(e) {
        e.preventDefault();
        that.next();
      });
      $('<a class="prev no-touch" href="#">&#9668;</a>').appendTo(that.jq).click(function(e) {
        e.preventDefault();
        that.prev();
      });

      // Navigation
      var navigation = $('<nav class="pagination"></nav>').appendTo(that.jq);
      for(var j = 0; j < that.slides; j++) {
        $('<span>.</span>').appendTo(navigation);
      }

      // Prevent autoplay when window is not in focus
      if(that.timer) {
        $(window).blur(function() {
          stop(that);
        }).focus(function() {
          start(that);
        });
      }

      // Swipe effects
      that.jq.swipeLeft(function() {
        that.next();
      }).swipeRight(function() {
        that.prev();
      });

      // Place imageslider correct on resize
      $(window).on('resize orientationchange', function() {
        that.width = that.jq.find('li').width();
        change(that, 0, true);
      });

      that.jq.addClass('animate');

      // Init slideshow
      change(that, 0, true);
    }

    return that;
  };

  this.next = function() {
    var that = this;
    // Last slide: jump to pos 0 silently and then animate to 1st slide
    if(that.position == that.slides) {
      change(that, -that.position, true, true);
      setTimeout(function() {
        change(that, 1);
      }, 100);

      // All other slides
    } else {
      change(that, 1);
    }
  };

  this.prev = function() {
    var that = this;
    // First slide: jump to last slide +1 silently and then animate to last slide
    if(that.position == 1) {
      change(that, that.slides, true, true);
      setTimeout(function() {
        change(that, -1);
      }, 100);

    // All other slides
    } else {
      change(that, -1);
    }
  };


});