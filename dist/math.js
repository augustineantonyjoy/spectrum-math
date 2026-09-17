export const TOPICS = [
  {
    id: "place",
    name: "Place value",
    symbol: "0.01",
    color: "blue",
    description: "Discover what each digit is worth.",
    chapter: "THE BUILDING BLOCKS",
  },
  {
    id: "expanded",
    name: "Expanded form",
    symbol: "＝",
    color: "cyan",
    description: "Take a number apart, one place at a time.",
    chapter: "LOOK INSIDE A NUMBER",
  },
  {
    id: "compare",
    name: "Compare & order",
    symbol: "< >",
    color: "purple",
    description: "Find the bigger picture in small numbers.",
    chapter: "SPOT THE DIFFERENCE",
  },
  {
    id: "round",
    name: "Rounding",
    symbol: "≈",
    color: "green",
    description: "Find the nearest whole, tenth, or hundredth.",
    chapter: "GET A LITTLE CLOSER",
  },
  {
    id: "add",
    name: "Adding decimals",
    symbol: "＋",
    color: "orange",
    description: "Line up your places and put it together.",
    chapter: "PUT IT TOGETHER",
  },
  {
    id: "subtract",
    name: "Subtracting decimals",
    symbol: "−",
    color: "pink",
    description: "Regroup, subtract, and see what remains.",
    chapter: "FIND THE DIFFERENCE",
  },
  {
    id: "multiply",
    name: "Multiplying decimals",
    symbol: "×",
    color: "purple",
    description: "Explore equal groups and decimal places.",
    chapter: "MAKE IT MULTIPLY",
  },
  {
    id: "divide",
    name: "Dividing decimals",
    symbol: "÷",
    color: "blue",
    description: "Split an amount into equal groups.",
    chapter: "SHARE THE DISCOVERY",
  },
  {
    id: "word",
    name: "Science word problems",
    symbol: "mL",
    color: "green",
    description: "Use your decimal skills in the science lab.",
    chapter: "MATH MEETS SCIENCE",
  },
];
export const LEVELS = ["Easy", "Medium", "Hard"];
export const fmt = (n, p = 3) => Number(n.toFixed(p)).toString();
const int = (a, b, r) => a + Math.floor(r() * (b - a + 1));
const value = (n, p) => fmt(n / 10 ** p, p);
const names = ["ones", "tenths", "hundredths", "thousandths"];
export function parseNumber(raw) {
  const s = String(raw).trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? (n === 0 ? 0 : n) : null;
}
export function validateAnswer(q, raw) {
  const s = String(raw).trim();
  if (!s)
    return {
      valid: false,
      message: "Type an answer first, or choose “I’m not sure yet.”",
    };
  if (q.type === "symbol")
    return /^[<>=]$/.test(s)
      ? { valid: true, correct: s === q.answer }
      : { valid: false, message: "Type one symbol: <, >, or =." };
  if (q.type === "order") {
    const bits = s.split(/[,;\s]+/).filter(Boolean);
    const ns = bits.map(parseNumber);
    if (ns.length !== q.answer.length || ns.some((n) => n === null))
      return {
        valid: false,
        message: "Type all three numbers, separated by commas.",
      };
    return { valid: true, correct: ns.every((n, i) => n === q.answer[i]) };
  }
  const n = parseNumber(s);
  if (n === null)
    return {
      valid: false,
      message: "Type a number, such as 0.75. Leave out units and commas.",
    };
  return { valid: true, correct: n === q.answer };
}
export function answerText(q) {
  return Array.isArray(q.answer)
    ? q.answer.map((n) => fmt(n)).join(", ")
    : String(q.answer);
}
export function makeQuestion(topic, level = 1, r = Math.random) {
  const d = Math.max(0, Math.min(2, level)),
    p = d + 1,
    S = 10 ** p;
  let q = {
    topic,
    level: d,
    type: "number",
    unit: "",
    hint: "",
    steps: [],
    visual: null,
  };
  if (topic === "place") {
    const places = d + 1,
      n = int(S, 99 * S - 1, r),
      text = (n / S).toFixed(places),
      col = int(1, places, r),
      digit = Number(text.split(".")[1][col - 1]);
    q = {
      ...q,
      prompt: `What is the value of the digit ${digit} in the ${names[col]} place?`,
      display: text,
      answer: digit / 10 ** col,
      hint: `The ${names[col]} place is ${col === 1 ? "the first" : col === 2 ? "the second" : "the third"} place after the decimal point.`,
      steps: [
        `Start at the decimal point in ${text}.`,
        `Find the ${names[col]} place. The digit there is ${digit}.`,
        `${digit} ${names[col]} = ${fmt(digit / 10 ** col)}.`,
      ],
      visual: { kind: "place", number: text },
    };
  } else if (topic === "expanded") {
    const whole = int(1, 99, r),
      a = int(1, 9, r),
      b = int(1, 9, r),
      c = d === 2 ? int(1, 9, r) : 0,
      n = whole + a / 10 + b / 100 + c / 1000,
      col = d === 0 ? 1 : d === 1 ? 2 : 3,
      parts = [whole, a / 10, b / 100, ...(c ? [c / 1000] : [])];
    q = {
      ...q,
      prompt: "Fill in the missing part of this expanded form.",
      display: `${fmt(n)} = ${parts.map((v, i) => (i === col ? "□" : fmt(v))).join(" + ")}`,
      answer: parts[col],
      hint: `The blank represents the ${names[col]} place.`,
      steps: [
        `Split ${fmt(n)} into whole numbers and decimal parts.`,
        `${fmt(n)} = ${parts.map((v) => fmt(v)).join(" + ")}.`,
        `The missing part is ${fmt(parts[col])}.`,
      ],
      visual: { kind: "place", number: fmt(n) },
    };
  } else if (topic === "compare") {
    if (d === 2 && r() < 0.5) {
      let nums = new Set();
      while (nums.size < 3) nums.add(int(1, 1999, r) / 1000);
      const arr = [...nums],
        sorted = [...arr].sort((a, b) => a - b);
      q = {
        ...q,
        type: "order",
        prompt: "Put these numbers in order, smallest to largest.",
        display: arr.map((v) => fmt(v)).join("   ·   "),
        answer: sorted,
        hint: "Line up the decimal points. Compare ones, then tenths, then hundredths, then thousandths.",
        steps: [
          `Write each with three decimal places: ${arr.map((v) => v.toFixed(3)).join(", ")}.`,
          `Compare from left to right. The first different place tells you which is smaller.`,
          `Smallest to largest: ${sorted.map((v) => fmt(v)).join(", ")}.`,
        ],
        visual: { kind: "compare", numbers: arr },
      };
    } else {
      const a = int(1, Math.min(2 * S - 1, 999), r) / S,
        b = r() < 0.15 ? a : int(1, Math.min(2 * S - 1, 999), r) / S,
        sign = a === b ? "=" : a > b ? ">" : "<",
        bs = a === b ? b.toFixed(p + 1) : fmt(b);
      q = {
        ...q,
        type: "symbol",
        prompt: "Fill in the blank with <, >, or =.",
        display: `${fmt(a)}  □  ${bs}`,
        answer: sign,
        hint: "More digits does not always mean a bigger number. Add trailing zeros to compare the same places.",
        steps: [
          `Write both with the same number of decimal places: ${a.toFixed(p + 1)} and ${b.toFixed(p + 1)}.`,
          `Compare matching places from left to right.${a === b ? " All matching places are equal." : ""}`,
          `${fmt(a)} ${sign} ${bs}.`,
        ],
        visual: { kind: "compare", numbers: [a, b] },
      };
    }
  } else if (topic === "round") {
    const target = d,
      scale = 10 ** (target + 1),
      n = int(1, 99 * scale, r),
      div = 10 ** target,
      x = n / scale,
      rounded = Math.floor((n + 5) / 10) / div,
      last = n % 10,
      low = Math.floor(n / 10) / div,
      high = low + 1 / div,
      place = target === 0 ? "whole number" : names[target].slice(0, -1);
    q = {
      ...q,
      prompt: `Round to the nearest ${place}.`,
      display: value(n, target + 1),
      answer: rounded,
      hint: `Look one place to the right of the ${target === 0 ? "ones" : names[target]} place. Is that digit 5 or more?`,
      steps: [
        `The two neighboring ${target === 0 ? "whole numbers" : names[target]} are ${fmt(low)} and ${fmt(high)}.`,
        `The next digit is ${last}. ${last >= 5 ? "It is 5 or more, so round up." : "It is less than 5, so round down."}`,
        `${fmt(x)} rounds to ${fmt(rounded)}.`,
      ],
      visual: { kind: "line", low, high, value: x },
    };
  } else if (topic === "add" || topic === "subtract") {
    let a = int(10, 99 * S, r),
      b = int(1, 50 * S, r);
    if (d > 0 && r() < 0.5) b = Math.floor(b / 10) * 10;
    if (topic === "subtract" && b > a) [a, b] = [b, a];
    const op = topic === "add" ? "+" : "−",
      A = a / S,
      B = b / S,
      result = (topic === "add" ? a + b : a - b) / S;
    q = {
      ...q,
      prompt: topic === "add" ? "Add the decimals." : "Subtract the decimals.",
      display: `${fmt(A)} ${op} ${fmt(B)}`,
      answer: result,
      hint: `Line up the decimal points.${topic === "subtract" ? " You may need to regroup." : " Add zeros so both numbers have the same decimal places."}`,
      steps: [
        `Line up the decimal points: ${A.toFixed(p)} and ${B.toFixed(p)}.`,
        `Think in ${names[p]}: ${a} ${op} ${b} = ${topic === "add" ? a + b : a - b}.`,
        `${topic === "add" ? "Add" : "Subtract"} from right to left, ${topic === "add" ? "carrying" : "regrouping"} when needed. Keep the decimal point in its column.`,
        `The answer is ${fmt(result)}.`,
      ],
      visual: { kind: "vertical", a: A, b: B, op, p, result },
    };
  } else if (topic === "multiply") {
    const pa = d === 0 ? 1 : 2,
      pb = d === 0 ? 0 : 1,
      a = int(2, d === 2 ? 999 : 99, r),
      b = int(2, d === 2 ? 99 : 9, r),
      A = a / 10 ** pa,
      B = b / 10 ** pb,
      result = (a * b) / 10 ** (pa + pb);
    q = {
      ...q,
      prompt: "Multiply the decimals.",
      display: `${fmt(A)} × ${fmt(B)}`,
      answer: result,
      hint: `First multiply as whole numbers. Then count the decimal places in both factors.`,
      steps: [
        `Ignore the decimal points for a moment: ${a} × ${b} = ${a * b}.`,
        `The written factors ${A.toFixed(pa)} and ${B.toFixed(pb)} have ${pa + pb} decimal place${pa + pb === 1 ? "" : "s"} altogether.`,
        `Divide ${a * b} by ${10 ** (pa + pb)} to restore those places.`,
        `The product is ${fmt(result)}.`,
      ],
      visual: {
        kind: "operation",
        text: `${a} × ${b} = ${a * b}`,
        result: fmt(result),
      },
    };
  } else if (topic === "divide") {
    const qp = d === 2 ? 2 : 1,
      qi = int(2, d === 2 ? 999 : 99, r),
      bi = int(2, d === 2 ? 29 : 9, r),
      bp = d === 0 ? 0 : 1,
      A = (qi * bi) / 10 ** (qp + bp),
      B = bi / 10 ** bp,
      result = qi / 10 ** qp;
    q = {
      ...q,
      prompt: "Divide into equal groups.",
      display: `${fmt(A)} ÷ ${fmt(B)}`,
      answer: result,
      hint: bp
        ? "Multiply both numbers by 10 to make the divisor a whole number. The quotient stays the same."
        : "Divide as usual, keeping track of the decimal point.",
      steps: [
        bp
          ? `Multiply both numbers by 10: ${fmt(A * 10)} ÷ ${bi}.`
          : `Share ${fmt(A)} into ${bi} equal groups.`,
        `In ${names[qp]}, divide ${qi * bi} by ${bi} to get ${qi}.`,
        `${qi} ${names[qp]} = ${fmt(result)}.`,
        `Check: ${fmt(result)} × ${fmt(B)} = ${fmt(A)}.`,
      ],
      visual: {
        kind: "operation",
        text: `${fmt(result)} × ${fmt(B)} = ${fmt(A)}`,
        result: fmt(result),
      },
    };
  } else if (topic === "word") {
    let a = int(10, 700, r),
      b = int(1, 300, r);
    if (b > a) [a, b] = [b, a];
    const A = a / 100,
      B = b / 100,
      mode = d === 2 ? int(0, 2, r) : int(0, 1, r),
      copies = int(2, 8, r);
    let prompt, result, steps, vis;
    if (mode === 0) {
      prompt = `A seedling grew ${fmt(A)} cm in one week and ${fmt(B)} cm the next week. How much did it grow altogether?`;
      result = (a + b) / 100;
      steps = [
        `“Altogether” means add: ${fmt(A)} + ${fmt(B)}.`,
        `Line up the decimal points: ${A.toFixed(2)} + ${B.toFixed(2)}.`,
        `The seedling grew ${fmt(result)} cm.`,
      ];
      vis = { kind: "vertical", a: A, b: B, op: "+", p: 2, result };
    } else if (mode === 1) {
      prompt = `A rock sample has a mass of ${fmt(A)} g. A scientist removes ${fmt(B)} g. What mass remains?`;
      result = (a - b) / 100;
      steps = [
        `“Remains” means subtract: ${fmt(A)} − ${fmt(B)}.`,
        `Line up the decimal points and regroup if needed.`,
        `The remaining mass is ${fmt(result)} g.`,
      ];
      vis = { kind: "vertical", a: A, b: B, op: "−", p: 2, result };
    } else {
      prompt = `A scientist has ${copies} samples of liquid, each ${fmt(A)} mL. She uses ${fmt(B)} mL from the total. How much liquid is left?`;
      result = (a * copies - b) / 100;
      steps = [
        `First find the total: ${copies} × ${fmt(A)} = ${fmt(A * copies)} mL.`,
        `Then subtract the amount used: ${fmt(A * copies)} − ${fmt(B)}.`,
        `There are ${fmt(result)} mL left.`,
      ];
      vis = { kind: "vertical", a: A * copies, b: B, op: "−", p: 2, result };
    }
    q = {
      ...q,
      prompt,
      display: "",
      answer: result,
      unit: mode === 0 ? "cm" : mode === 1 ? "g" : "mL",
      hint:
        mode === 0
          ? "What does “altogether” tell you to do?"
          : mode === 1
            ? "Removing some of a sample means subtracting."
            : "There are two steps: find the total liquid, then subtract the amount used.",
      steps,
      visual: vis,
    };
  } else throw new Error("Unknown topic");
  q.key = JSON.stringify([q.topic, q.prompt, q.display]);
  return q;
}
export function freshQuestion(topic, level, seen, r = Math.random) {
  for (let i = 0; i < 3000; i++) {
    const q = makeQuestion(topic, level, r);
    if (!seen.has(q.key)) {
      seen.add(q.key);
      return q;
    }
  }
  throw new Error(
    "You have explored all the questions at this level. Try another level or topic.",
  );
}
export function skillStats(records, topic) {
  const rows = records.filter((r) => r.topic === topic).slice(-20),
    independent = rows.filter((r) => r.firstCorrect && !r.helped).length;
  return {
    count: rows.length,
    independent,
    accuracy: rows.length ? independent / rows.length : 0,
    label:
      rows.length < 3
        ? "Still exploring"
        : independent / rows.length >= 0.8
          ? "Growing strong"
          : independent / rows.length >= 0.5
            ? "Getting there"
            : "Let’s practice",
  };
}
export function recommend(records) {
  const ranked = TOPICS.map((t) => ({ ...t, ...skillStats(records, t.id) }));
  return (
    ranked
      .filter((t) => t.count >= 1)
      .sort((a, b) => a.accuracy - b.accuracy)[0] ||
    ranked.find((t) => t.count === 0) ||
    ranked[0]
  );
}
