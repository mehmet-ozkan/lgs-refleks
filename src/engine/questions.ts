import {
  AnswerStyle,
  CategoryId,
  ConcreteCategoryId,
  Difficulty,
  MathPart,
  Question,
  QuestionOption,
  WeakSpot,
} from '../types/game';
import { CONCRETE_CATEGORIES } from './categories';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeNumericOptions(correct: number, candidates: number[]): QuestionOption[] {
  const set = new Set<number>([correct]);
  for (const c of shuffle(candidates)) {
    if (set.size >= 4) break;
    if (c > 0 && Number.isInteger(c)) set.add(c);
  }
  let step = 1;
  while (set.size < 4) {
    const alt = correct + (step % 2 === 0 ? step : -step);
    if (alt > 0) set.add(alt);
    step++;
  }
  return shuffle(Array.from(set)).map((n) => ({
    id: String(n),
    label: String(n),
  }));
}

function radicalParts(a: number, b: number): MathPart[] {
  return [{ type: 'radical', coeff: String(a), radicand: String(b) }];
}

// ============================================================================
// 1. KRİTİK KATLAR (12, 15, 16, 18, 24, 36)
// ============================================================================

const CRITICAL_BASES = [12, 15, 16, 18, 24, 36] as const;

const GENITIVE_SUFFIX: Record<number, string> = {
  12: '’nin',
  15: '’in',
  16: '’nın',
  18: '’in',
  24: '’ün',
  36: '’nın',
};

const MAX_MULTIPLIER: Record<number, number> = {
  12: 12,
  15: 12,
  16: 10,
  18: 10,
  24: 10,
  36: 10,
};

function multiplierRange(base: number, difficulty: Difficulty): [number, number] {
  const max = MAX_MULTIPLIER[base];
  if (difficulty === 'warmup') return [2, Math.min(6, max)];
  if (difficulty === 'master') return [6, max];
  return [3, max];
}

