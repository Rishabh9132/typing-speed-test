// Standard 10-finger touch-typing key assignment for QWERTY.
// Each base key maps to the finger that should press it. Colour zones and the
// on-screen keyboard both derive from this single source of truth.

export const FINGERS = {
  'l-pinky':  { label: 'left pinky finger',   hand: 'left',  color: '#f26d6d' },
  'l-ring':   { label: 'left ring finger',    hand: 'left',  color: '#f0a35e' },
  'l-middle': { label: 'left middle finger',  hand: 'left',  color: '#f2d16b' },
  'l-index':  { label: 'left index finger',   hand: 'left',  color: '#7bd88f' },
  'r-index':  { label: 'right index finger',  hand: 'right', color: '#5ec8c8' },
  'r-middle': { label: 'right middle finger', hand: 'right', color: '#6c9cf0' },
  'r-ring':   { label: 'right ring finger',   hand: 'right', color: '#a07bf0' },
  'r-pinky':  { label: 'right pinky finger',  hand: 'right', color: '#e06ad0' },
  'thumb':    { label: 'either thumb',        hand: 'both',  color: '#9aa0c3' },
};

// base key char -> finger id
export const BASE_FINGER = {
  '`': 'l-pinky', '1': 'l-pinky', 'q': 'l-pinky', 'a': 'l-pinky', 'z': 'l-pinky',
  '2': 'l-ring', 'w': 'l-ring', 's': 'l-ring', 'x': 'l-ring',
  '3': 'l-middle', 'e': 'l-middle', 'd': 'l-middle', 'c': 'l-middle',
  '4': 'l-index', '5': 'l-index', 'r': 'l-index', 't': 'l-index', 'f': 'l-index', 'g': 'l-index', 'v': 'l-index', 'b': 'l-index',
  '6': 'r-index', '7': 'r-index', 'y': 'r-index', 'u': 'r-index', 'h': 'r-index', 'j': 'r-index', 'n': 'r-index', 'm': 'r-index',
  '8': 'r-middle', 'i': 'r-middle', 'k': 'r-middle', ',': 'r-middle',
  '9': 'r-ring', 'o': 'r-ring', 'l': 'r-ring', '.': 'r-ring',
  '0': 'r-pinky', '-': 'r-pinky', '=': 'r-pinky', 'p': 'r-pinky', '[': 'r-pinky', ']': 'r-pinky', '\\': 'r-pinky',
  ';': 'r-pinky', "'": 'r-pinky', '/': 'r-pinky',
  ' ': 'thumb',
};

// Special (non-character) keys used only for rendering / shift assignment.
export const SPECIAL_FINGER = {
  Tab: 'l-pinky', Caps: 'l-pinky', ShiftLeft: 'l-pinky',
  Backspace: 'r-pinky', Enter: 'r-pinky', ShiftRight: 'r-pinky',
};

// shifted char -> base key char
export const SHIFTED = {
  '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5',
  '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=',
  '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/',
};

// Resolve any character a user must type into the base key + whether Shift is needed.
export function resolveChar(ch) {
  if (ch === undefined || ch === null) return null;
  if (ch >= 'A' && ch <= 'Z') return { base: ch.toLowerCase(), needsShift: true };
  if (ch in SHIFTED) return { base: SHIFTED[ch], needsShift: true };
  return { base: ch, needsShift: false };
}

// finger id responsible for a character (uses the base key).
export function fingerForChar(ch) {
  const r = resolveChar(ch);
  if (!r) return null;
  return BASE_FINGER[r.base] || null;
}

// Human-readable guidance, e.g. "Shift + right pinky".
export function fingerHint(ch) {
  const r = resolveChar(ch);
  if (!r) return '';
  const fid = BASE_FINGER[r.base];
  if (!fid) return '';
  const base = FINGERS[fid].label;
  if (!r.needsShift) return `Use your ${base}`;
  // Shift is pressed by the pinky opposite the typing hand.
  const shiftHand = FINGERS[fid].hand === 'left' ? 'right' : 'left';
  return `Hold ${shiftHand} Shift, then use your ${base}`;
}
