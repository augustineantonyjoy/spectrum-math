import test from "node:test";
import assert from "node:assert/strict";
import { footAtDistance, solveJoint } from "../dist/chase.js";

const close = (a, b, tolerance = 1e-6) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);

test("planted bear and tiger feet do not slide as the body travels", () => {
  for (const duty of [0.5, 0.24])
    for (const offset of [0, 0.12, 0.48, 0.5, 0.6]) {
      const positions = Array.from({ length: 20 }, (_, i) => {
        const distance = (2 - offset + duty * (0.05 + (0.9 * i) / 19)) * 180;
        const foot = footAtDistance(distance, offset, duty);
        assert.equal(foot.contact, true);
        close(foot.y, 186);
        return distance + foot.x;
      });
      positions.forEach((x) => close(x, positions[0]));
    }
});

test("foot position and velocity join continuously at takeoff and landing", () => {
  for (const duty of [0.5, 0.24])
    for (const phase of [duty, 1]) {
      const distance = phase * 180,
        step = 0.001;
      const before = footAtDistance(distance - step, 0, duty);
      const at = footAtDistance(distance, 0, duty);
      const after = footAtDistance(distance + step, 0, duty);
      close(before.x, after.x, 0.003);
      close(before.y, after.y, 0.001);
      close((at.x - before.x) / step, (after.x - at.x) / step, 0.002);
      close((at.y - before.y) / step, (after.y - at.y) / step, 0.002);
    }
});

test("joint lengths stay fixed and stance targets remain reachable throughout each gait", () => {
  for (const [duty, upper, lower, rootY] of [
    [0.5, 38, 36, 141],
    [0.24, 32, 30, 148],
  ]) {
    for (let d = 0; d < 180; d += 0.25) {
      const bob =
        duty === 0.5
          ? -2 * (1 - Math.cos((d / 180) * Math.PI * 4))
          : -3 * (1 - Math.cos((d / 180) * Math.PI * 2));
      const root = { x: 0, y: rootY + bob };
      const target = footAtDistance(d, 0, duty, duty === 0.5 ? 42 : 32);
      const result = solveJoint(root, target, upper, lower, -1);
      close(Math.hypot(result.knee.x - root.x, result.knee.y - root.y), upper);
      close(
        Math.hypot(
          result.foot.x - result.knee.x,
          result.foot.y - result.knee.y,
        ),
        lower,
      );
      if (target.contact) {
        close(result.foot.x, target.x);
        close(result.foot.y, target.y);
      }
    }
  }
});