function generateMultipleQuestion(
  answerStyle: AnswerStyle,
  difficulty: Difficulty
): Question {
  const roll = answerStyle === 'input' ? randInt(0, 1) : randInt(0, 3);

  if (roll === 0) {
    const base = pick(CRITICAL_BASES);
    const [lo, hi] = multiplierRange(base, difficulty);
    const mult = randInt(lo, hi);
    const ans = base * mult;
    const candidates = [
      ans + base,
      ans - base,
      ans + (base > 18 ? 12 : 6),
      ans - (base > 18 ? 12 : 6),
      ans + 10,
      ans - 10,
      (base + 2) * mult,
      (base - 2) * mult,
    ];
    return {
      key: `mult-mul-${base}-${mult}`,
      category: 'multiples',
      prompt: {
        label: 'Hızlı Çarpım',
        parts: [
          { type: 'text', value: `${base} × ${mult} = ` },
          { type: 'blank' },
        ],
      },
      hybridKind: 'number',
      supportsInput: true,
      correctAnswer: String(ans),
      displayAnswer: String(ans),
      tip: `${base} × ${mult} = ${base * Math.floor(mult / 2)} + ${base * Math.ceil(mult / 2)} = ${ans}`,
      options: makeNumericOptions(ans, candidates),
    };
  }

  if (roll === 1) {
    const base = pick(CRITICAL_BASES);
    const [lo, hi] = multiplierRange(base, difficulty);
    const mult = randInt(lo, hi);
    const total = base * mult;
    const askAsEquation = Math.random() < 0.5;
    const candidates = [mult - 2, mult - 1, mult + 1, mult + 2, mult + 3];
    return {
      key: `mult-div-${total}-${base}`,
      category: 'multiples',
      prompt: {
        label: 'Kaç Katı?',
        parts: askAsEquation
          ? [
              { type: 'text', value: `${total} = ${base} × ` },
              { type: 'blank' },
            ]
          : [
              { type: 'text', value: `${total} ÷ ${base} = ` },
              { type: 'blank' },
            ],
      },
      hybridKind: 'number',
      supportsInput: true,
      correctAnswer: String(mult),
      displayAnswer: String(mult),
      tip: `${base} × ${mult} = ${total}`,
      options: makeNumericOptions(mult, candidates),
    };
  }

  if (roll === 2) {
    const base = pick(CRITICAL_BASES);
    const [lo, hi] = multiplierRange(base, difficulty);
    const mult = randInt(Math.max(3, lo), hi);
    const correct = base * mult;

    const distractorSet = new Set<number>();
    const offsets = [-8, -6, -4, -2, 2, 4, 6, 8, 10, -10, 12, -12, 14, -14];
    for (const off of shuffle(offsets)) {
      const candidate = correct + off;
      if (candidate > base * 2 && candidate % base !== 0) {
        distractorSet.add(candidate);
      }
      if (distractorSet.size >= 3) break;
    }

    const options = shuffle([correct, ...Array.from(distractorSet)]).map((n) => ({
      id: String(n),
      label: String(n),
    }));

    return {
      key: `mult-which-${base}-${correct}`,
      category: 'multiples',
      prompt: {
        label: 'Kat Tanıma Refleksi',
        parts: [
          { type: 'text', value: 'Hangisi ' },
          { type: 'highlight', value: String(base) },
          { type: 'text', value: `${GENITIVE_SUFFIX[base] ?? '’in'} katıdır?` },
        ],
      },
      hybridKind: 'choice',
      supportsInput: false,
      correctAnswer: String(correct),
      displayAnswer: String(correct),
      tip: `${correct} = ${base} × ${mult}`,
      options,
    };
  }

  const richNumbers =
    difficulty === 'warmup'
      ? [72, 96, 108, 120, 144]
      : [72, 96, 108, 120, 144, 180, 216, 240, 288, 360];
  const target = pick(richNumbers);
  const divisors = CRITICAL_BASES.filter((b) => target % b === 0);
  const nonDivisors = CRITICAL_BASES.filter((b) => target % b !== 0);

  if (divisors.length < 3 || nonDivisors.length < 1) {
    return generateMultipleQuestion('input', difficulty);
  }

  const wrongOne = pick(nonDivisors);
  const threeRight = shuffle([...divisors]).slice(0, 3);
  const options = shuffle([wrongOne, ...threeRight]).map((n) => ({
    id: String(n),
    label: String(n),
  }));

  return {
    key: `mult-notdiv-${target}-${wrongOne}`,
    category: 'multiples',
    prompt: {
      label: 'Bölünebilme Refleksi',
      parts: [
        { type: 'highlight', value: String(target) },
        { type: 'text', value: ' hangisine tam bölünmez?' },
      ],
    },
    hybridKind: 'choice',
    supportsInput: false,
    correctAnswer: String(wrongOne),
    displayAnswer: String(wrongOne),
    tip: `${target} ÷ ${wrongOne} tam bölünmez (kalan ${target % wrongOne}).`,
    options,
  };
}

// ============================================================================
// 2. ÜSLÜ REFLEKS (2, 3, 5 kuvvetleri — çift yönlü)
// ============================================================================

interface PowerEntry {
  base: number;
  exp: number;
  value: number;
}

const POWER_POOLS: Record<Difficulty, PowerEntry[]> = {
  warmup: [
    ...[2, 3, 4, 5, 6, 7].map((e) => ({ base: 2, exp: e, value: 2 ** e })),
    ...[2, 3, 4].map((e) => ({ base: 3, exp: e, value: 3 ** e })),
    ...[2, 3].map((e) => ({ base: 5, exp: e, value: 5 ** e })),
  ],
  standard: [
    ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((e) => ({ base: 2, exp: e, value: 2 ** e })),
    ...[2, 3, 4, 5, 6].map((e) => ({ base: 3, exp: e, value: 3 ** e })),
    ...[2, 3, 4, 5].map((e) => ({ base: 5, exp: e, value: 5 ** e })),
  ],
  master: [
    ...[6, 7, 8, 9, 10].map((e) => ({ base: 2, exp: e, value: 2 ** e })),
    ...[4, 5, 6].map((e) => ({ base: 3, exp: e, value: 3 ** e })),
    ...[3, 4, 5].map((e) => ({ base: 5, exp: e, value: 5 ** e })),
  ],
};

