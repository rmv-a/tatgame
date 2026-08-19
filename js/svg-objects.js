'use strict';

function KETTLE(cx, cy) {
  return g('<image href="img/haz-kettle.png" x="-55" y="-55" width="110" height="110"/>', cx, cy);
}

function STRIP(cx, cy) {
  return g('<image href="img/haz-strip.png" x="-80" y="-45" width="160" height="90"/>', cx, cy);
}

function EXT(cx, cy, expired) {
  return g('<image href="img/haz-ext.png" x="-60" y="-80" width="120" height="160"/>', cx, cy);
}

function DETECTOR(cx, cy, bag) {
  return g('<image href="img/haz-detector.png" x="-30" y="-30" width="60" height="60"/>', cx, cy);
}

function PLANT(cx, cy) {
  return g('<image href="img/obj-plant.png" x="-25" y="-35" width="50" height="70"/>', cx, cy);
}

function COOLER(cx, cy) {
  return g('<image href="img/obj-cooler.png" x="-100" y="-140" width="200" height="280"/>', cx, cy);
}

function SMOKING(cx, cy) {
  return g('<image href="img/haz-smoking.png" x="-80" y="-110" width="160" height="220"/>', cx, cy);
}

function SPILL(cx, cy) {
  return g('<image href="img/haz-spill.png" x="-70" y="-50" width="140" height="100"/>', cx, cy);
}

function RAGS_AZS(cx, cy) {
  return g('<image href="img/haz-rags.png" x="-70" y="-50" width="140" height="100"/>', cx, cy);
}

function EXT_AZS(cx, cy) {
  return g('<image href="img/haz-ext-azs.png" x="-50" y="-70" width="100" height="140"/>', cx, cy);
}

function JAR(cx, cy) {
  return g('<image href="img/haz-jar.png" x="-75" y="-100" width="150" height="200"/>', cx, cy);
}

function CONE(cx, cy) {
  return g('<image href="img/obj-cone.png" x="-44" y="-88" width="88" height="176"/>', cx, cy);
}

function CONE_SM(cx, cy) {
  return g('<image href="img/obj-cone.png" x="-22" y="-44" width="44" height="88"/>', cx, cy);
}

function SAND(cx, cy) {
  return g('<image href="img/obj-sand.png" x="-50" y="-70" width="100" height="140"/>', cx, cy);
}
