// Handle slideshow
(function() {

  Navigation.ignore('.imageslider');

  $('.imageslider').each(function() {

    if ($(this).data('url')) {
      window.test = create(DynamicImageslider).createMarkup($(this));
    } else {
      create(Imageslider).init($(this));
    }

  });

}());