<script lang="ts">
// Sequences: press Watch, the tiles light up one by one, then tap them in the same order. A wrong
// tap ends the round calmly and numbers the right order on the tiles.
import { onDestroy } from "svelte";
import { checkSequence, makeSequenceRound, place } from "../../core/sequences";
import { tapGate } from "../../core/taps";
import { focusOnMount } from "../focus";
import type { AppState } from "../state.svelte";

let { app }: { app: AppState } = $props();

/** How long a tapped tile flashes. */
const FLASH_MS = 300;

/** The round is made once, when the screen opens (App re-creates the screen per round). */
function setUp() {
  const levels = app.content.sequenceLevels;
  const level = levels[app.level - 1] ?? levels[0];
  if (!level) throw new Error("no sequence levels");
  return { round: makeSequenceRound(level, app.rng), speakRepeat: app.firstOfGame };
}

const { round, speakRepeat } = setUp();
const tiles = Array.from({ length: round.size * round.size }, (_, i) => i);
const gate = tapGate();

let phase = $state<"ready" | "watch" | "repeat" | "feedback">("ready");
let lit = $state<number | null>(null);
let taps = $state<number[]>([]);
const result = $derived(checkSequence(round, taps));
const timers: ReturnType<typeof setTimeout>[] = [];

function later(ms: number, then: () => void) {
  timers.push(setTimeout(then, ms));
}

function name(tile: number): string {
  return app.t("tile", place(round, tile));
}

/** Light each tile for most of a step, with a short dark gap so a step is always visible. */
function watch() {
  phase = "watch";
  const on = Math.round(round.stepMs * 0.75);
  round.order.forEach((tile, i) => {
    later(i * round.stepMs + 400, () => (lit = tile));
    later(i * round.stepMs + 400 + on, () => (lit = null));
  });
  later(round.order.length * round.stepMs + 400, () => {
    phase = "repeat";
    if (speakRepeat) app.voice.say("sequences_repeat");
  });
}

function tap(tile: number) {
  if (phase !== "repeat" || !gate(String(tile), performance.now())) return;
  taps = [...taps, tile];
  lit = tile;
  later(FLASH_MS, () => {
    if (lit === tile) lit = null;
  });
  if (checkSequence(round, taps).done) {
    phase = "feedback"; // the numbers speak now: no flash left on
    lit = null;
  }
}

function number(tile: number): number | null {
  const at = round.order.indexOf(tile);
  return phase === "feedback" && !result.right && at >= 0 ? at + 1 : null;
}

onDestroy(() => {
  for (const timer of timers) clearTimeout(timer);
});
</script>

<div class="top">
  <h1 tabindex="-1" use:focusOnMount>{app.t("game_sequences")}</h1>
  <p class="muted">
    {app.t("round", { current: (app.session?.results.length ?? 0) + 1, total: app.session?.plan.length ?? 0 })}
  </p>
</div>
<p class="message" aria-live="polite">
  {#if phase === "ready"}
    {app.content.prompts.sequences_intro?.spoken}
  {:else if phase === "watch"}
    {app.t("watching")}
  {:else if phase === "repeat"}
    {app.content.prompts.sequences_repeat?.spoken}
  {:else if result.right}
    <span class="right">{app.t("right")}</span>
  {:else}
    <span class="wrong">{app.t("sequences_wrong")}</span>
  {/if}
</p>
<p class="sr-only" aria-live="assertive" data-testid="lit">
  {phase === "watch" && lit !== null ? app.t("tile_lit", place(round, lit)) : ""}
</p>
<ul class="grid" style={`--size: ${round.size}`} data-testid="tiles" data-order={round.order.join(" ")}>
  {#each tiles as tile (tile)}
    {@const n = number(tile)}
    <li>
      <button
        aria-label={name(tile)}
        disabled={phase !== "repeat"}
        class:lit={lit === tile}
        class:tapped={phase === "feedback" && taps.includes(tile)}
        onclick={() => tap(tile)}
      >
        {#if lit === tile}<span class="dot" aria-hidden="true"></span>{/if}
        {#if n !== null}<span class="number">{n}</span>{/if}
      </button>
    </li>
  {/each}
</ul>
<div class="actions">
  {#if phase === "ready"}
    <button class="primary" onclick={watch}>{app.t("watch")}</button>
  {:else if phase === "feedback"}
    <button class="primary" onclick={() => app.finishRound(result.right)}>
      {app.lastRound ? app.t("finish") : app.t("next")}
    </button>
  {/if}
</div>

<style>
  .grid {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(var(--size), 1fr);
    gap: var(--gap);
    max-width: calc(var(--size) * 7.5rem);
  }
  .grid button {
    width: 100%;
    aspect-ratio: 1;
    padding: 0;
    position: relative;
  }
  .grid button:disabled {
    cursor: default;
  }
  .grid button.lit {
    background: var(--primary);
    border-color: var(--text);
    border-width: calc(var(--border) + 4px);
  }
  .dot {
    display: block;
    width: 35%;
    aspect-ratio: 1;
    margin: auto;
    border-radius: 50%;
    background: var(--on-primary);
  }
  .number {
    font-size: 1.75rem;
    font-weight: 700;
  }
  .grid button.tapped {
    border-style: dashed;
  }
  .right {
    color: var(--right);
  }
  .wrong {
    color: var(--wrong);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
</style>
