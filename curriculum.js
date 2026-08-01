// Touch-typing curriculum. The 15 beginner lessons mirror typing.com's ordering
// (J,F,Space -> U,R,K -> ... -> Assessment); the intermediate unit adds capitals,
// numbers and symbols. Drill text is generated deterministically so reseeding is
// stable. Progress/keyboard concerns live elsewhere — this module is pure content.

// --- deterministic RNG (mulberry32) -----------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Left/right hand split — used to anchor drills to a home key (f or j).
const LEFT_KEYS = new Set('`12345qwertasdfgzxcvb'.split(''));
const isLeft = (k) => LEFT_KEYS.has(k);
const anchorFor = (k) => (isLeft(k) ? 'f' : 'j');

// Compact bank of common lowercase words for word drills.
const WORD_BANK = (
  'the of and a to in is you that it he was for on are as with his they at be this ' +
  'from or had by hot but some what there we can out other were all your when up use ' +
  'word how said an each she which do their time if will way about many then them write ' +
  'go see number no could people my than first been call who oil sit now find down day ' +
  'did get come made may part over new sound take only little work know place year live ' +
  'me back give most very after thing our just name good sentence man think say great ' +
  'where help through much before line right too mean old any same tell boy follow came ' +
  'want show also around form three small set put end does another well large must big ' +
  'even such because turn here why ask went men read need land different home us move try ' +
  'kind hand picture again change off play spell air away animal house point page letter ' +
  'mother answer found study still learn should America world high every near add food ' +
  'between own below country plant last school father keep tree never start city earth eye'
).split(/\s+/);

const SENTENCES = [
  'the quick brown fox jumps over the lazy dog every morning near the river',
  'she sells sea shells by the shore while the waves crash against the rocks',
  'a good habit takes time to build so keep practicing a little every single day',
  'we should learn to type without looking down at the keyboard or our hands',
  'the sun rose slowly over the hills as the birds began to sing their morning song',
  'reading a great book can take you to places you have never seen before in life',
  'strong fingers and steady hands make typing feel smooth quick and almost easy',
];

// --- drill builders ----------------------------------------------------------
function sample(rng, arr, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(rng() * arr.length)]);
  return out;
}
function letterKeys(available) {
  return available.filter((c) => /[a-z]/.test(c));
}
function wordsFor(available) {
  const set = new Set(letterKeys(available));
  return WORD_BANK.filter((w) => [...w].every((ch) => set.has(ch)));
}
function weightedPool(available, newKeys) {
  const pool = available.filter((c) => c !== ' ' && c !== 'Enter');
  for (const k of newKeys) if (k !== ' ' && k !== 'Enter') for (let i = 0; i < 3; i++) pool.push(k);
  return pool;
}
function groups(rng, pool, count, size) {
  const g = [];
  for (let i = 0; i < count; i++) {
    let s = '';
    for (let j = 0; j < size; j++) s += pool[Math.floor(rng() * pool.length)];
    g.push(s);
  }
  return g.join(' ');
}

