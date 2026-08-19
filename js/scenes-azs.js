'use strict';

function sceneAzsBasic() {
  return '<svg viewBox="0 0 420 640" role="img" aria-label="Сцена: топливораздаточная колонка АЗС">' +
    '<rect x="0" y="0" width="420" height="150" fill="#8fc4e8" class="sky"/>' +
    '<rect x="0" y="150" width="420" height="490" fill="#8f969c" class="ground"/>' +
    '<rect x="0" y="150" width="420" height="8" fill="#a8aeb5" class="ground-line"/>' +
    SMOKING(30, 520) +
    SPILL(120, 520) +
    EXT_AZS(280, 420) +
    CONE(200, 580) +
    SAND(380, 400) +
    '</svg>';
}

function sceneAzsAdv() {
  return '<svg viewBox="0 0 420 640" role="img" aria-label="Сцена: зона слива топлива АЗС">' +
    '<rect x="0" y="0" width="420" height="140" fill="#8fc4e8" class="sky"/>' +
    '<rect x="0" y="140" width="420" height="500" fill="#8f969c" class="ground"/>' +
    '<rect x="0" y="140" width="420" height="8" fill="#a8aeb5" class="ground-line"/>' +
    SMOKING(20, 520) +
    JAR(100, 450) +
    RAGS_AZS(390, 450) +
    SPILL(250, 400) +
    EXT_AZS(370, 500) +
    CONE(180, 550) +
    SAND(220, 450) +
    '</svg>';
}

function sceneExam() {
  return '<svg viewBox="0 0 420 640" role="img" aria-label="Сцена: итоговый экзамен, магазин АЗС">' +
    DETECTOR(310, 102) +
    STRIP(250, 540) +
    KETTLE(180, 300) +
    EXT(80, 560) +
    JAR(400, 260) +
    RAGS_AZS(300, 470) +
    CONE_SM(420, 300) +
    SPILL(250, 580) +
    '</svg>';
}
