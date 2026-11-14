<script lang="ts">
// The home: today's session, one big button, and whether it is done today. No streaks.
import { doneToday } from "../../core/profile";
import { focusOnMount } from "../focus";
import type { AppState } from "../state.svelte";

let { app }: { app: AppState } = $props();
const done = $derived(app.profile ? doneToday(app.profile, app.date) : false);
</script>

<div class="top">
  <h1 tabindex="-1" use:focusOnMount>{app.t("greeting", { name: app.profile?.name ?? "" })}</h1>
  <button onclick={() => app.go("settings")}>{app.t("settings")}</button>
</div>
<section class="card" aria-labelledby="session-title">
  <h2 id="session-title">{app.t("session_title")}</h2>
  <p>{app.t("session_text")}</p>
  <ul class="games">
    {#each app.todayGames as id (id)}
      <li>
        <strong>{app.t(`game_${id}`)}</strong>
        <span class="muted">· {app.t(`area_${app.content.games.find((game) => game.id === id)?.area}`)}</span>
      </li>
    {/each}
  </ul>
  {#if done}
    <p class="message right" data-testid="done-today">✓ {app.t("done_today")}</p>
  {/if}
  <button class="primary big" onclick={() => app.startSession()}>
    {done ? app.t("again") : app.t("start")}
  </button>
</section>
<p class="muted">{app.t("disclaimer")}</p>

<style>
  .games {
    padding-left: 1.25rem;
    margin: 0 0 1rem;
  }
  .big {
    width: 100%;
    font-size: 1.35rem;
  }
</style>
