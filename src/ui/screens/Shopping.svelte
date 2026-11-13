<script lang="ts">
// Shopping List: learn the list (no clock: the user presses Ready), a short pause, then pick
// the things that were on it. A wrong answer shows the list calmly and the session goes on.
import { onDestroy } from "svelte";
import { checkShopping, makeShoppingRound, type ShoppingResult } from "../../core/shopping";
import { tapGate } from "../../core/taps";
import ItemTile from "../components/ItemTile.svelte";
import { focusOnMount } from "../focus";
import type { AppState } from "../state.svelte";

let { app }: { app: AppState } = $props();

/** The round is made once, when the screen opens (App re-creates the screen per round). */
function setUp() {
  const levels = app.content.shoppingLevels;
  const level = levels[app.level - 1] ?? levels[0];
  if (!level) throw new Error("no shopping levels");
  return {
    round: makeShoppingRound(level, app.content.items, app.rng),
    words: new Map(app.content.items.map((item) => [item.id, item.word])),
    speakPick: app.firstOfGame,
  };
}

const { round, words, speakPick } = setUp();
const gate = tapGate();

let phase = $state<"show" | "wait" | "pick" | "feedback">("show");
let picked = $state<string[]>([]);
let result = $state<ShoppingResult | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

function ready() {
  phase = "wait";
  timer = setTimeout(() => {
    phase = "pick";
    if (speakPick) app.voice.say("shopping_pick");
  }, round.pauseMs);
}

function toggle(id: string) {
  if (!gate(id, performance.now())) return;
  picked = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
}

function done() {
  result = checkShopping(round, picked);
  phase = "feedback";
}

function note(id: string): [string, string] {
  if (!result) return ["", ""];
  if (round.list.includes(id)) return [`✓ ${app.t("on_list")}`, "right"];
  if (result.wrong.includes(id)) return [`✗ ${app.t("selected")}`, "wrong"];
  return ["", ""];
}

onDestroy(() => clearTimeout(timer));
</script>

<div class="top">
  <h1 tabindex="-1" use:focusOnMount>{app.t("game_shopping")}</h1>
  <p class="muted">
    {app.t("round", { current: (app.session?.results.length ?? 0) + 1, total: app.session?.plan.length ?? 0 })}
  </p>
</div>

{#if phase === "show"}
  <p class="message">{app.content.prompts.shopping_intro?.spoken}</p>
  <ul class="tiles" aria-label="Shopping list" data-testid="list">
    {#each round.list as id (id)}
      <li><ItemTile {id} word={words.get(id) ?? id} /></li>
    {/each}
  </ul>
  <div class="actions"><button class="primary" onclick={ready}>{app.t("ready")}</button></div>
{:else if phase === "wait"}
  <p class="message" aria-live="polite">{app.t("wait")}</p>
{:else}
  <p class="message" aria-live="polite">
    {#if phase === "pick"}
      {app.content.prompts.shopping_pick?.spoken}
    {:else if result?.right}
      <span class="right">{app.t("right")}</span>
    {:else}
      <span class="wrong">{app.t("shopping_wrong")}</span>
    {/if}
  </p>
  <ul class="tiles choices" data-testid="choices">
    {#each round.choices as id (id)}
      {@const [text, tone] = note(id)}
      <li>
        <button
          aria-pressed={picked.includes(id)}
          disabled={phase === "feedback"}
          class:on-list={phase === "feedback" && round.list.includes(id)}
          onclick={() => toggle(id)}
        >
          <ItemTile {id} word={words.get(id) ?? id} note={text} {tone} />
        </button>
      </li>
    {/each}
  </ul>
  <div class="actions">
    {#if phase === "pick"}
      <button class="primary" disabled={picked.length === 0} onclick={done}>{app.t("done")}</button>
    {:else}
      <button class="primary" onclick={() => app.finishRound(result?.right ?? false)}>
        {app.lastRound ? app.t("finish") : app.t("next")}
      </button>
    {/if}
  </div>
{/if}

<style>
  .tiles {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
    gap: var(--gap);
  }
  .tiles > li {
    display: flex;
  }
  ul[data-testid="list"] > li {
    justify-content: center;
    padding: 0.75rem;
    border: var(--border) solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .choices button {
    width: 100%;
    padding: 0.75rem 0.5rem;
  }
  .choices button.on-list {
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
