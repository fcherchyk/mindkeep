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
  .marked {
    outline: 5px solid var(--right);
    outline-offset: 2px;
  }
</style>
