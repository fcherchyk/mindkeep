<script lang="ts">
// Shows the screen of the moment and applies the display settings to the whole page.

import Home from "./screens/Home.svelte";
import Intro from "./screens/Intro.svelte";
import Odd from "./screens/Odd.svelte";
import Pairs from "./screens/Pairs.svelte";
import Sequences from "./screens/Sequences.svelte";
import Settings from "./screens/Settings.svelte";
import Shopping from "./screens/Shopping.svelte";
import Steps from "./screens/Steps.svelte";
import Summary from "./screens/Summary.svelte";
import Trail from "./screens/Trail.svelte";
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
      {:else if app.game === "pairs"}
        <Pairs {app} />
      {:else if app.game === "sequences"}
        <Sequences {app} />
      {:else if app.game === "trail"}
        <Trail {app} />
      {:else if app.game === "steps"}
        <Steps {app} />
      {:else}
        <Odd {app} />
      {/if}
    {/key}
  {:else}
    <Summary {app} />
  {/if}
</main>
