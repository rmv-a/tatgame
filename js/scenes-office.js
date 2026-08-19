'use strict';

function sceneTutorial() {
  return '<svg viewBox="0 0 420 640" role="img" aria-label="Сцена: обучающий офис">' +
    WALLFLOOR(390) +
    DOOR(225, 80) +
    COOLER(10, 545) +
    PLANT(395, 570) +
    EXT(80, 520) +
    KETTLE(210, 530) +
    STRIP(350, 540) +
    '</svg>';
}

function sceneOfficeBasic() {
  return '<svg viewBox="0 0 420 640" role="img" aria-label="Сцена: офис, рабочий кабинет">' +
    WALLFLOOR(390) +
    DOOR(225, 80) +
    COOLER(10, 545) +
    PLANT(395, 570) +
    EXT(80, 520) +
    KETTLE(210, 530) +
    STRIP(350, 540) +
    '</svg>';
}

function sceneOfficeAdv() {
  return '<svg viewBox="0 0 420 640" role="img" aria-label="Сцена: офис, серверная и кухня">' +
    '<rect x="0" y="0" width="420" height="16" fill="#e8eaee"/>' +
    WALLFLOOR(390) +
    DETECTOR(210, 62, true) +
    COOLER(10, 545) +
    PLANT(395, 570) +
    EXT(80, 520) +
    KETTLE(210, 530) +
    STRIP(340, 540) +
    '</svg>';
}
