export const FRACTION_TOPICS = [
  {
    id: "f-simplify",
    name: "Equivalent & simplest form",
    symbol: "½",
    description: "Find equal fractions and simplify.",
    chapter: "SAME VALUE",
  },
  {
    id: "f-add",
    name: "Adding fractions",
    symbol: "⅓ + ¼",
    description: "Find a common denominator and add.",
    chapter: "EQUAL-SIZED PIECES",
  },
  {
    id: "f-mixed-add",
    name: "Mixed number + fraction",
    symbol: "2½ + ⅓",
    description: "Add unlike fractions and regroup a whole.",
    chapter: "PUT IT TOGETHER",
  },
  {
    id: "f-subtract",
    name: "Subtracting mixed numbers",
    symbol: "3½ − 1¼",
    description: "Use common denominators to find the difference.",
    chapter: "FIND THE DIFFERENCE",
  },
  {
    id: "f-regroup",
    name: "Subtract with regrouping",
    symbol: "4¼ − 2⅔",
    description: "Trade one whole for fractional pieces.",
    chapter: "TRADE A WHOLE",
  },
].map((t, i) => ({
  ...t,
  color: ["blue", "cyan", "purple", "pink", "green"][i],
}));
export const gcd = (a, b) => (b ? gcd(b, a % b) : a);
export const reduce = (n, d) => {
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
};
export function fractionText({ n, d }) {
  const w = Math.floor(n / d),
    r = n % d;
  return r ? `${w ? w + " " : ""}${r}/${d}` : String(w);
}
export function parseFraction(raw) {
  const s = String(raw).trim().replaceAll("⁄", "/");
  const m = s.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const w = Number(m[1] || 0),
      n = Number(m[2]),
      d = Number(m[3]);
    if (!d || ![w, n, d, w * d + n].every(Number.isSafeInteger)) return null;
    return reduce(w * d + n, d);
  }
  if (/^\d+$/.test(s) && Number.isSafeInteger(Number(s)))
    return { n: Number(s), d: 1 };
  return null;
}
export function gradeFraction(q, raw) {
  const a = parseFraction(raw);
  const parts = String(raw).trim().replaceAll("⁄", "/").match(/(\d+)\s*\/\s*(\d+)$/);
  const simplest = !parts || gcd(Number(parts[1]), Number(parts[2])) === 1;
  return a
    ? {
        valid: true,
        correct:
          (q.topic !== "f-simplify" || simplest) &&
          BigInt(a.n) * BigInt(q.answer.d) === BigInt(q.answer.n) * BigInt(a.d),
      }
    : {
        valid: false,
        message:
          "Type a fraction like 3/4, a mixed number like 2 1/3 (with a space), or a whole number. Denominators cannot be zero.",
      };
}
const integer = (a, b, r) => a + Math.floor(r() * (b - a + 1));
export function fractionProblem(topic, level, A, B) {
  const subtract = topic === "f-subtract" || topic === "f-regroup";
  const simplify = topic === "f-simplify";
  const common = (A.d * B.d) / gcd(A.d, B.d);
  const an = A.n * (common / A.d),
    bn = B.n * (common / B.d);
  const answer = simplify
    ? reduce(A.n, A.d)
    : reduce(subtract ? an - bn : an + bn, common);
  const rawA = `${Math.floor(A.n / A.d) ? Math.floor(A.n / A.d) + " " : ""}${A.n % A.d}/${A.d}`;
  const display = simplify
    ? `${A.n}/${A.d}`
    : `${rawA} ${subtract ? "−" : "+"} ${fractionText(B)}`;
  const steps = [];
  if (simplify) {
    const g = gcd(A.n, A.d);
    steps.push(
      `Find a number that divides both ${A.n} and ${A.d}: ${g}.`,
      `Divide both by ${g}: ${A.n} ÷ ${g} = ${A.n / g}; ${A.d} ÷ ${g} = ${A.d / g}.`,
      `The value stays the same: ${A.n}/${A.d} = ${fractionText(answer)}.`,
    );
  } else {
    const aw = Math.floor(A.n / A.d),
      bw = Math.floor(B.n / B.d),
      ar = an % common,
      br = bn % common;
    steps.push(
      `A common denominator for ${A.d} and ${B.d} is ${common}.`,
      `${rawA} = ${aw ? aw + " " : ""}${ar}/${common}; ${fractionText(B)} = ${bw ? bw + " " : ""}${br}/${common}. Multiply each numerator and denominator by the same number.`,
    );
    if (subtract && ar < br)
      steps.push(
        `Regroup one whole: ${aw} ${ar}/${common} = ${aw - 1} ${ar + common}/${common}. One whole is ${common}/${common}.`,
      );
    const whole = subtract ? aw - bw - (ar < br ? 1 : 0) : aw + bw;
    const num = subtract ? ar + (ar < br ? common : 0) - br : ar + br;
    steps.push(
      `${subtract ? "Subtract" : "Add"} the whole parts and numerators. Keep the denominator: ${whole} whole${whole === 1 ? "" : "s"} and ${num}/${common}.`,
    );
    if (num >= common)
      steps.push(
        `${num}/${common} contains ${Math.floor(num / common)} whole and ${num % common}/${common}. Add the extra whole to the whole-number part.`,
      );
    steps.push(
      `Simplify the fractional part. The answer is ${fractionText(answer)}.`,
    );
  }
  const q = {
    topic,
    level,
    type: "fraction",
    unit: "",
    prompt: simplify
      ? "Write this fraction in simplest form."
      : subtract
        ? "Find the difference. Simplify your answer."
        : "Find the sum. Simplify your answer.",
    display,
    answer,
    hint: simplify
      ? "Divide the numerator and denominator by the same common factor."
      : "Use equal-sized pieces first: find a common denominator. " +
        (subtract
          ? "If the top fraction is too small, trade one whole."
          : "Add the numerators, keeping the common denominator."),
    steps,
    visual: {
      kind: "fraction",
      a: A,
      b: simplify ? null : B,
      answer,
      common,
      subtract,
      simplify,
    },
  };
  q.key = JSON.stringify([topic, display]);
  return q;
}
export function makeFractionQuestion(topic, level = 1, r = Math.random) {
  const pool =
    level === 0
      ? [2, 3, 4, 5, 6, 8, 10, 12]
      : level === 1
        ? [2, 3, 4, 5, 6, 8, 10, 12]
        : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const d = pool[integer(0, pool.length - 1, r)];
  let e = pool[integer(0, pool.length - 2, r)];
  if (e === d) e = pool.at(-1);
  if (e === d) e = pool[0];
  let n = integer(1, d - 1, r),
    m = integer(1, e - 1, r);
  if (topic === "f-simplify") {
    const factor = integer(2, 30 + level * 20, r);
    return fractionProblem(
      topic,
      level,
      { n: n * factor, d: d * factor },
      { n: 0, d: 1 },
    );
  }
  if (topic === "f-regroup" && n * e === m * d) {
    n = 1;
    m = e - 1;
  }
  let aw = topic === "f-add" ? 0 : integer(1, level === 0 ? 10 : 25, r),
    bw = 0;
  if (topic === "f-subtract" || topic === "f-regroup") {
    // Choose fractions with the requested borrowing relationship without retries.
    if (n / d < m / e !== (topic === "f-regroup")) {
      [n, m] = [m, n];
      return fractionProblem(
        topic,
        level,
        { n: aw * e + n, d: e },
        { n: integer(0, aw - 1, r) * d + m, d },
      );
    }
    bw = integer(0, aw - 1, r);
  }
  return fractionProblem(
    topic,
    level,
    { n: aw * d + n, d },
    { n: bw * e + m, d: e },
  );
}
