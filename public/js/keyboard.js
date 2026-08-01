import { BASE_FINGER, SPECIAL_FINGER, FINGERS, resolveChar } from './fingerMap.js';

// Physical key rows. Each entry: [label, dataKey, extraClass?, widthUnits?]
const ROWS = [
  [['`', '`'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'], ['0', '0'], ['-', '-'], ['=', '='], ['⌫', 'Backspace', 'wide']],
  [['Tab', 'Tab', 'wide'], ['q', 'q'], ['w', 'w'], ['e', 'e'], ['r', 'r'], ['t', 't'], ['y', 'y'], ['u', 'u'], ['i', 'i'], ['o', 'o'], ['p', 'p'], ['[', '['], [']', ']'], ['\\', '\\']],
  [['Caps', 'Caps', 'wide'], ['a', 'a'], ['s', 's'], ['d', 'd'], ['f', 'f', 'home'], ['g', 'g'], ['h', 'h'], ['j', 'j', 'home'], ['k', 'k'], ['l', 'l'], [';', ';'], ["'", "'"], ['Enter', 'Enter', 'wide']],
  [['Shift', 'ShiftLeft', 'wide'], ['z', 'z'], ['x', 'x'], ['c', 'c'], ['v', 'v'], ['b', 'b'], ['n', 'n'], ['m', 'm'], [',', ','], ['.', '.'], ['/', '/'], ['Shift', 'ShiftRight', 'wide']],
  [['space', ' ', 'space']],
];

// Renders a virtual keyboard into `container` and returns a controller.
export function createKeyboard(container) {
  container.innerHTML = '';
  container.classList.add('keyboard');
  const keyEls = new Map(); // dataKey -> element

  for (const row of ROWS) {
    const rowEl = document.createElement('div');
    rowEl.className = 'kb-row';
    for (const [label, dataKey, extra] of row) {
      const k = document.createElement('div');
      k.className = 'kb-key' + (extra ? ` kb-${extra}` : '');
      k.dataset.key = dataKey;
      const finger = BASE_FINGER[dataKey] || SPECIAL_FINGER[dataKey];
      if (finger) {
        k.dataset.finger = finger;
        k.style.setProperty('--finger-color', FINGERS[finger].color);
      }
      k.textContent = label;
      rowEl.appendChild(k);
      keyEls.set(dataKey, k);
    }
    container.appendChild(rowEl);
  }

  function clear() {
    for (const el of keyEls.values()) el.classList.remove('next', 'next-shift');
  }

  // Highlight the key(s) needed to type `ch`.
  function highlightChar(ch) {
    clear();
    const r = resolveChar(ch);
    if (!r) return;
    const keyEl = keyEls.get(r.base);
    if (keyEl) keyEl.classList.add('next');
    if (r.needsShift) {
      // Shift is pressed by the hand opposite the base key.
      const finger = BASE_FINGER[r.base];
      const useRightShift = finger && FINGERS[finger].hand === 'left';
      const shiftEl = keyEls.get(useRightShift ? 'ShiftRight' : 'ShiftLeft');
      if (shiftEl) shiftEl.classList.add('next-shift');
    }
  }

  return { highlightChar, clear, keyEls };
}
