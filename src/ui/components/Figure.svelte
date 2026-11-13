<script lang="ts">
// One figure of Odd One Out, drawn as an SVG. Shape, size, turn and mark tell figures apart;
// the colour is the same for all.
import type { Figure } from "../../core/odd";

let { figure }: { figure: Figure } = $props();

const POINTS: Record<string, string> = {
  triangle: "50,12 88,82 12,82",
  diamond: "50,8 92,50 50,92 8,50",
  hexagon: "28,12 72,12 94,50 72,88 28,88 6,50",
};
</script>

<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
  <g
    transform={`translate(50 50) rotate(${figure.turn}) scale(${figure.scale}) translate(-50 -50)`}
    fill="var(--primary)"
    stroke="var(--text)"
    stroke-width="3"
    stroke-linejoin="round"
  >
    {#if figure.shape === "circle"}
      <circle cx="50" cy="50" r="40" />
    {:else if figure.shape === "square"}
      <rect x="12" y="12" width="76" height="76" rx="4" />
    {:else}
      <polygon points={POINTS[figure.shape]} />
    {/if}
    {#if figure.mark}
      <circle cx="50" cy={figure.shape === "triangle" ? 62 : 50} r="9" fill="var(--surface)" />
    {/if}
  </g>
</svg>

<style>
  svg {
    width: 100%;
    height: 100%;
  }
</style>
