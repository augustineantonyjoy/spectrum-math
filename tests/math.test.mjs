import test from "node:test";
import assert from "node:assert/strict";
import {
  TOPICS,
  makeQuestion,
  freshQuestion,
  validateAnswer,
  answerText,
  parseNumber,
  skillStats,
  recommend,
} from "../dist/math.js";
let seed = 27451;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const close = (a, b) =>
  assert.ok(Math.abs(a - b) < 1e-8, `${a} should equal ${b}`);
test("at least ten 25-question sessions per topic and level without repeats", () => {
  for (const t of TOPICS) {
    for (let level = 0; level < 3; level++) {
      const seen = new Set();
      for (let i = 0; i < 250; i++) {
        const q = freshQuestion(t.id, level, seen, random);
        assert.equal(q.level, level);
        assert.equal(q.topic, t.id);
        assert.ok(q.steps.length >= 3);
        assert.equal(
          validateAnswer(q, answerText(q)).correct,
          true,
          JSON.stringify(q),
        );
      }
      assert.equal(seen.size, 250, `${t.id} level ${level}`);
    }
  }
});
test("generated arithmetic agrees with independent equation calculation", () => {
  for (const t of ["add", "subtract", "multiply", "divide"])
    for (let level = 0; level < 3; level++)
      for (let i = 0; i < 150; i++) {
        const q = makeQuestion(t, level, random),
          [as, op, bs] = q.display.split(" "),
          a = Number(as),
          b = Number(bs);
        const expected =
          op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : a / b;
        close(q.answer, expected);
        assert.ok(q.answer >= 0);
        assert.equal(validateAnswer(q, String(q.answer + 1)).correct, false);
      }
});
test("rounding and place-value answers agree with decimal digits", () => {
  for (let level = 0; level < 3; level++)
    for (let i = 0; i < 200; i++) {
      let q = makeQuestion("round", level, random);
      const digits = q.display.replace(".", "").padEnd(level + 2, "0");
      const number = Number(q.display),
        factor = 10 ** level;
      close(q.answer, Math.floor(number * factor + 0.50000001) / factor);
      q = makeQuestion("place", level, random);
      const names = ["ones", "tenths", "hundredths", "thousandths"],
        col = names.findIndex((n) => q.prompt.includes(n));
      close(q.answer, Number(q.display.split(".")[1][col - 1]) / 10 ** col);
    }
});
test("comparisons and sorting are correct", () => {
  for (let level = 0; level < 3; level++)
    for (let i = 0; i < 200; i++) {
      const q = makeQuestion("compare", level, random);
      if (q.type === "order") {
        const ns = q.display
          .split("·")
          .map(Number)
          .sort((a, b) => a - b);
        assert.deepEqual(q.answer, ns);
      } else {
        const [a, b] = q.display.split("□").map(Number);
        assert.equal(q.answer, a === b ? "=" : a > b ? ">" : "<");
      }
    }
});
test("science problems have independently correct answers and units", () => {
  for (let level = 0; level < 3; level++)
    for (let i = 0; i < 100; i++) {
      const q = makeQuestion("word", level, random),
        ns = q.prompt.match(/\d+(?:\.\d+)?/g).map(Number);
      const expected =
        q.unit === "cm"
          ? ns[0] + ns[1]
          : q.unit === "g"
            ? ns[0] - ns[1]
            : ns[0] * ns[1] - ns[2];
      close(q.answer, expected);
    }
});
test("grading accepts equivalent decimals but rejects ambiguous input", () => {
  const q = { type: "number", answer: 0.5 };
  for (const a of ["0.5", "0.50", ".5", " 0.500 ", "+0.5"])
    assert.equal(validateAnswer(q, a).correct, true);
  for (const a of [
    "",
    "0.5abc",
    "1/2",
    "Infinity",
    "NaN",
    "0,5",
    "0.5 mL",
    "0.5.0",
    "0x10",
    "5e-1",
  ])
    assert.equal(validateAnswer(q, a).valid, false);
  assert.equal(validateAnswer(q, "0.05").correct, false);
  assert.equal(validateAnswer(q, "0.5000000001").correct, false);
  assert.equal(
    validateAnswer({ type: "symbol", answer: "<" }, " < ").correct,
    true,
  );
  assert.equal(
    validateAnswer({ type: "symbol", answer: "<" }, "less than").valid,
    false,
  );
  assert.equal(
    validateAnswer({ type: "order", answer: [0.2, 0.4, 0.6] }, ".20, .40, .60")
      .correct,
    true,
  );
  assert.equal(
    validateAnswer({ type: "order", answer: [0.2, 0.4, 0.6] }, ".2,.4").valid,
    false,
  );
  assert.equal(parseNumber("-0"), 0);
});
test("helped answers do not inflate independent mastery; little data stays provisional", () => {
  const rows = [
    { topic: "add", firstCorrect: true, helped: true },
    { topic: "add", firstCorrect: true, helped: false },
  ];
  assert.equal(skillStats(rows, "add").independent, 1);
  assert.equal(skillStats(rows, "add").label, "Still exploring");
  rows.push({ topic: "add", firstCorrect: false, helped: true });
  assert.equal(skillStats(rows, "add").label, "Let’s practice");
  assert.equal(recommend(rows).id, "add");
});
