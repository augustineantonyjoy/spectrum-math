import test from "node:test";
import assert from "node:assert/strict";
import {
  FRACTION_TOPICS,
  fractionProblem,
  parseFraction,
  fractionText,
  gcd,
} from "../dist/fractions.js";
import { freshQuestion, validateAnswer, answerText } from "../dist/math.js";
let seed = 10941;
const rng = () =>
  (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
const fixtures = [
  ["5 2/9", "6/7", "6 5/63"],
  ["7 2/6", "1/12", "7 5/12"],
  ["1 1/10", "7/8", "1 39/40"],
  ["5 4/7", "1/9", "5 43/63"],
  ["2 1/2", "1/5", "2 7/10"],
  ["1 8/11", "2/8", "1 43/44"],
  ["10 6/10", "2/4", "11 1/10"],
  ["2 1/2", "5/6", "3 1/3"],
  ["6 6/7", "3/9", "7 4/21"],
  ["10 2/6", "5/12", "10 3/4"],
  ["1 4/11", "2/5", "1 42/55"],
  ["7 8/11", "3/5", "8 18/55"],
  ["7 3/10", "5/12", "7 43/60"],
  ["7 2/6", "1/4", "7 7/12"],
];
const differences = [
  ["4 1/2", "2 3/4", "1 3/4"],
  ["20 2/4", "19 7/10", "4/5"],
  ["20 4/5", "7 1/5", "13 3/5"],
  ["10 3/9", "8 1/4", "2 1/12"],
  ["15 1/6", "13 7/10", "1 7/15"],
  ["19 1/4", "17 4/8", "1 3/4"],
  ["12 2/8", "10 5/6", "1 5/12"],
  ["12 7/8", "2 1/6", "10 17/24"],
  ["8 9/12", "8 3/5", "3/20"],
  ["17 1/3", "1 1/4", "16 1/12"],
  ["19 7/10", "16 2/3", "3 1/30"],
  ["13 1/2", "10 7/8", "2 5/8"],
];
test("all 26 photographed worksheet questions match independently worked answers", () => {
  for (const [topic, rows] of [
    ["f-mixed-add", fixtures],
    ["f-subtract", differences],
  ])
    for (const [a, b, expected] of rows) {
      const q = fractionProblem(topic, 2, parseFraction(a), parseFraction(b));
      assert.equal(answerText(q), expected);
      assert.ok(validateAnswer(q, expected).correct);
    }
});
test("250 fresh fraction questions per topic and difficulty, exact cross-product oracle", () => {
  for (const t of FRACTION_TOPICS)
    for (let level = 0; level < 3; level++) {
      const seen = new Set();
      for (let i = 0; i < 250; i++) {
        const q = freshQuestion(t.id, level, seen, rng),
          { a, b, subtract } = q.visual,
          answer = q.answer;
        const numerator = b
          ? BigInt(a.n) * BigInt(b.d) +
            (subtract ? -1n : 1n) * BigInt(b.n) * BigInt(a.d)
          : BigInt(a.n);
        const denominator = b ? BigInt(a.d) * BigInt(b.d) : BigInt(a.d);
        assert.equal(
          BigInt(answer.n) * denominator,
          numerator * BigInt(answer.d),
        );
        assert.equal(gcd(answer.n, answer.d), 1);
        assert.ok(answer.n >= 0);
        assert.ok(validateAnswer(q, answerText(q)).correct);
        assert.equal(validateAnswer(q, `${answer.n * 3}/${answer.d * 3}`).correct, t.id !== "f-simplify");
        assert.equal(
          validateAnswer(q, `${answer.n + answer.d}/${answer.d}`).correct,
          false,
        );
        if (t.id === "f-regroup") {
          assert.ok((a.n % a.d) * b.d < (b.n % b.d) * a.d);
          assert.ok(q.steps.some((s) => s.startsWith("Regroup")));
        }
        if (t.id === "f-subtract")
          assert.ok((a.n % a.d) * b.d >= (b.n % b.d) * a.d);
      }
      assert.equal(seen.size, 250);
    }
});
test("fraction input handles mixed and improper answers without ambiguous parsing", () => {
  const q = { type: "fraction", answer: { n: 7, d: 3 } };
  for (const text of ["2 1/3", "7/3", "14/6", " 2 2/6 "])
    assert.equal(validateAnswer(q, text).correct, true);
  for (const text of [
    "2/0",
    "2 1/0",
    "2.1/3",
    "2/3/4",
    "2 1",
    "Infinity",
    "-1/3",
    "9007199254740993/3",
    "",
  ])
    assert.equal(validateAnswer(q, text).valid, false);
  assert.equal(fractionText(parseFraction("0 3/20")), "3/20");
});
