// Avoid 300ms delay on touch click
(function() {
  if (Modernizr.touch) {
    new FastClick(document.body);
  }
}());