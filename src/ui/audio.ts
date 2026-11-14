/** The spoken prompts: one voice, so a new prompt stops the one before. When the voice is off,
 * or the browser cannot play, nothing is said and everything still works (the text is always
 * on screen). */

const clips = import.meta.glob<string>("../assets/audio/*/*.wav", {
  eager: true,
  query: "?url",
  import: "default",
});

export function clipUrl(locale: string, id: string): string | undefined {
  return clips[`../assets/audio/${locale}/${id}.wav`];
}

export interface Player {
  play(url: string, volume: number): void; // volume from 0 to 1
  stop(): void;
}

/** The browser's own audio element. */
export function browserPlayer(): Player {
  let current: HTMLAudioElement | null = null;
  return {
    play(url, volume) {
      current?.pause();
      current = new Audio(url);
      current.volume = volume;
      current.play().catch(() => {
        // autoplay blocked or no sound device: the text is on screen anyway
      });
    },
    stop() {
      current?.pause();
      current = null;
    },
  };
}

export class Voice {
  constructor(
    private locale: string,
    private player: Player,
    private enabled: () => boolean,
    private volume: () => number, // from 0 to 1
  ) {}

  /** Say a prompt; false when nothing is said (voice off, or no clip). */
  say(id: string): boolean {
    const url = clipUrl(this.locale, id);
    if (!this.enabled() || url === undefined) return false;
    this.player.play(url, this.volume());
    return true;
  }

  stop(): void {
    this.player.stop();
  }
}
