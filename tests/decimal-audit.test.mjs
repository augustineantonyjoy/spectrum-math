import test from "node:test";
import assert from "node:assert/strict";
import {
  TOPICS,
  makeQuestion,
  validateAnswer,
  answerText,
} from "../dist/math.js";
let seed = 8123;
const r = () =>
  (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
const rat = (s) => {
  const [a, b = ""] = String(s).split(".");
  return [BigInt(a + b), 10n ** BigInt(b.length)];
};
const equal = (a, b) => assert.equal(a[0] * b[1], b[0] * a[1]);
const op = (a, b, s) =>
  s === "+"
    ? [a[0] * b[1] + b[0] * a[1], a[1] * b[1]]
    : s === "−"
      ? [a[0] * b[1] - b[0] * a[1], a[1] * b[1]]
      : s === "×"
        ? [a[0] * b[0], a[1] * b[1]]
        : [a[0] * b[1], a[1] * b[0]];
test("audit 27,000 displayed decimal questions using independent integer arithmetic", () => {
  for (const topic of TOPICS)
    for (let level = 0; level < 3; level++)
      for (let i = 0; i < 1000; i++) {
        const q = makeQuestion(topic.id, level, r);
        assert.equal(validateAnswer(q, answerText(q)).correct, true);
        if (["add", "subtract", "multiply", "divide"].includes(topic.id)) {
          const [a, s, b] = q.display.split(" ");
          equal(rat(q.answer), op(rat(a), rat(b), s));
        }
        if (topic.id === "expanded") {
          const [lhs, rhs] = q.display.split(" = ");
          const sum = rhs
            .split(" + ")
            .map((x) => rat(x === "□" ? q.answer : x))
            .reduce((a, b) => op(a, b, "+"), [0n, 1n]);
          equal(rat(lhs), sum);
        }
        if (topic.id === "round") {
          const [n, d] = rat(q.display);
          const scale = 10n ** BigInt(level);
          const rounded = (2n * n * scale + d) / (2n * d);
          equal(rat(q.answer), [rounded, scale]);
        }
        if (topic.id === "place") {
          const col =
            ["tenths", "hundredths", "thousandths"].findIndex((n) =>
              q.prompt.includes(n),
            ) + 1;
          equal(rat(q.answer), [
            BigInt(q.display.split(".")[1][col - 1]),
            10n ** BigInt(col),
          ]);
        }
        if (topic.id === "word") {
          const nums = q.prompt.match(/\d+(?:\.\d+)?/g).map(rat);
          const expected =
            q.unit === "cm"
              ? op(nums[0], nums[1], "+")
              : q.unit === "g"
                ? op(nums[0], nums[1], "−")
                : op(op(nums[0], nums[1], "×"), nums[2], "−");
          equal(rat(q.answer), expected);
        }
        if (topic.id === "compare") {
          if (q.type === "order") {
            const ns = q.display
              .split("·")
              .map((s) => s.trim())
              .map(rat);
            const sorted = ns.sort((a, b) =>
              a[0] * b[1] < b[0] * a[1] ? -1 : 1,
            );
            q.answer.forEach((a, j) => equal(rat(a), sorted[j]));
          } else {
            const [a, b] = q.display.split("□").map((s) => rat(s.trim()));
            const diff = a[0] * b[1] - b[0] * a[1];
            assert.equal(q.answer, diff === 0n ? "=" : diff > 0n ? ">" : "<");
          }
        }
      }
});
