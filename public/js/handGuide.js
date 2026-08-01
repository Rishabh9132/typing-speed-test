import { FINGERS } from './fingerMap.js';

// Home-row resting positions — the base every touch typist returns to.
const HOME_LEFT = [['a', 'l-pinky'], ['s', 'l-ring'], ['d', 'l-middle'], ['f', 'l-index']];
const HOME_RIGHT = [['j', 'r-index'], ['k', 'r-middle'], ['l', 'r-ring'], [';', 'r-pinky']];

// Short finger name for compact chips ("left index finger" -> "index").
function shortFinger(fid) {
  return FINGERS[fid].label.replace('left ', '').replace('right ', '').replace(' finger', '');
}

function chip([key, fid]) {
  const cap = key === ';' ? ';' : key.toUpperCase();
  return `<div class="hg-key" style="--c:${FINGERS[fid].color}">
    <span class="hg-cap">${cap}</span><span class="hg-fn">${shortFinger(fid)}</span>
  </div>`;
}

// Full home-row hand placement guide with a resting-position tip.
export function handGuideHtml() {
  return `
  <div class="hand-guide">
    <p class="hg-tip">✋ <b>Place your hands:</b> rest your left fingers on <b>A S D F</b> and your right fingers on <b>J K L ;</b> — thumbs on the space bar. Feel the tiny bumps on <b>F</b> and <b>J</b> so you can find home without looking down.</p>
    <div class="hg-hands">
      <div class="hg-hand">
        <span class="hg-label">Left hand</span>
        <div class="hg-keys">${HOME_LEFT.map(chip).join('')}</div>
      </div>
      <div class="hg-hand hg-thumbs">
        <span class="hg-label">Thumbs</span>
        <div class="hg-keys"><div class="hg-key hg-space" style="--c:${FINGERS.thumb.color}"><span class="hg-cap">space</span><span class="hg-fn">both thumbs</span></div></div>
      </div>
      <div class="hg-hand">
        <span class="hg-label">Right hand</span>
        <div class="hg-keys">${HOME_RIGHT.map(chip).join('')}</div>
      </div>
    </div>
  </div>`;
}

// Color key mapping each finger to its keyboard zone colour.
export function fingerLegendHtml() {
  const order = ['l-pinky', 'l-ring', 'l-middle', 'l-index', 'r-index', 'r-middle', 'r-ring', 'r-pinky', 'thumb'];
  return `<div class="finger-legend" aria-label="Finger colour key">${order
    .map((f) => `<span class="fl-item"><span class="fl-dot" style="background:${FINGERS[f].color}"></span>${FINGERS[f].label}</span>`)
    .join('')}</div>`;
}
