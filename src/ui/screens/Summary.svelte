<script lang="ts">
// The end of a session: what was done today, compared only with the user's own last time.
import { type GameSummary, summary } from "../../core/profile";
import { focusOnMount } from "../focus";
import type { AppState } from "../state.svelte";

let { app }: { app: AppState } = $props();
const games = $derived(app.profile ? summary(app.profile, app.date) : []);

function comparison(game: GameSummary): string {
  if (game.previousLevel === null) return app.t("summary_first");
  if (game.level > game.previousLevel) return app.t("summary_up", { previous: game.previousLevel });
  if (game.level < game.previousLevel)
    return app.t("summary_down", { previous: game.previousLevel });
  return app.t("summary_same");
}
</script>

<h1 tabindex="-1" use:focusOnMount>{app.t("summary_title")}</h1>
{#each games as game (game.game)}
  <section class="card" data-testid={`summary-${game.game}`}>
    <h2>{app.t(`game_${game.game}`)}</h2>
    <p class="message">{app.t("summary_right", { right: game.right, rounds: game.rounds })}</p>
    <p>{app.t("summary_level", { level: game.level })} · {comparison(game)}</p>
  </section>
{/each}
<p class="muted">{app.t("summary_note")}</p>
<button class="primary" onclick={() => app.go("home")}>{app.t("home")}</button>
