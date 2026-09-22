// Articulated SVG characters. Feet stay planted in world coordinates during
// contact; swing feet return through a smooth arc. No generated pose frames.
const TAU = Math.PI * 2;
const STRIDE = 180; // SVG units travelled per complete stride
const GROUND = 186;
const mod = (n, d) => ((n % d) + d) % d;

export function footAtDistance(distance, offset = 0, duty = 0.5, lift = 42) {
  const phase = mod(distance / STRIDE + offset, 1);
  const reach = (STRIDE * duty) / 2;
  if (phase < duty)
    return { x: reach - phase * STRIDE, y: GROUND, contact: true };
  const t = (phase - duty) / (1 - duty);
  // Hermite endpoints match the backwards velocity of the planted foot.
  const m = -STRIDE * (1 - duty);
  const x =
    (2 * t * t * t - 3 * t * t + 1) * -reach +
    (t * t * t - 2 * t * t + t) * m +
    (-2 * t * t * t + 3 * t * t) * reach +
    (t * t * t - t * t) * m;
  return { x, y: GROUND - lift * Math.sin(Math.PI * t) ** 2, contact: false };
}

export function solveJoint(root, foot, upper, lower, bend = -1) {
  const dx = foot.x - root.x,
    dy = foot.y - root.y;
  const raw = Math.hypot(dx, dy);
  const distance = Math.max(
    Math.abs(upper - lower) + 0.001,
    Math.min(upper + lower - 0.001, raw),
  );
  const ux = raw ? dx / raw : 0,
    uy = raw ? dy / raw : 1;
  const along =
    (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const side = Math.sqrt(Math.max(0, upper * upper - along * along)) * bend;
  return {
    knee: {
      x: root.x + ux * along - uy * side,
      y: root.y + uy * along + ux * side,
    },
    foot: { x: root.x + ux * distance, y: root.y + uy * distance },
  };
}

function limb(name, fur, border, thickness, paw = true) {
  return `<g data-joint="${name}"><path class="rig-limb-edge" stroke="${border}" stroke-width="${thickness + 3}"/><path class="rig-limb-fill" stroke="${fur}" stroke-width="${thickness}"/>${paw ? `<ellipse class="rig-paw" rx="12" ry="6" fill="${fur}" stroke="${border}" stroke-width="1.5"/>` : `<circle class="rig-paw" r="9" fill="${fur}" stroke="${border}" stroke-width="1.5"/>`}</g>`;
}

export function chaseMarkup() {
  return `<div class="chase-pack"><svg class="chase-rig" viewBox="0 0 380 210" aria-hidden="true">
    <ellipse cx="98" cy="194" rx="57" ry="4" fill="#655493" opacity=".10"/>
    <ellipse cx="285" cy="194" rx="38" ry="4" fill="#655493" opacity=".10"/>
    <g data-animal="tiger">
      <path data-tail fill="none" stroke="#845137" stroke-width="15" stroke-linecap="round"/>
      <path data-tail fill="none" stroke="#f3a144" stroke-width="11" stroke-linecap="round"/>
      ${limb("tiger-back-far", "#d99040", "#946140", 15)}
      ${limb("tiger-front-far", "#d99040", "#946140", 14)}
      <g data-torso="tiger">
        <ellipse cx="90" cy="135" rx="53" ry="28" fill="#f7a846" stroke="#9c6237" stroke-width="2"/>
        <ellipse cx="95" cy="148" rx="35" ry="13" fill="#ffe4ae"/>
        <path d="M56 113q15 5 16 23l-12-8z M80 108q15 9 13 25l-11-10z M108 110q13 9 9 23l-10-12z" fill="#77513d"/>
      </g>
      ${limb("tiger-back-near", "#f7a846", "#9c6237", 17)}
      ${limb("tiger-front-near", "#f7a846", "#9c6237", 16)}
      <g data-head="tiger">
        <circle cx="126" cy="83" r="12" fill="#f7a846" stroke="#9c6237" stroke-width="2"/>
        <circle cx="159" cy="84" r="11" fill="#f7a846" stroke="#9c6237" stroke-width="2"/>
        <circle cx="126" cy="83" r="6" fill="#e5af84"/><circle cx="159" cy="84" r="5" fill="#e5af84"/>
        <path d="M116 103Q115 79 141 80Q168 78 172 105Q178 130 151 139Q120 141 116 103" fill="#ffb44f" stroke="#9c6237" stroke-width="2"/>
        <path d="M132 82l7 15 4-16 M151 81l-3 15 9-12 M117 100l15 7-14 3 M119 116l13 0-9 8" fill="#77513d"/>
        <ellipse cx="156" cy="119" rx="22" ry="15" fill="#fff0d0"/>
        <ellipse cx="142" cy="106" rx="4" ry="6" fill="#3d343c" data-eye="tiger"/>
        <ellipse cx="162" cy="105" rx="4" ry="6" fill="#3d343c" data-eye="tiger"/>
        <circle cx="143" cy="104" r="1.3" fill="white"/><circle cx="163" cy="103" r="1.3" fill="white"/>
        <path data-brow="tiger" d="M136 95q5-3 10 0 M157 94q5-3 9 0" fill="none" stroke="#77513d" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M153 115q6-4 12 0q-4 8-8 3z" fill="#875567"/>
        <path data-mouth="tiger" d="M146 123q11 13 21-1q-9 6-21 1" fill="#593f46"/>
        <path d="M135 117l-12-2m12 7-12 2m46-8 9-3m-9 8 10 2" stroke="#aa7b50" stroke-width="1.2" stroke-linecap="round"/>
      </g>
    </g>
    <g data-animal="bear" transform="translate(232 0)">
      ${limb("bear-leg-far", "#d5e4eb", "#9db8c7", 20)}
      ${limb("bear-arm-far", "#d5e4eb", "#9db8c7", 15, false)}
      <g data-torso="bear">
        <ellipse cx="49" cy="116" rx="31" ry="39" fill="#fffdf8" stroke="#a9c1ce" stroke-width="2"/>
        <ellipse cx="53" cy="119" rx="22" ry="29" fill="#eef5f6"/>
      </g>
      ${limb("bear-leg-near", "#fffdf8", "#a9c1ce", 22)}
      <g data-scarf>
        <path d="M37 80q-17 14-33 2l-5 11q20 13 42-5" fill="#399ace" stroke="#2679ae" stroke-width="1.5"/>
        <path d="M39 82l7 34 13-3-8-34" fill="#48b3e0" stroke="#2679ae" stroke-width="1.5"/>
        <path d="M24 78q27 17 53 0l1 13q-26 17-54-1z" fill="#399ace" stroke="#2679ae" stroke-width="1.5"/>
      </g>
      ${limb("bear-arm-near", "#fffdf8", "#a9c1ce", 17, false)}
      <g data-head="bear">
        <circle cx="27" cy="31" r="13" fill="#fffdf8" stroke="#a9c1ce" stroke-width="2"/>
        <circle cx="76" cy="31" r="12" fill="#fffdf8" stroke="#a9c1ce" stroke-width="2"/>
        <circle cx="27" cy="31" r="6" fill="#efced1"/><circle cx="76" cy="31" r="5" fill="#efced1"/>
        <path d="M19 51Q19 27 50 27Q84 26 87 56Q98 81 70 90Q30 94 19 65Z" fill="#fffdf8" stroke="#a9c1ce" stroke-width="2"/>
        <ellipse cx="79" cy="70" rx="21" ry="14" fill="#eaf2f4"/>
        <ellipse cx="53" cy="55" rx="4.5" ry="6" fill="#34384a" data-eye="bear"/>
        <ellipse cx="77" cy="53" rx="4.5" ry="6" fill="#34384a" data-eye="bear"/>
        <circle cx="54" cy="53" r="1.5" fill="white"/><circle cx="78" cy="51" r="1.5" fill="white"/>
        <path data-brow="bear" d="M46 43q6-4 12 0 M70 41q6-4 12 0" fill="none" stroke="#6d778b" stroke-width="2.2" stroke-linecap="round"/>
        <ellipse cx="89" cy="66" rx="9" ry="6" fill="#34384a"/>
        <path data-mouth="bear" d="M70 75q9 12 19 0q-10 4-19 0" fill="#614959"/>
        <ellipse cx="41" cy="70" rx="7" ry="4" fill="#f5cdd4" opacity=".7"/>
      </g>
    </g>
  </svg></div>`;
}

function bindRig(pack) {
  const find = (s) => pack.querySelector(s);
  const joints = new Map(
    [...pack.querySelectorAll("[data-joint]")].map((g) => [
      g.dataset.joint,
      {
        paths: [...g.querySelectorAll("path")],
        paw: g.querySelector(".rig-paw"),
      },
    ]),
  );
  function bone(name, root, target, upper, lower, bend) {
    const { knee, foot } = solveJoint(root, target, upper, lower, bend);
    const d = `M${root.x} ${root.y}L${knee.x} ${knee.y}L${foot.x} ${foot.y}`;
    const limb = joints.get(name);
    limb.paths.forEach((p) => p.setAttribute("d", d));
    limb.paw.setAttribute("transform", `translate(${foot.x} ${foot.y})`);
  }
  const bearHead = find('[data-head="bear"]'),
    tigerHead = find('[data-head="tiger"]');
  const bearTorso = find('[data-torso="bear"]'),
    tigerTorso = find('[data-torso="tiger"]');
  const scarf = find("[data-scarf]"),
    tails = [...pack.querySelectorAll("[data-tail]")];
  const bearEyes = [...pack.querySelectorAll('[data-eye="bear"]')];
  const tigerEyes = [...pack.querySelectorAll('[data-eye="tiger"]')];
  const bearMouth = find('[data-mouth="bear"]'),
    tigerMouth = find('[data-mouth="tiger"]');
  const bearBrow = find('[data-brow="bear"]'),
    tigerBrow = find('[data-brow="tiger"]');
  return (distance, progress) => {
    const phase = (distance / STRIDE) * TAU;
    const bearBob = -2 * (1 - Math.cos(phase * 2));
    const tigerBob = -3 * (1 - Math.cos(phase));
    bearTorso.setAttribute("transform", `translate(0 ${bearBob})`);
    bearHead.setAttribute("transform", `translate(0 ${bearBob * 0.6})`);
    scarf.setAttribute(
      "transform",
      `translate(0 ${bearBob}) rotate(${Math.sin(phase) * 3} 39 84)`,
    );
    tigerTorso.setAttribute("transform", `translate(0 ${tigerBob})`);
    tigerHead.setAttribute(
      "transform",
      `translate(0 ${tigerBob * 0.6}) rotate(${Math.sin(phase) * 2} 141 117)`,
    );
    for (const [side, offset] of [
      ["near", 0],
      ["far", 0.5],
    ]) {
      const foot = footAtDistance(distance, offset);
      bone(
        `bear-leg-${side}`,
        { x: 46, y: 141 + bearBob },
        { x: 46 + foot.x, y: foot.y },
        38,
        36,
        -1,
      );
      const swing = Math.cos(phase + offset * TAU);
      bone(
        `bear-arm-${side}`,
        { x: 52, y: 96 + bearBob },
        { x: 56 - 24 * swing, y: 121 + bearBob - 5 * Math.abs(swing) },
        22,
        22,
        1,
      );
    }
    for (const [part, x, offset, bend] of [
      ["back-near", 54, 0.48, 1],
      ["back-far", 54, 0.6, 1],
      ["front-near", 123, 0, -1],
      ["front-far", 123, 0.12, -1],
    ]) {
      const foot = footAtDistance(distance, offset, 0.24, 32);
      bone(
        `tiger-${part}`,
        { x, y: 148 + tigerBob },
        { x: x + foot.x, y: foot.y },
        32,
        30,
        bend,
      );
    }
    const tail = `M45 ${132 + tigerBob}Q15 ${130 + tigerBob} 18 ${102 + Math.sin(phase) * 6}Q20 81 7 ${85 + Math.sin(phase) * 8}`;
    tails.forEach((p) => p.setAttribute("d", tail));
    const surprise = Math.sin(Math.PI * progress) ** 4;
    const blink = 1 - 0.93 * Math.exp(-(((progress - 0.78) / 0.018) ** 2));
    bearEyes.forEach((e) => e.setAttribute("ry", (6 + 2 * surprise) * blink));
    tigerEyes.forEach((e) =>
      e.setAttribute("ry", (6 - 1.4 * surprise) * blink),
    );
    bearBrow.setAttribute("transform", `translate(0 ${-4 * surprise})`);
    tigerBrow.setAttribute("transform", `rotate(${4 * surprise} 152 96)`);
    const w = 9 - 4 * surprise,
      h = 3 + 4 * surprise;
    bearMouth.setAttribute(
      "d",
      `M${79 - w} 77C${79 - w} ${77 + h * 2} ${79 + w} ${77 + h * 2} ${79 + w} 77Q79 ${79 - 5 * surprise} ${79 - w} 77Z`,
    );
    tigerMouth.setAttribute(
      "d",
      `M146 123Q157 ${136 - 5 * surprise} 167 122Q157 128 146 123Z`,
    );
  };
}

export function playChase(scene, duration) {
  const pack = scene.querySelector(".chase-pack");
  const track = pack.parentElement;
  const width = pack.getBoundingClientRect().width;
  const scale = width / 380;
  const travel = track.clientWidth + width + 32;
  const startX = -travel / 2;
  const pose = bindRig(pack);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let started;
  pose(0, 0);
  pack.style.transform = `translateX(${startX}px)`;
  function draw(now) {
    if (!scene.isConnected) return;
    if (document.body.classList.contains("reduce-motion") || reduced.matches) {
      pack.style.transform = "none";
      pose(0, 0);
      scene.classList.add("settled");
      return;
    }
    started ??= now;
    const progress = Math.min(1, (now - started) / duration);
    const distance = travel * progress;
    pack.style.transform = `translateX(${startX + distance}px)`;
    pose(distance / scale, progress);
    if (progress < 1) scene.rewardFrame = requestAnimationFrame(draw);
    else {
      pack.style.visibility = "hidden";
      scene.classList.add("settled");
    }
  }
  scene.rewardFrame = requestAnimationFrame(draw);
}
