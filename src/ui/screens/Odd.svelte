<script lang="ts">
// Odd One Out: one tap on the figure that differs. A wrong tap shows the right one calmly.
import { checkOdd, makeOddRound } from "../../core/odd";
import Figure from "../components/Figure.svelte";
import { focusOnMount } from "../focus";
import type { AppState } from "../state.svelte";

let { app }: { app: AppState } = $props();

/** The round is made once, when the screen opens (App re-creates the screen per round). */
function setUp() {
  const level = app.content.oddLevels[app.level - 1] ?? app.content.oddLevels[0];
  if (!level) throw new Error("no odd-one-out levels");
  return makeOddRound(level, app.rng);
}

const round = setUp();
let chosen = $state<number | null>(null);
const right = $derived(chosen !== null && checkOdd(round, chosen));
</script>

<div class="top">
  <h1 tabindex="-1" use:focusOnMount>{app.t("game_odd")}</h1>
  <p class="muted">
    {app.t("round", { current: (app.session?.results.length ?? 0) + 1, total: app.session?.plan.length ?? 0 })}
  </p>
</div>
<p class="message" aria-live="polite">
  {#if chosen === null}
    {app.content.prompts.odd_intro?.spoken}
  {:else if right}
    <span class="right">{app.t("right")}</span>
  {:else}
    <span class="wrong">{app.t("odd_wrong")}</span>
  {/if}
</p>
<ul class="grid" style={`--size: ${round.size}`} data-testid="grid">
  {#each round.cells as figure, i (i)}
    <li>
      <button
        aria-label={`Shape ${i + 1}`}
        data-figure={`${figure.shape} ${figure.scale} ${figure.turn} ${figure.mark}`}
        aria-pressed={chosen === i}
        disabled={chosen !== null}
        class:odd={chosen !== null && i === round.odd}
        onclick={() => (chosen = i)}
      >
        <Figure {figure} />
      </button>
    </li>
  {/each}
</ul>
{#if chosen !== null}
  <div class="actions">
    <button class="primary" onclick={() => app.finishRound(right)}>{app.lastRound ? app.t("finish") : app.t("next")}</button>
  </div>
{/if}

<style>
  .grid {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(var(--size), 1fr);
    gap: var(--gap);
    max-width: calc(var(--size) * 8rem);
  }
  .grid button {
    width: 100%;
    aspect-ratio: 1;
    padding: 0.6rem;
  }
  .grid button.odd {
    outline: 5px solid var(--right);
    outline-offset: 2px;
  }
  .right {
    color: var(--right);
  }
  .wrong {
    color: var(--wrong);
  }
</style>