function buildLessonContent({ newKeys, available, type, rng }) {
  const lines = [];
  const words = wordsFor(available);
  const pool = weightedPool(available, newKeys);

  if (type === 'assessment') {
    const usable = SENTENCES.filter((s) => wordsFor(available).length > 30) ;
    const src = usable.length ? usable : SENTENCES;
    lines.push(src[Math.floor(rng() * src.length)]);
    lines.push(src[Math.floor(rng() * src.length)]);
    return lines.join(' ');
  }

  if (type === 'review' || type === 'wrap') {
    if (words.length >= 6) {
      for (let i = 0; i < (type === 'wrap' ? 4 : 3); i++) {
        lines.push(sample(rng, words, 9).join(' '));
      }
    } else {
      lines.push(groups(rng, pool, 10, 3));
      lines.push(groups(rng, pool, 10, 4));
    }
    return lines.join('\n');
  }

  // type === 'lesson' — introduce the new keys, then mix, then words.
  const drillKeys = newKeys.filter((k) => /[a-z.,;']/.test(k));
  if (drillKeys.length) {
    const iso = drillKeys.map((k) => `${k}${k}${k}`).join(' ');
    const mix = drillKeys
      .map((k) => `${anchorFor(k)}${k}${anchorFor(k)} ${k}${anchorFor(k)}${k}`)
      .join(' ');
    lines.push(`${iso} ${iso}`);
    lines.push(mix);
  }
  lines.push(groups(rng, pool, 9, 3));
  lines.push(groups(rng, pool, 8, 4));
  if (words.length >= 4) {
    lines.push(sample(rng, words, 8).join(' '));
    lines.push(sample(rng, words, 8).join(' '));
  }
  return lines.join('\n');
}

// --- lesson definitions (order matches typing.com's beginner curriculum) -----
const DEFS = [
  // unit, title, type, newKeys
  ['Getting Started', 'J, F, and Space', 'lesson', ['j', 'f']],
  ['Getting Started', 'U, R, and K Keys', 'lesson', ['u', 'r', 'k']],
  ['Getting Started', 'D, E, and I Keys', 'lesson', ['d', 'e', 'i']],
  ['Getting Started', 'C, G, and N Keys', 'lesson', ['c', 'g', 'n']],
  ['Getting Started', 'Beginner Review 1', 'review', []],
  ['Reaching Out', 'T, S, and L Keys', 'lesson', ['t', 's', 'l']],
  ['Reaching Out', 'O, B, and A Keys', 'lesson', ['o', 'b', 'a']],
  ['Reaching Out', 'V, H, and M Keys', 'lesson', ['v', 'h', 'm']],
  ['Reaching Out', 'Period and Comma', 'lesson', ['.', ',']],
  ['Reaching Out', 'Beginner Review 2', 'review', []],
  ['The Home Stretch', 'W, X, and ; Keys', 'lesson', ['w', 'x', ';']],
  ['The Home Stretch', 'Q, Y, and P Keys', 'lesson', ['q', 'y', 'p']],
  ['The Home Stretch', 'Z and Enter Keys', 'lesson', ['z']],
  ['Wrapping Up', 'Beginner Wrap-up', 'wrap', []],
  ['Wrapping Up', 'Beginner Assessment', 'assessment', []],
  // Intermediate unit
  ['Level Up', 'Capital Letters', 'lesson', []],
  ['Level Up', 'Numbers 1 - 5', 'lesson', ['1', '2', '3', '4', '5']],
  ['Level Up', 'Numbers 6 - 0', 'lesson', ['6', '7', '8', '9', '0']],
  ['Level Up', 'Common Symbols', 'lesson', ['!', '?', "'", '-']],
  ['Level Up', 'Intermediate Assessment', 'assessment', []],
];

// Home row is the base position every typist starts from.
const HOME_ROW = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', ' '];

function slug(title, i) {
  return `L${String(i + 1).padStart(2, '0')}-` + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildCurriculum() {
  const cumulative = new Set(HOME_ROW);
  const lessons = [];
  const unitOrder = {};
  let uCount = 0;

  DEFS.forEach((def, i) => {
    const [unit, title, type, newKeys] = def;
    if (!(unit in unitOrder)) unitOrder[unit] = uCount++;
    newKeys.forEach((k) => cumulative.add(k));

    const available = [...cumulative];
    const rng = mulberry32(hashSeed(slug(title, i)));

    let content;
    let extra = {};
    if (title === 'Capital Letters') {
      // Shift practice — capitalized common words.
      const caps = sample(rng, wordsFor([...cumulative]), 16).map(
        (w) => w.charAt(0).toUpperCase() + w.slice(1)
      );
      content = [caps.slice(0, 8).join(' '), caps.slice(8).join(' ')].join('\n');
      extra.newKeys = ['Shift'];
    } else if (title === 'Common Symbols') {
      content = ["don't stop now it's a good day", 'well-made and fast', 'ready? yes! go now!', 'up-time is on-time'].join('\n');
      extra.newKeys = newKeys;
    } else if (type === 'lesson' && /Numbers/.test(title)) {
      content = [
        groups(rng, weightedPool(available, newKeys), 10, 3),
        groups(rng, weightedPool(available, newKeys), 8, 4),
        newKeys.join(' ') + ' ' + newKeys.slice().reverse().join(' '),
      ].join('\n');
    } else {
      content = buildLessonContent({ newKeys, available, type, rng });
    }

    lessons.push({
      lesson_key: slug(title, i),
      unit,
      unit_order: unitOrder[unit],
      lesson_order: i,
      title,
      type,
      new_keys: extra.newKeys || newKeys,
      content,
      target_wpm: type === 'assessment' ? 25 : 15,
      duration: type === 'assessment' ? 60 : null,
    });
  });

  return lessons;
}

export const CURRICULUM = buildCurriculum();

// Group lessons by unit, preserving order — convenient for the API/UI.
export function curriculumByUnit(lessons = CURRICULUM) {
  const map = new Map();
  for (const l of lessons) {
    if (!map.has(l.unit)) map.set(l.unit, []);
    map.get(l.unit).push(l);
  }
  return [...map.entries()].map(([unit, items]) => ({ unit, lessons: items }));
}
