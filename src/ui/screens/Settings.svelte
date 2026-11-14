<script lang="ts">
// Text size, sound (spoken instructions and their volume) and contrast. Each change applies and
// is saved at once; a volume change is heard at once.
import { TEXT_SIZES, VOLUME_MAX, VOLUME_MIN } from "../../core/profile";
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
  <section class="card" aria-labelledby="sound">
    <h2 id="sound">{app.t("sound")}</h2>
    <div class="setting">
      <h3 id="voice">{app.t("voice")}</h3>
      <div class="row">
        <button aria-pressed={settings.voice} onclick={() => app.updateSettings({ voice: true })}
          >{app.t("on")}</button
        >
        <button aria-pressed={!settings.voice} onclick={() => app.updateSettings({ voice: false })}
          >{app.t("off")}</button
        >
      </div>
    </div>
    <div class="setting">
      <h3 id="volume">{app.t("volume")}</h3>
      <output class="level" aria-live="polite" aria-labelledby="volume"
        >{app.t("volume_level", { level: settings.volume, max: VOLUME_MAX })}</output
      >
      <div class="row">
        <button
          class="step"
          aria-label={app.t("quieter")}
          disabled={settings.volume <= VOLUME_MIN}
          onclick={() => app.changeVolume(-1)}>−</button
        >
        <button
          class="step"
          aria-label={app.t("louder")}
          disabled={settings.volume >= VOLUME_MAX}
          onclick={() => app.changeVolume(1)}>+</button
        >
      </div>
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

<style>
  h3 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem;
  }

  .setting + .setting {
    margin-top: 1.25rem;
  }

  .step {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1;
    padding: 0;
  }

  .step:disabled {
    border-style: dashed;
    color: var(--muted);
  }

  .level {
    display: block;
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
</style>
