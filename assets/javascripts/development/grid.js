/*
 * Show grid with CRTL+g
 */

(function(document) {

  var isCtrl        = false,
      numberOfCols  = 16,
      numberOfRows  = 200,
      grid;

  document.onkeyup = function(e) {
    if(e.which == 17) isCtrl = false;
  };

  document.onkeydown = function(e) {
    if(e.which == 17) isCtrl = true; // ctrl

    if(e.which === 71 && isCtrl === true) { // ctrl+g
      if($('#grid').hasClass('active')) {
        $('#grid').removeClass('active');
        $('#grid').height(0);
      } else {
        $('#grid').addClass('active');
        $('#grid').height($(document).height());
      }
      e.preventDefault();
      return false;
    }
  };

  grid = '<div id="grid" style="height:722px"><div class="row">';
  for(var i = 0; i < numberOfCols; i++) {
    grid += '<div class="one column"><div class="fill">';
    for(var j = 0; j < numberOfRows; j++) {
      grid += '<div class="show-horizontal-line"></div>';
    }
    grid += '</div></div>';
  }
  grid += '</div></div>';

  $('body').append(grid);

})(document);
