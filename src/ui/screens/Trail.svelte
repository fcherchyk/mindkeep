<script lang="ts">
// Trail: tap the circles in order, 1-2-3 or 1-A-2-B. A line joins each circle done to the one
// before. A wrong tap only gets a hint ("The next one is B."); there is no clock.
import { tapGate } from "../../core/taps";
import { checkTrail, isDone, makeTrailRound, startTrail, tapTrail } from "../../core/trail";
import { focusOnMount } from "../focus";
import type { AppState } from "../state.svelte";

let { app }: { app: AppState } = $props();

/** The round is made once, when the screen opens (App re-creates the screen per round). */
function setUp() {
  const levels = app.content.trailLevels;
  const level = levels[app.level - 1] ?? levels[0];
  if (!level) throw new Error("no trail levels");
  return makeTrailRound(level, app.rng);
}

const round = setUp();
const gate = tapGate();
let progress = $state(startTrail());
let hint = $state("");
const done = $derived(isDone(round, progress));
const result = $derived(done ? checkTrail(round, progress) : null);

function tap(index: number) {
  if (!gate(String(index), performance.now())) return;
  const before = progress;
  progress = tapTrail(round, progress, index);
  hint =
    progress.misses > before.misses
      ? app.t("trail_next", { label: round.labels[progress.done] ?? "" })
      : "";
}

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
</script>

<div class="top">
  <h1 tabindex="-1" use:focusOnMount>{app.t("game_trail")}</h1>
  <p class="muted">
    {app.t("round", { current: (app.session?.results.length ?? 0) + 1, total: app.session?.plan.length ?? 0 })}
  </p>
</div>
<p class="message" aria-live="polite">
  {#if !result}
    {hint || app.content.prompts.trail_intro?.spoken}
  {:else if result.right}
    <span class="right">{app.t("right")}</span>
  {:else}
    <span class="wrong">{app.t("trail_wrong")}</span>
    <span class="muted">{app.t("trail_misses", { count: result.misses })}</span>
  {/if}
</p>
<div class="board" data-testid="trail" data-labels={round.labels.join(" ")}>
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    {#each round.places.slice(1, progress.done) as to, i (i)}
      {@const from = round.places[i]}
      {#if from}
        <line x1={from.x * 100} y1={from.y * 100} x2={to.x * 100} y2={to.y * 100} />
      {/if}
    {/each}
  </svg>
  {#each round.labels as label, i (i)}
    {@const place = round.places[i]}
    <button
      style={`left: ${pct(place?.x ?? 0)}; top: ${pct(place?.y ?? 0)}`}
      aria-label={i < progress.done ? app.t("circle_done", { label }) : app.t("circle", { label })}
      class:done={i < progress.done}
      disabled={done}
      onclick={() => tap(i)}
    >
      {label}{#if i < progress.done}<span class="tick" aria-hidden="true">✓</span>{/if}
    </button>
  {/each}
</div>
{#if done}
  <div class="actions">
    <button class="primary" onclick={() => app.finishRound(result?.right ?? false)}>
      {app.lastRound ? app.t("finish") : app.t("next")}
    </button>
  </div>
{/if}

<style>
  .board {
    position: relative;
    width: 100%;
    max-width: 36rem;
    aspect-ratio: 1;
    margin: 0 auto;
    border: var(--border) solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  line {
    stroke: var(--primary);
    stroke-width: 4;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }
  .board button {
    position: absolute;
    transform: translate(-50%, -50%);
    width: clamp(var(--target), 18%, 5.5rem);
    min-width: 0;
    min-height: 0;
    aspect-ratio: 1;
    padding: 0;
    border-radius: 50%;
    font-size: 1.5rem;
    font-weight: 700;
  }
  .board button:disabled {
    cursor: default;
  }
  .board button.done {
    background: var(--selected);
    border-color: var(--primary);
    border-width: calc(var(--border) + 3px);
  }
  .tick {
    position: absolute;
    right: -0.2rem;
    top: -0.4rem;
    font-size: 1.1rem;
    color: var(--right);
  }
  .message .muted {
    display: block;
    font-weight: 400;
  }
  .right {
    color: var(--right);
  }
  .wrong {
    color: var(--wrong);
  }
</style>
