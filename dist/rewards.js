// Decorative rewards never change an answer, score, or test timer.
// Warm the sprite sheets before the learner reaches their first answer.
const spriteSheets = ["bear-dance-60", "bear-run-60", "tiger-run-60"];
const spriteReady = Promise.all(
  spriteSheets.map((name) => {
    const image = new Image();
    image.src = new URL(`./assets/${name}.png`, import.meta.url).href;
    return image.decode().catch(() => {});
  }),
);
const colors = ["#7960ef", "#36bdbc", "#ffbb52", "#f177b6", "#6eafff"];
function mascot(animal, extra = "") {
  return `<span class="mascot sprite-mascot ${animal} ${extra}" aria-hidden="true"></span>`;
}
function particles(kind, count) {
  return Array.from({ length: count }, (_, i) => {
    const x = (i * 37 + 13) % 100;
    return `<i class="reward-${kind}" aria-hidden="true" style="--x:${x}%;--delay:${(i % 9) * 0.13}s;--drift:${(i % 2 ? 1 : -1) * (20 + (i % 60))}px;--color:${colors[i % colors.length]};--turn:${i * 47}deg">${kind === "balloon" ? "🎈" : kind === "star" ? "✦" : ""}</i>`;
  }).join("");
}
// A single distance clock drives both travel and the pose sheet. Separate CSS
// easing used to slow the body in the middle while the paws kept cycling.
function playChase(scene, duration) {
  const pack = scene.querySelector(".chase-pack");
  const runners = [...pack.querySelectorAll(".sprite-mascot")];
  const width = pack.getBoundingClientRect().width;
  const startX = -1.55 * width;
  const travel = 3.2 * width;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let started;
  function draw(now) {
    if (!scene.isConnected) return;
    if (
      document.body.classList.contains("reduce-motion") ||
      reducedMotion.matches
    ) {
      pack.style.transform = "none";
      runners.forEach((runner) => {
        runner.style.backgroundPosition = "0% 0%";
      });
      scene.classList.add("settled");
      return;
    }
    started ??= now;
    const progress = Math.min(1, (now - started) / duration);
    const distance = travel * progress;
    // One pass through the 60 poses over the whole crossing: no independent
    // repeating leg timer, and no accelerated travel between intermediate stops.
    const frame = Math.min(59, Math.floor((distance / travel) * 60));
    pack.style.transform = `translateX(${startX + distance}px)`;
    for (const runner of runners) {
      runner.style.backgroundPosition = `${((frame % 10) / 9) * 100}% ${Math.floor(frame / 10) * 20}%`;
    }
    if (progress < 1) scene.rewardFrame = requestAnimationFrame(draw);
    else {
      // Finish offscreen instead of snapping the running pair back to center.
      pack.style.visibility = "hidden";
      scene.classList.add("settled");
    }
  }
  pack.style.transform = `translateX(${startX}px)`;
  scene.rewardFrame = requestAnimationFrame(draw);
}
function play(scene, duration) {
  // Start at frame one only once all sheets have decoded. Never show partial art.
  clearTimeout(scene.rewardTimeout);
  cancelAnimationFrame(scene.rewardFrame);
  const playId = (scene.playId || 0) + 1;
  scene.playId = playId;
  scene.classList.add("settled");
  spriteReady.then(() => {
    if (!scene.isConnected || scene.playId !== playId) return;
    const track = scene.querySelector(".reward-track");
    track.replaceWith(track.cloneNode(true));
    scene.classList.remove("settled");
    if (scene.querySelector(".chase-pack")) {
      playChase(scene, duration);
      return;
    }
    scene.rewardTimeout = setTimeout(
      () => scene.classList.add("settled"),
      duration,
    );
  });
}
export function showAnswerReward(correct) {
  const card = document.querySelector(".question-card");
  if (!card) return;
  card.querySelector(".answer-reward")?.remove();
  const scene = document.createElement("div");
  scene.className = `answer-reward reward-scene ${correct ? "reward-success" : "reward-retry"}`;
  scene.innerHTML = `<div class="reward-track" role="img" aria-label="${correct ? "A happy polar bear celebrates with confetti." : "A grinning tiger playfully chases a surprised polar bear; their faces change as they run."}">${correct ? particles("confetti", 28) + mascot("polar-bear", "bear-cheer") : `<div class="chase-pack">${mascot("tiger", "tiger-run")}${mascot("polar-bear", "bear-run")}</div>`}</div><p>${correct ? "A big bear cheer for you, Reya!" : "A little chase, then another try. You’ve got this!"}</p>`;
  card.querySelector(".question-actions").before(scene);
  play(scene, 4000);
}
export function mountCompletionReward() {
  const hero = document.querySelector(".result-hero");
  if (!hero) return;
  const scene = document.createElement("div");
  scene.className = "reward-scene reward-finale";
  scene.innerHTML = `<div class="reward-track" role="img" aria-label="A polar bear dances under shooting stars and floating balloons to celebrate finishing the test.">${particles("confetti", 34)}${particles("star", 7)}${particles("balloon", 6)}${mascot("polar-bear", "bear-dance")}</div><p>You finished your mission. Time for a bear dance!</p><button type="button" class="subtle-button replay-reward">Replay celebration ✦</button>`;
  hero.querySelector("h1").after(scene);
  scene
    .querySelector("button")
    .addEventListener("click", () => play(scene, 7500));
  play(scene, 7500);
}
