<script lang="ts">
// Before a game's first round: what to do, written and spoken, and an example on request.
import type { Figure as FigureData } from "../../core/odd";
import Figure from "../components/Figure.svelte";
import ItemTile from "../components/ItemTile.svelte";
import { focusOnMount } from "../focus";
import type { AppState } from "../state.svelte";

let { app }: { app: AppState } = $props();
const game = $derived(app.game ?? "shopping");
const promptId = $derived(`${game}_intro`);
const area = $derived(app.content.games.find((g) => g.id === game)?.area ?? "");
let example = $state(false);

const sample = $derived(app.content.items.slice(0, 4));
const listed = $derived(new Set(sample.slice(0, 2).map((item) => item.id)));
const plain: FigureData = { shape: "circle", scale: 1, turn: 0, mark: false };
const figures: FigureData[] = [plain, plain, { ...plain, shape: "square" }, plain];

$effect(() => {
  app.voice.say(promptId);
});
</script>

<p class="muted">{app.t(`area_${area}`)}</p>
<h1 tabindex="-1" use:focusOnMount>{app.t(`game_${game}`)}</h1>
<p class="message">{app.content.prompts[promptId]?.spoken}</p>
<div class="row">
  <button onclick={() => app.voice.say(promptId)}>🔊 {app.t("listen")}</button>
  <button aria-expanded={example} onclick={() => (example = !example)}>{app.t("show_me")}</button>
</div>

{#if example}
  <section class="card example" aria-label={app.t("example")}>
    <p>{app.t("example")}</p>
    {#if game === "shopping"}
      <ul class="tiles">
        {#each sample as item (item.id)}
          <li class:marked={listed.has(item.id)}>
            <ItemTile
              id={item.id}
              word={item.word}
              note={listed.has(item.id) ? `✓ ${app.t("on_list")}` : ""}
              tone="right"
            />
          </li>
        {/each}
      </ul>
    {:else if game === "pairs"}
      <ul class="tiles cards">
        {#each [sample[0], sample[1], sample[0], sample[2]] as item, i (i)}
          <li class:marked={i === 0 || i === 2}>
            {#if item && (i === 0 || i === 2)}
              <ItemTile id={item.id} word={item.word} note="✓" tone="right" />
            {:else}
              <span class="back"></span>
            {/if}
          </li>
        {/each}
      </ul>
    {:else if game === "sequences"}
      <ul class="tiles squares">
        {#each Array.from({ length: 9 }, (_, i) => i) as tile (tile)}
          {@const n = [4, 0, 8].indexOf(tile)}
          <li class:marked={n >= 0}>{#if n >= 0}<span class="number">{n + 1}</span>{/if}</li>
        {/each}
      </ul>
    {:else if game === "trail"}
      <svg class="trail" viewBox="0 0 300 120" role="img" aria-label="1, A, 2">
        <polyline points="40,80 150,35 260,80" />
        {#each [["1", 40, 80], ["A", 150, 35], ["2", 260, 80]] as [label, x, y] (label)}
          <circle cx={x} cy={y} r="26" />
          <text x={x} y={Number(y) + 9}>{label}</text>
        {/each}
      </svg>
    {:else if game === "steps"}
      <ol class="steps">
        {#each app.content.tasks[0]?.steps.slice(0, 3) ?? [] as step (step)}<li>{step}</li>{/each}
      </ol>
    {:else}
      <ul class="tiles figures">
        {#each figures as figure, i (i)}
          <li class:marked={i === 2}><Figure {figure} /></li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}

<div class="actions">
  <button class="primary" onclick={() => app.go("play")}>{app.t("start")}</button>
  <button onclick={() => app.go("home")}>{app.t("home")}</button>
</div>

<style>
  .tiles {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
    gap: var(--gap);
  }
  .tiles li {
    border: var(--border) solid var(--line);
    border-radius: var(--radius);
    padding: 0.75rem;
    background: var(--surface);
  }
  .figures {
    grid-template-columns: repeat(2, 6rem);
  }
  .figures li {
    height: 6rem;
  }
  .cards {
    grid-template-columns: repeat(4, minmax(0, 7rem));
  }
  .back {
    display: block;
    height: 5.5rem;
    border-radius: calc(var(--radius) - 0.25rem);
    background: repeating-linear-gradient(45deg, var(--selected) 0 0.6rem, var(--surface) 0.6rem 1.2rem);
  }
  .squares {
    grid-template-columns: repeat(3, 4.5rem);
  }
  .squares li {
    height: 4.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .number {
    font-size: 1.75rem;
    font-weight: 700;
  }
  .trail {
    width: 100%;
    max-width: 22rem;
  }
  .trail polyline {
    fill: none;
    stroke: var(--primary);
    stroke-width: 5;
  }
  .trail circle {
    fill: var(--selected);
    stroke: var(--primary);
    stroke-width: 4;
  }
  .trail text {
    font-size: 26px;
    font-weight: 700;
    text-anchor: middle;
    fill: var(--text);
  }
  .steps {
    font-size: 1.15rem;
    padding-left: 2rem;
    margin: 0;
  }
  .marked {
    outline: 5px solid var(--right);
    outline-offset: 2px;
  }
</style>
