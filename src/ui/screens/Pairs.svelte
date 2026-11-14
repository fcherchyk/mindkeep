<script lang="ts">
// Pairs: turn up two cards at a time; a matching pair stays up. Two that do not match stay up a
// moment, then turn back by themselves. No clock: only the misses count, and calmly.
import { onDestroy } from "svelte";
import {
  checkPairs,
  flip,
  isDone,
  makePairsRound,
  mismatched,
  startPairs,
  TURN_BACK_MS,
  turnBack,
} from "../../core/pairs";
import { tapGate } from "../../core/taps";
import ItemTile from "../components/ItemTile.svelte";
import { focusOnMount } from "../focus";
import type { AppState } from "../state.svelte";

let { app }: { app: AppState } = $props();

/** The round is made once, when the screen opens (App re-creates the screen per round). */
function setUp() {
  const levels = app.content.pairsLevels;
  const level = levels[app.level - 1] ?? levels[0];
  if (!level) throw new Error("no pairs levels");
  return {
    round: makePairsRound(level, app.content.items, app.rng),
    words: new Map(app.content.items.map((item) => [item.id, item.word])),
  };
}

const { round, words } = setUp();
const gate = tapGate();
let state = $state(startPairs(round));
const done = $derived(isDone(state));
const result = $derived(done ? checkPairs(round, state) : null);
let timer: ReturnType<typeof setTimeout> | undefined;

function turn(index: number) {
  if (!gate(String(index), performance.now())) return;
  state = flip(round, state, index);
  if (mismatched(state)) {
    timer = setTimeout(() => {
      state = turnBack(state);
    }, TURN_BACK_MS);
  }
}

onDestroy(() => clearTimeout(timer));
</script>

<div class="top">
  <h1 tabindex="-1" use:focusOnMount>{app.t("game_pairs")}</h1>
  <p class="muted">
    {app.t("round", { current: (app.session?.results.length ?? 0) + 1, total: app.session?.plan.length ?? 0 })}
  </p>
</div>
<p class="message" aria-live="polite">
  {#if !result}
    {app.content.prompts.pairs_intro?.spoken}
  {:else if result.right}
    <span class="right">{app.t("right")}</span>
    {#if result.mismatches > 0}<span class="muted">{app.t("pairs_mismatches", { count: result.mismatches })}</span>{/if}
  {:else}
    <span class="wrong">{app.t("pairs_wrong")}</span>
    <span class="muted">{app.t("pairs_mismatches", { count: result.mismatches })}</span>
  {/if}
</p>
<ul class="cards" data-testid="cards">
  {#each round.cards as id, i (i)}
    {@const up = state.matched[i] || state.up.includes(i)}
    <li>
      <button
        aria-label={up ? (words.get(id) ?? id) : app.t("card_down", { number: i + 1 })}
        data-card={id}
        disabled={state.matched[i] || done}
        class:up
        class:matched={state.matched[i]}
        onclick={() => turn(i)}
      >
        {#if up}
          <ItemTile {id} word={words.get(id) ?? id} note={state.matched[i] ? "✓" : ""} tone="right" />
        {:else}
          <span class="back" aria-hidden="true"></span>
        {/if}
      </button>
    </li>
  {/each}
</ul>
{#if done}
  <div class="actions">
    <button class="primary" onclick={() => app.finishRound(result?.right ?? false)}>
      {app.lastRound ? app.t("finish") : app.t("next")}
    </button>
  </div>
{/if}

<style>
  .cards {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--gap);
    max-width: 40rem;
  }
  .cards button {
    width: 100%;
    min-height: 7.5rem;
    padding: 0.5rem 0.25rem;
  }
  .cards button.up {
    border-color: var(--primary);
  }
  .cards button.matched {
    border-width: calc(var(--border) + 3px);
    border-color: var(--right);
  }
  .cards button:disabled {
    opacity: 1;
  }
  .back {
    display: block;
    width: 100%;
    height: 5.5rem;
    border-radius: calc(var(--radius) - 0.25rem);
    background: repeating-linear-gradient(45deg, var(--selected) 0 0.6rem, var(--surface) 0.6rem 1.2rem);
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
  @media (max-width: 30rem) {
    .cards {
      gap: 0.5rem;
    }
    .cards button {
      min-height: 6.5rem;
    }
    .back {
      height: 4.5rem;
    }
  }
</style>