function generatePowerQuestion(difficulty: Difficulty): Question {
  const entry = pick(POWER_POOLS[difficulty]);
  const isReverse = Math.random() < 0.5;

  if (!isReverse) {
    const { base, exp, value } = entry;
    const sameBaseNeighbors = [
      exp > 1 ? base ** (exp - 1) : value + base,
      base ** (exp + 1),
      base * exp,
      value + base ** Math.max(1, exp - 2),
      value - base ** Math.max(1, exp - 2),
      value * 2,
    ].filter((n) => n > 0 && n !== value);

    return {
      key: `pow-fwd-${base}-${exp}`,
      category: 'powers',
      prompt: {
        label: 'Üslü Değer',
        parts: [
          { type: 'power', base: String(base), exp: String(exp) },
          { type: 'text', value: ' = ' },
          { type: 'blank' },
        ],
      },
      hybridKind: 'number',
      supportsInput: true,
      correctAnswer: String(value),
      displayAnswer: String(value),
      tip: `${base}^${exp - 1} = ${base ** (exp - 1)}, bunun ${base} katı ${value} eder.`,
      options: makeNumericOptions(value, sameBaseNeighbors),
    };
  }

  const { base, exp, value } = entry;
  const candidates = [exp - 2, exp - 1, exp + 1, exp + 2, exp + 3].filter((n) => n >= 1);

  return {
    key: `pow-rev-${base}-${exp}`,
    category: 'powers',
    prompt: {
      label: 'Üssü Bul',
      parts: [
        { type: 'text', value: `${value} = ` },
        { type: 'power', base: String(base), exp: '?', highlightExp: true },
      ],
    },
    hybridKind: 'number',
    supportsInput: true,
    correctAnswer: String(exp),
    displayAnswer: String(exp),
    tip: `${base}^${exp} = ${value}`,
    options: makeNumericOptions(exp, candidates),
  };
}

// ============================================================================
// 3. TAM KARE (11–25) & KÖK DÖNÜŞÜMÜ (a√b)
// ============================================================================

interface RadicalEntry {
  n: number;
  a: number;
  b: number;
}

const CLASSIC_RADICALS: RadicalEntry[] = [
  { n: 8, a: 2, b: 2 },
  { n: 12, a: 2, b: 3 },
  { n: 18, a: 3, b: 2 },
  { n: 20, a: 2, b: 5 },
  { n: 24, a: 2, b: 6 },
  { n: 27, a: 3, b: 3 },
  { n: 28, a: 2, b: 7 },
  { n: 32, a: 4, b: 2 },
  { n: 40, a: 2, b: 10 },
  { n: 45, a: 3, b: 5 },
  { n: 48, a: 4, b: 3 },
  { n: 50, a: 5, b: 2 },
  { n: 54, a: 3, b: 6 },
  { n: 63, a: 3, b: 7 },
  { n: 72, a: 6, b: 2 },
  { n: 75, a: 5, b: 3 },
  { n: 80, a: 4, b: 5 },
  { n: 90, a: 3, b: 10 },
  { n: 98, a: 7, b: 2 },
  { n: 108, a: 6, b: 3 },
  { n: 125, a: 5, b: 5 },
  { n: 128, a: 8, b: 2 },
  { n: 147, a: 7, b: 3 },
  { n: 150, a: 5, b: 6 },
  { n: 162, a: 9, b: 2 },
  { n: 180, a: 6, b: 5 },
  { n: 200, a: 10, b: 2 },
  { n: 242, a: 11, b: 2 },
  { n: 300, a: 10, b: 3 },
];

function makeRadicalOptions(entry: RadicalEntry): QuestionOption[] {
  const correctKey = `${entry.a}√${entry.b}`;
  const seen = new Set<string>([correctKey]);
  const list: Array<{ a: number; b: number }> = [{ a: entry.a, b: entry.b }];

  const distractorPairs: Array<[number, number]> = [
    [entry.a + 1, entry.b],
    [Math.max(2, entry.a - 1), entry.b],
    [entry.a, entry.b === 2 ? 3 : 2],
    [entry.a, entry.b === 3 ? 5 : 3],
    [entry.b, entry.a],
    [entry.a + 2, entry.b],
    [Math.max(2, entry.a - 2), entry.b === 2 ? 3 : 2],
  ];

  if (entry.a % 2 === 0 && entry.a >= 4) {
    distractorPairs.unshift([entry.a / 2, entry.b * 4]);
  }

  for (const [da, db] of shuffle(distractorPairs)) {
    if (list.length >= 4) break;
    if (da < 2 || db < 2) continue;
    const k = `${da}√${db}`;
    if (!seen.has(k)) {
      seen.add(k);
      list.push({ a: da, b: db });
    }
  }

  return shuffle(list).map((item) => ({
    id: `${item.a}√${item.b}`,
    label: `${item.a}√${item.b}`,
    parts: radicalParts(item.a, item.b),
  }));
}

