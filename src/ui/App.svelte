<script lang="ts">
// Shows the screen of the moment and applies the display settings to the whole page.

import Home from "./screens/Home.svelte";
import Intro from "./screens/Intro.svelte";
import Odd from "./screens/Odd.svelte";
import Settings from "./screens/Settings.svelte";
import Shopping from "./screens/Shopping.svelte";
import Summary from "./screens/Summary.svelte";
import Welcome from "./screens/Welcome.svelte";
import type { AppState } from "./state.svelte";

let { app }: { app: AppState } = $props();

$effect(() => {
  const settings = app.profile?.settings;
  const root = document.documentElement;
  root.dataset.textSize = settings?.textSize ?? "normal";
  root.dataset.contrast = settings?.contrast ? "high" : "normal";
});
</script>

<main>
  {#if app.screen === "welcome"}
    <Welcome {app} />
  {:else if app.screen === "home"}
    <Home {app} />
  {:else if app.screen === "settings"}
    <Settings {app} />
  {:else if app.screen === "intro"}
    <Intro {app} />
  {:else if app.screen === "play"}
    {#key app.session?.results.length}
      {#if app.game === "shopping"}
        <Shopping {app} />
      {:else}
        <Odd {app} />
      {/if}
    {/key}
  {:else}
    <Summary {app} />
  {/if}
</main>
