<script lang="ts">
// Text size, spoken instructions and contrast. Each change applies and is saved at once.
import { TEXT_SIZES } from "../../core/profile";
import { focusOnMount } from "../focus";
import type { AppState } from "../state.svelte";

let { app }: { app: AppState } = $props();
const settings = $derived(app.profile?.settings);
</script>

<h1 tabindex="-1" use:focusOnMount>{app.t("settings_title")}</h1>
{#if settings}
  <section class="card" aria-labelledby="text-size">
    <h2 id="text-size">{app.t("text_size")}</h2>
    <div class="row">
      {#each TEXT_SIZES as size (size)}
        <button
          aria-pressed={settings.textSize === size}
          onclick={() => app.updateSettings({ textSize: size })}>{app.t(`text_${size}`)}</button
        >
      {/each}
    </div>
  </section>
  <section class="card" aria-labelledby="voice">
    <h2 id="voice">{app.t("voice")}</h2>
    <div class="row">
      <button aria-pressed={settings.voice} onclick={() => app.updateSettings({ voice: true })}
        >{app.t("on")}</button
      >
      <button aria-pressed={!settings.voice} onclick={() => app.updateSettings({ voice: false })}
        >{app.t("off")}</button
      >
    </div>
  </section>
  <section class="card" aria-labelledby="contrast">
    <h2 id="contrast">{app.t("contrast")}</h2>
    <div class="row">
      <button aria-pressed={settings.contrast} onclick={() => app.updateSettings({ contrast: true })}
        >{app.t("on")}</button
      >
      <button
        aria-pressed={!settings.contrast}
        onclick={() => app.updateSettings({ contrast: false })}>{app.t("off")}</button
      >
    </div>
  </section>
{/if}
<button class="primary" onclick={() => app.go("home")}>{app.t("back")}</button>