function generateSquareRootQuestion(difficulty: Difficulty): Question {
  const roll = randInt(0, 9);
  const [sqLo, sqHi] =
    difficulty === 'warmup'
      ? [11, 16]
      : difficulty === 'master'
      ? [15, 25]
      : [11, 25];

  const radicalPool =
    difficulty === 'warmup'
      ? CLASSIC_RADICALS.filter((r) => r.n <= 75)
      : difficulty === 'master'
      ? CLASSIC_RADICALS.filter((r) => r.n >= 72)
      : CLASSIC_RADICALS;

  if (roll <= 2) {
    const n = randInt(sqLo, sqHi);
    const sq = n * n;
    const candidates = [
      (n - 1) ** 2,
      (n + 1) ** 2,
      sq + 10,
      sq - 10,
      sq + 20,
      sq - 20,
      n === 13 ? 196 : n === 14 ? 169 : sq + 12,
    ];
    return {
      key: `sq-fwd-${n}`,
      category: 'squares-roots',
      prompt: {
        label: 'Tam Kare (11–25)',
        parts: [
          { type: 'power', base: String(n), exp: '2' },
          { type: 'text', value: ' = ' },
          { type: 'blank' },
        ],
      },
      hybridKind: 'number',
      supportsInput: true,
      correctAnswer: String(sq),
      displayAnswer: String(sq),
      tip: `${n} × ${n} = ${sq} (son rakamı ${(n % 10) ** 2 % 10})`,
      options: makeNumericOptions(sq, candidates),
    };
  }

  if (roll <= 4) {
    const n = randInt(sqLo, sqHi);
    const sq = n * n;
    const candidates = [n - 2, n - 1, n + 1, n + 2, n === 13 ? 14 : 13];
    return {
      key: `sq-rev-${n}`,
      category: 'squares-roots',
      prompt: {
        label: 'Tam Kare Kök',
        parts: [
          { type: 'sqrt', value: String(sq) },
          { type: 'text', value: ' = ' },
          { type: 'blank' },
        ],
      },
      hybridKind: 'number',
      supportsInput: true,
      correctAnswer: String(n),
      displayAnswer: String(n),
      tip: `${n}² = ${sq} olduğundan √${sq} = ${n}`,
      options: makeNumericOptions(n, candidates),
    };
  }

  if (roll <= 8) {
    const entry = pick(radicalPool);
    const ans = `${entry.a}√${entry.b}`;
    return {
      key: `rad-simp-${entry.n}`,
      category: 'squares-roots',
      prompt: {
        label: 'a√b Dönüşümü',
        parts: [
          { type: 'sqrt', value: String(entry.n) },
          { type: 'text', value: ' = ' },
          { type: 'blank', text: 'a√b' },
        ],
      },
      hybridKind: 'choice',
      supportsInput: true,
      correctAnswer: ans,
      radicalAnswer: [entry.a, entry.b],
      displayAnswer: ans,
      tip: `√${entry.n} = √(${entry.a * entry.a} × ${entry.b}) = ${entry.a}√${entry.b}`,
      options: makeRadicalOptions(entry),
    };
  }

  const entry = pick(radicalPool);
  const candidates = [
    entry.a * entry.b,
    (entry.a + 1) * (entry.a + 1) * entry.b,
    Math.max(4, (entry.a - 1) * (entry.a - 1) * entry.b),
    entry.n + entry.b * 4,
    entry.n - entry.b * 4,
  ];
  return {
    key: `rad-in-${entry.n}`,
    category: 'squares-roots',
    prompt: {
      label: 'Kök İçine Alma',
      parts: [
        { type: 'radical', coeff: String(entry.a), radicand: String(entry.b) },
        { type: 'text', value: ' = ' },
        { type: 'sqrt', value: '?', highlightInside: true },
      ],
    },
    hybridKind: 'number',
    supportsInput: true,
    correctAnswer: String(entry.n),
    displayAnswer: `√${entry.n}`,
    tip: `${entry.a} içeri ${entry.a * entry.a} olarak girer: ${entry.a * entry.a} × ${entry.b} = ${entry.n}`,
    options: makeNumericOptions(entry.n, candidates),
  };
}

// ============================================================================
// 4. TUZAK SAYILAR
// ============================================================================

interface TrapEntry {
  n: number;
  p1: number;
  p2: number;
  hint: string;
}

