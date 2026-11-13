<script lang="ts">
// A shopping item: its picture and its word, with an optional note under it ("On the list").
import { iconSvg } from "../icons";

let {
  id,
  word,
  note = "",
  tone = "",
}: { id: string; word: string; note?: string; tone?: string } = $props();
</script>

<span class="tile">
  <span class="picture">{@html iconSvg(id)}</span>
  <span class="word">{word}</span>
  {#if note}<span class={`note ${tone}`}>{note}</span>{/if}
</span>

<style>
  .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  .picture {
    width: 4rem;
    height: 4rem;
  }
  .picture :global(svg) {
    width: 100%;
    height: 100%;
  }
  .word {
    font-size: 1.15rem;
    font-weight: 700;
  }
  .note {
    font-size: 0.95rem;
    font-weight: 700;
  }
  .note.right {
    color: var(--right);
  }
  .note.wrong {
    color: var(--wrong);
  }
</style>
