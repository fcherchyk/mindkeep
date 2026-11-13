<script lang="ts">
// The first visit: only a first name is asked for.
import { cleanName } from "../../core/profile";
import { focusOnMount } from "../focus";
import type { AppState } from "../state.svelte";

let { app }: { app: AppState } = $props();
let name = $state("");
let invalid = $state(false);

function submit(event: SubmitEvent) {
  event.preventDefault();
  if (cleanName(name) === null) {
    invalid = true;
    return;
  }
  app.createProfile(name);
}
</script>

<h1 tabindex="-1" use:focusOnMount>{app.t("welcome_title")}</h1>
<p>{app.t("tagline")}</p>
<p class="muted">{app.t("welcome_text")}</p>
<form class="card" onsubmit={submit} novalidate>
  <label for="name">{app.t("name_label")}</label>
  <input
    id="name"
    type="text"
    autocomplete="given-name"
    maxlength="20"
    bind:value={name}
    aria-invalid={invalid}
    aria-describedby="name-error"
  />
  <p id="name-error" class="message wrong" aria-live="polite">
    {invalid ? app.t("name_invalid") : ""}
  </p>
  <button class="primary" type="submit">{app.t("continue")}</button>
</form>
<p class="muted">{app.t("disclaimer")}</p>