const TRAP_NUMBERS: TrapEntry[] = [
  { n: 51, p1: 3, p2: 17, hint: '5 + 1 = 6 → 3’e bölünür: 3 × 17' },
  { n: 57, p1: 3, p2: 19, hint: '5 + 7 = 12 → 3’e bölünür: 3 × 19' },
  { n: 69, p1: 3, p2: 23, hint: '6 + 9 = 15 → 3’e bölünür: 3 × 23' },
  { n: 87, p1: 3, p2: 29, hint: '8 + 7 = 15 → 3’e bölünür: 3 × 29' },
  { n: 91, p1: 7, p2: 13, hint: '70 + 21 = 91 → 7 × 13 (en ünlü LGS tuzağı!)' },
  { n: 93, p1: 3, p2: 31, hint: '9 + 3 = 12 → 3’e bölünür: 3 × 31' },
  { n: 111, p1: 3, p2: 37, hint: '1 + 1 + 1 = 3 → 3 × 37' },
  { n: 119, p1: 7, p2: 17, hint: '70 + 49 = 119 → 7 × 17' },
  { n: 121, p1: 11, p2: 11, hint: '11² = 121 → 11 × 11' },
  { n: 133, p1: 7, p2: 19, hint: '70 + 63 = 133 → 7 × 19' },
  { n: 143, p1: 11, p2: 13, hint: '11 × 13 = 143 (1+3 = 4 ortada!)' },
  { n: 161, p1: 7, p2: 23, hint: '140 + 21 = 161 → 7 × 23' },
  { n: 169, p1: 13, p2: 13, hint: '13² = 169 → 13 × 13' },
  { n: 187, p1: 11, p2: 17, hint: '11 × 17 = 187 (1+7 = 8 ortada!)' },
  { n: 203, p1: 7, p2: 29, hint: '210 − 7 = 203 → 7 × 29' },
  { n: 209, p1: 11, p2: 19, hint: '220 − 11 = 209 → 11 × 19' },
  { n: 221, p1: 13, p2: 17, hint: '13 × 17 = 221 (15² − 2²)' },
  { n: 247, p1: 13, p2: 19, hint: '260 − 13 = 247 → 13 × 19' },
];

const TRUE_PRIMES = [
  53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139,
];

