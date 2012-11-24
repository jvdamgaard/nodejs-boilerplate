// ctrl-g for grid

var isCtrl = false;
document.onkeyup = function (e) {
  if(e.which == 17) isCtrl=false;
}
document.onkeydown = function (e) {
  if(e.which == 17) {
    isCtrl=true;
  }
  if(e.which == 71 && isCtrl == true) {
    if ($('#grid').hasClass('active')) {
      $('#grid').removeClass('active');
    } else {
      $('#grid').addClass('active');
    }
    return false;
    e.preventDefault();
  }
}

var numberOfCols  = 16;
var grid = '<div id="grid"><div class="row">'
for (var i=0;i<numberOfCols;i++) {
  grid += '<div class="one column"><div class="fill"></div></div>';
}
grid += '</div></div>';

$('body').append(grid);