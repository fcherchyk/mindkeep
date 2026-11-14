<script lang="ts">
// Put the Steps in Order: tap the steps of an everyday task in the order you would do them. Undo
// takes the last one back. A step of another task may be among them: it is left out.
import { checkSteps, choose, makeStepsRound, undo } from "../../core/steps";
import { tapGate } from "../../core/taps";
import { focusOnMount } from "../focus";
import type { AppState } from "../state.svelte";

let { app }: { app: AppState } = $props();

/** The round is made once, when the screen opens (App re-creates the screen per round). */
function setUp() {
  const levels = app.content.stepsLevels;
  const level = levels[app.level - 1] ?? levels[0];
  if (!level) throw new Error("no steps levels");
  return makeStepsRound(level, app.content.tasks, app.rng);
}

const round = setUp();
const gate = tapGate();
let chosen = $state<string[]>([]);
let result = $state<ReturnType<typeof checkSteps> | null>(null);
const left = $derived(round.cards.filter((card) => !chosen.includes(card)));

function add(card: string) {
  if (!gate(card, performance.now())) return;
  chosen = choose(round, chosen, card);
}
</script>

<div class="top">
  <h1 tabindex="-1" use:focusOnMount>{app.t("game_steps")}</h1>
  <p class="muted">
    {app.t("round", { current: (app.session?.results.length ?? 0) + 1, total: app.session?.plan.length ?? 0 })}
  </p>
</div>
<h2 data-testid="task">{round.task}</h2>
<p class="message" aria-live="polite">
  {#if !result}
    {app.content.prompts.steps_intro?.spoken}
  {:else if result.right}
    <span class="right">{app.t("right")}</span>
  {:else}
    <span class="wrong">{app.t("steps_wrong")}</span>
  {/if}
</p>

{#if !result}
  <section class="card" aria-labelledby="order-title">
    <h3 id="order-title">{app.t("steps_your_order")}</h3>
    <ol class="order" data-testid="order">
      {#each chosen as step (step)}<li>{step}</li>{/each}
    </ol>
    <button disabled={chosen.length === 0} onclick={() => (chosen = undo(chosen))}>{app.t("undo")}</button>
  </section>
  <h3>{app.t("steps_cards")}</h3>
  <ul class="cards" data-testid="steps" data-order={round.steps.join("|")}>
    {#each left as card (card)}
      <li>
        <button disabled={chosen.length >= round.steps.length} onclick={() => add(card)}>{card}</button>
      </li>
    {/each}
  </ul>
  <div class="actions">
    <button
      class="primary"
      disabled={chosen.length < round.steps.length}
      onclick={() => (result = checkSteps(round, chosen))}>{app.t("done")}</button
    >
  </div>
{:else}
  <ol class="answer" data-testid="answer">
    {#each round.steps as step (step)}
      <li>{step}</li>
    {/each}
  </ol>
  {#if round.extra}
    <p class="extra"><s>{round.extra}</s> · {app.t("steps_extra")}</p>
  {/if}
  <div class="actions">
    <button class="primary" onclick={() => app.finishRound(result?.right ?? false)}>
      {app.lastRound ? app.t("finish") : app.t("next")}
    </button>
  </div>
{/if}

<style>
  h2 {
    margin-bottom: 0.25rem;
  }
  h3 {
    font-size: 1.15rem;
    margin: 0 0 0.5rem;
  }
  .order,
  .answer {
    margin: 0 0 1rem;
    padding-left: 2rem;
    font-size: 1.15rem;
  }
  .order li,
  .answer li {
    padding: 0.35rem 0;
  }
  .order:empty {
    display: none;
  }
  .cards {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: var(--gap);
  }
  .cards button {
    width: 100%;
    text-align: left;
  }
  .extra {
    color: var(--muted);
  }
  .right {
    color: var(--right);
  }
  .wrong {
    color: var(--wrong);
  }
</style>