function generateTrapQuestion(
  answerStyle: AnswerStyle,
  difficulty: Difficulty
): Question {
  const trapPool =
    difficulty === 'warmup'
      ? TRAP_NUMBERS.filter((t) => t.n <= 121)
      : difficulty === 'master'
      ? TRAP_NUMBERS.filter((t) => t.n >= 91)
      : TRAP_NUMBERS;

  const roll = answerStyle === 'input' ? 0 : randInt(0, 2);

  if (roll === 0) {
    const entry = pick(trapPool);
    const askSecond = Math.random() < 0.75;
    const given = askSecond ? entry.p1 : entry.p2;
    const missing = askSecond ? entry.p2 : entry.p1;
    const candidates = [missing - 2, missing + 2, missing - 4, missing + 4, missing + 6].filter(
      (x) => x > 1
    );

    return {
      key: `trap-miss-${entry.n}-${given}`,
      category: 'traps',
      prompt: {
        label: 'Tuzak Çarpanı Bul',
        parts: [
          { type: 'highlight', value: String(entry.n) },
          { type: 'text', value: ` = ${given} × ` },
          { type: 'blank' },
        ],
      },
      hybridKind: 'number',
      supportsInput: true,
      correctAnswer: String(missing),
      displayAnswer: String(missing),
      tip: entry.hint,
      options: makeNumericOptions(missing, candidates),
    };
  }

  if (roll === 1) {
    const entry = pick(trapPool);
    const correctLabel = `${entry.p1} × ${entry.p2}`;
    const seen = new Set<string>([correctLabel]);
    const distractorLabels: string[] = [];

    const candidates: Array<[number, number]> = [
      [entry.p1, entry.p2 + 2],
      [entry.p1, Math.max(3, entry.p2 - 2)],
      [entry.p1 === 3 ? 7 : 3, entry.p2],
      [entry.p1 === 7 ? 11 : 7, Math.max(3, entry.p2 - 4)],
      [entry.p1 + 2, entry.p2 - 2],
    ];

    for (const [a, b] of shuffle(candidates)) {
      if (distractorLabels.length >= 2) break;
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      const lbl = `${lo} × ${hi}`;
      if (lo * hi !== entry.n && lo >= 2 && !seen.has(lbl)) {
        seen.add(lbl);
        distractorLabels.push(lbl);
      }
    }

    const options: QuestionOption[] = shuffle([
      { id: correctLabel, label: correctLabel },
      ...distractorLabels.map((lbl) => ({ id: lbl, label: lbl })),
      { id: 'Asal sayıdır', label: 'Asal sayıdır' },
    ]);

    return {
      key: `trap-fac-${entry.n}`,
      category: 'traps',
      prompt: {
        label: 'Çarpanlarını Ayıkla',
        parts: [
          { type: 'highlight', value: String(entry.n) },
          { type: 'text', value: ' sayısı nedir?' },
        ],
      },
      hybridKind: 'choice',
      supportsInput: false,
      correctAnswer: correctLabel,
      displayAnswer: correctLabel,
      tip: entry.hint,
      options,
    };
  }

  const isTrap = Math.random() < 0.62;
  if (isTrap) {
    const entry = pick(trapPool);
    return {
      key: `trap-bool-${entry.n}`,
      category: 'traps',
      prompt: {
        label: 'Asal mı, Tuzak mı?',
        parts: [{ type: 'highlight', value: String(entry.n) }],
      },
      hybridKind: 'choice',
      supportsInput: false,
      correctAnswer: 'Tuzak (Bileşik)',
      displayAnswer: `Tuzak (${entry.p1} × ${entry.p2})`,
      tip: entry.hint,
      options: [
        { id: 'Asal', label: 'Asal' },
        { id: 'Tuzak (Bileşik)', label: 'Tuzak (Bileşik)' },
      ],
    };
  }

  const prime = pick(TRUE_PRIMES);
  return {
    key: `trap-prime-${prime}`,
    category: 'traps',
    prompt: {
      label: 'Asal mı, Tuzak mı?',
      parts: [{ type: 'highlight', value: String(prime) }],
    },
    hybridKind: 'choice',
    supportsInput: false,
    correctAnswer: 'Asal',
    displayAnswer: 'Asal',
    tip: `${prime} sadece 1 ve kendisine bölünür — gerçek asal sayıdır!`,
    options: [
      { id: 'Asal', label: 'Asal' },
      { id: 'Tuzak (Bileşik)', label: 'Tuzak (Bileşik)' },
    ],
  };
}

// ============================================================================
// PUBLIC GENERATOR
// ============================================================================

export function generateQuestion(
  category: CategoryId,
  answerStyle: AnswerStyle,
  recentKeys: string[] = [],
  difficulty: Difficulty = 'standard',
  weakSpotPool: WeakSpot[] = []
): Question {
  // Weak spots dedicated drill mode
  if (category === 'weak-spots') {
    const playable = weakSpotPool
      .map((ws) => ws.questionSnapshot)
      .filter((q): q is Question => Boolean(q));

    if (playable.length > 0) {
      const fresh = playable.filter((q) => !recentKeys.slice(-2).includes(q.key));
      const chosen = pick(fresh.length > 0 ? fresh : playable);
      return {
        ...chosen,
        options: shuffle(chosen.options),
        isRetry: true,
      };
    }
    // Fallback to mixed if all weak spots have been cleared
    return generateQuestion('mixed', answerStyle, recentKeys, difficulty);
  }

  const pickConcrete = (): ConcreteCategoryId =>
    category === 'mixed' ? pick(CONCRETE_CATEGORIES) : category;

  let best: Question | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const cat = pickConcrete();
    let q: Question;
    switch (cat) {
      case 'multiples':
        q = generateMultipleQuestion(answerStyle, difficulty);
        break;
      case 'powers':
        q = generatePowerQuestion(difficulty);
        break;
      case 'squares-roots':
        q = generateSquareRootQuestion(difficulty);
        break;
      case 'traps':
        q = generateTrapQuestion(answerStyle, difficulty);
        break;
    }
    best = q;
    if (!recentKeys.includes(q.key)) {
      return q;
    }
  }
  return best!;
}

export function resolveInputKind(
  question: Question,
  answerStyle: AnswerStyle
): 'choice' | 'number' | 'radical' {
  if (answerStyle === 'choice') return 'choice';
  if (answerStyle === 'input') {
    if (question.radicalAnswer) return 'radical';
    if (question.supportsInput) return 'number';
    return 'choice';
  }
  return question.hybridKind;
}
