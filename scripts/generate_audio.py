"""Generate the spoken prompts (`src/assets/audio/<locale>/<id>.wav`) with Piper TTS.

    uv run --no-project python scripts/generate_audio.py --voice path/to/en_US-ljspeech-medium.onnx

Piper (GPL-3.0) runs through `uvx`, so it is never a dependency of MindKeep; only the generated
clips are versioned. Voices: https://huggingface.co/rhasspy/piper-voices (download the `.onnx` and
its `.onnx.json`). Each clip says the `spoken` text of `src/content/<locale>/prompts.json`, with
the silence around it trimmed. Only the standard library is used.
"""

import argparse
import array
import json
import subprocess
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PIPER = ["uvx", "--from", "piper-tts==1.8.0", "piper"]
SILENCE = 400  # 16-bit sample level under which a sample counts as silence
PADDING_MS = 40


def trim_silence(samples: array.array, rate: int) -> array.array:
    """Drop the silence before and after the voice, keeping a little padding."""
    loud = [i for i, sample in enumerate(samples) if abs(sample) > SILENCE]
    if not loud:
        return samples
    pad = rate * PADDING_MS // 1000
    return samples[max(0, loud[0] - pad) : loud[-1] + pad]


def speak(voice: Path, text: str, out: Path) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / "raw.wav"
        subprocess.run([*PIPER, "-m", str(voice), "-f", str(raw)], input=text.encode(), check=True)
        with wave.open(str(raw), "rb") as source:
            params = source.getparams()
            samples = array.array("h", source.readframes(params.nframes))
    trimmed = trim_silence(samples, params.framerate)
    out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), "wb") as target:
        target.setparams(params)
        target.writeframes(trimmed.tobytes())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--voice", type=Path, required=True, help="Piper voice (.onnx)")
    parser.add_argument("--locale", default="en")
    parser.add_argument("--only", default="", help="only these prompt ids: odd_intro")
    args = parser.parse_args()
    prompts = json.loads((ROOT / "src/content" / args.locale / "prompts.json").read_text())
    only = set(args.only.split())
    for prompt in prompts["prompts"]:
        if only and prompt["id"] not in only:
            continue
        out = ROOT / "src/assets/audio" / args.locale / f"{prompt['id']}.wav"
        speak(args.voice, prompt["spoken"], out)
        print(f"{prompt['id']}: {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
