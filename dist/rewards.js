// Decorative rewards never change an answer, score, or test timer.
const colors = ["#7960ef", "#36bdbc", "#ffbb52", "#f177b6", "#6eafff"];
function mascot(animal, extra = "") {
  return `<span class="mascot ${animal} ${extra}" aria-hidden="true"></span>`;
}
function particles(kind, count) {
  return Array.from({ length: count }, (_, i) => {
    const x = (i * 37 + 13) % 100;
    return `<i class="reward-${kind}" aria-hidden="true" style="--x:${x}%;--delay:${(i % 9) * 0.13}s;--drift:${(i % 2 ? 1 : -1) * (20 + (i % 60))}px;--color:${colors[i % colors.length]};--turn:${i * 47}deg">${kind === "balloon" ? "🎈" : kind === "star" ? "✦" : ""}</i>`;
  }).join("");
}
function play(scene, duration) {
  scene.classList.remove("settled");
  // Rebuild the visual track for a deliberate replay, preserving the button.
  const track = scene.querySelector(".reward-track");
  track.replaceWith(track.cloneNode(true));
  clearTimeout(scene.rewardTimeout);
  scene.rewardTimeout = setTimeout(
    () => scene.classList.add("settled"),
    duration,
  );
}
export function showAnswerReward(correct) {
  const card = document.querySelector(".question-card");
  if (!card) return;
  card.querySelector(".answer-reward")?.remove();
  const scene = document.createElement("div");
  scene.className = `answer-reward reward-scene ${correct ? "reward-success" : "reward-retry"}`;
  scene.innerHTML = `<div class="reward-track" role="img" aria-label="${correct ? "A happy polar bear celebrates with confetti." : "A friendly tiger playfully chases the polar bear."}">${correct ? particles("confetti", 28) + mascot("polar-bear", "bear-cheer") : `<div class="chase-pack">${mascot("tiger", "tiger-run")}${mascot("polar-bear", "bear-run")}</div>`}</div><p>${correct ? "A big bear cheer for you, Reya!" : "A little chase, then another try. You’ve got this!"}</p>`;
  card.querySelector(".question-actions").before(scene);
  play(scene, correct ? 3200 : 2800);
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
