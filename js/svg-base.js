'use strict';

function g(inner, x, y) { return '<g transform="translate(' + x + ' ' + y + ')">' + inner + '</g>'; }

function WALLFLOOR(fy) {
  return '<rect class="wf" x="0" y="0" width="420" height="' + fy + '" fill="#eef0f4"/>' +
         '<rect class="wf" x="0" y="' + fy + '" width="420" height="' + (640 - fy) + '" fill="#d9dbe0"/>' +
         '<line class="wf" x1="0" y1="' + fy + '" x2="420" y2="' + fy + '" stroke="#c3c6cc" stroke-width="3"/>';
}

function DOOR(cx, cy) {
  return g('<image href="img/haz-door.png" x="-97" y="-237" width="195" height="475"/>', cx, cy);
}
