import { registerSW } from "virtual:pwa-register";
import { mount } from "svelte";
import { VOLUME_MAX, volumeGain } from "./core/profile";
import { seeded } from "./core/random";
import App from "./ui/App.svelte";
import { browserPlayer, Voice } from "./ui/audio";
import { content } from "./ui/content";
import { AppState } from "./ui/state.svelte";
import "./ui/theme.css";

const app = new AppState({
  content,
  store: window.localStorage,
  rng: seeded(Date.now()),
  voice: (state) =>
    new Voice(
      content.locale,
      browserPlayer(),
      () => state.profile?.settings.voice ?? true,
      () => volumeGain(state.profile?.settings.volume ?? VOLUME_MAX),
    ),
});

mount(App, { target: document.getElementById("app") as HTMLElement, props: { app } });
registerSW({ immediate: true });
