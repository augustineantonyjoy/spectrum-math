# RAD — Reya’s Math Lab

A bright, animated decimal learning app for fifth grade. Built with vanilla JavaScript, HTML, and CSS; no AI API, framework, database, or package installation is required.

## Run locally

Requires Node.js 20 or newer.

```sh
npm run dev
```

Open http://127.0.0.1:5173. To use a different port: `PORT=5174 npm run dev`.

For an iPad on the same trusted Wi-Fi network, run `HOST=0.0.0.0 npm run dev` and open `http://<your-Mac-local-IP>:5173` on the iPad. The Mac must remain awake. This is a local development server, not a public hosting service.

## Deploy on Vercel

Import this GitHub repository into Vercel. The included `vercel.json` sets the framework to Other, validates JavaScript with `npm run check`, and publishes `dist/`. No environment variables or API keys are needed.

## Family name and celebrations

RAD stands for Reya, Amma, and Dada. In practice, correct answers get a polar-bear cheer and confetti; wrong answers get a brief friendly tiger chase. Completed tests get a bear dance, shooting stars, and balloons, with a replay button. Test questions still hide correctness until submission. Sixty-frame sprite sequences animate the bear’s arms and legs and the tiger’s gallop. The chase also changes their eyebrows, eyes, and mouths. Dance and running loops take two seconds. The chase travels across the scene over eight seconds. All rewards respect the motion toggle and system reduced-motion preference.

The existing browser-storage key is intentionally unchanged to preserve progress. Character artwork and the full generation prompt are documented in `docs/artwork.md`.

## What works

- Nine decimal topics: place value, expanded form, comparison/order, rounding, addition, subtraction, multiplication, division, and science word problems.
- Easy, medium, hard, and adaptive practice; ten questions per practice session.
- A 12-question starting-point check with three easier follow-ups chosen from the initial responses.
- Specific hints, one-step-at-a-time worked solutions, animated place charts, number lines, hundred grids, and aligned calculations.
- A configurable 25-question unit test: select topics, difficulty, and no timer or 20/30/45/60 minutes. Revisit questions and review worked solutions after submission.
- Deadline-based timing survives reloads and tab switching; answers save as typed.
- Numeric, comparison-symbol, and ordered-list free responses. Equivalent decimals are accepted. No multiple-choice questions.
- Non-repeating question generation tracked in this browser. Tests verify 250 unique questions for every topic at every difficulty.
- Recent per-topic independent accuracy, practice recommendations, completed-session review, and reduced motion.

## Data and limits

Everything is stored locally under `decimal-lab-v1-release` in the current browser. Each device/origin has separate history. Clearing browser storage removes progress and non-repeat history. The app retains 2,000 attempts and 30 completed missions. When storage is unavailable, practice still works in memory and a notice explains the limit.

The diagnostic is a practice aid, not a validated assessment or NWEA MAP simulator. A small sample is marked provisional. Difficulty levels are authored approximations; they have not been calibrated against a full Spectrum edition or the classroom's test.

Questions and explanations are original. The topic scope was informed by the publisher's sample:
https://images.carsondellosa.com/media/cd/pdfs/Activities/FR01804.pdf

Not affiliated with Spectrum, Carson Dellosa, NWEA, or the school. No student personal information is required, and no answers are sent to an AI service. The design uses Google Fonts with system-font fallbacks.

## Project structure

- `dist/index.html` — homepage and app shell
- `dist/style.css` — responsive design, teaching visuals, motion
- `dist/app.js` — learning flows, state, persistence, test timer, progress
- `dist/math.js` — original problem generators and answer validation
- `tests/math.test.mjs` — deterministic generation, arithmetic, grading, and non-repetition checks
- `server.mjs` — dependency-free development server
- `vercel.json` — static hosting configuration for Vercel

Static assets in `dist/` are the authored source and can be served directly. There is no compilation step.

## Checks

```sh
npm test
npm run check
```

Browser QA covers diagnostic completion, wrong-answer hints, equivalent decimal answers, worked visuals, test submission with unanswered questions, answer persistence across reloads, and responsive laptop/iPad layouts.
