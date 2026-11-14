// The sandbox scripts: they install the dependencies with no network or with a registry that
// refuses the lockfile's versions. Runs sandbox-deps.sh with a fake pnpm (and sometimes a fake
// node) on PATH, so nothing is installed for real. Bash scripts, so not on Windows.
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const ROOT = join(import.meta.dirname, "..");
const SCRIPTS = ["sandbox-deps.sh", "test-sandbox.sh", "run-sandbox.sh"];
const LOCK = "lockfileVersion: '9.0'\n";

// A fake pnpm: it logs its arguments, fails any argument list matching $FAIL, and on success
// creates node_modules/ok. A failure first leaves a half install behind, and an install without a
// lockfile also scribbles on pnpm-lock.yaml, to check that both are cleaned up.
const FAKE_PNPM = `#!/usr/bin/env bash
[ "$1" = "--version" ] && { echo 10.29.3; exit 0; }
echo "$*" >>"$CALLS"
mkdir -p node_modules
case "$*" in *lockfile=false*) echo changed >>pnpm-lock.yaml ;; esac
if [ -n "$FAIL" ] && [[ "$*" =~ $FAIL ]]; then touch node_modules/half; exit 1; fi
touch node_modules/ok
`;

interface Run {
  ok: boolean;
  calls: string[];
  output: string;
  dir: string;
}

function project(): string {
  const dir = mkdtempSync(join(tmpdir(), "mindkeep-deps-"));
  copyFileSync(join(ROOT, "sandbox-deps.sh"), join(dir, "sandbox-deps.sh"));
  copyFileSync(join(ROOT, "package.json"), join(dir, "package.json"));
  writeFileSync(join(dir, "pnpm-lock.yaml"), LOCK);
  mkdirSync(join(dir, "bin"));
  writeFileSync(join(dir, "bin", "pnpm"), FAKE_PNPM);
  chmodSync(join(dir, "bin", "pnpm"), 0o755);
  return dir;
}

function install(env: Record<string, string> = {}, dir = project()): Run {
  const calls = join(dir, "calls");
  writeFileSync(calls, "");
  // The settings of the run that started the tests (./test-sandbox.sh with SANDBOX_OFFLINE=1,
  // say) must not leak into these.
  const inherited = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !/^(SANDBOX_|npm_config_)/i.test(name)),
  );
  const result = spawnSync("bash", ["-c", "source ./sandbox-deps.sh && install_dependencies"], {
    cwd: dir,
    encoding: "utf8",
    env: { ...inherited, PATH: `${join(dir, "bin")}:${process.env.PATH}`, CALLS: calls, ...env },
  });
  return {
    ok: result.status === 0,
    calls: readFileSync(calls, "utf8").trim().split("\n").filter(Boolean),
    output: result.stderr,
    dir,
  };
}

describe.skipIf(process.platform === "win32")("sandbox scripts", () => {
  test("test_S1_AC17_the_sandbox_scripts_are_executable_bash", () => {
    for (const script of SCRIPTS) {
      expect(statSync(join(ROOT, script)).mode & 0o111, script).not.toBe(0);
      execFileSync("bash", ["-n", join(ROOT, script)]);
    }
  });

  test("test_S1_AC17_the_lockfile_is_tried_offline_first_then_with_network", () => {
    const offline = install();
    expect(offline.ok).toBe(true);
    expect(offline.calls).toEqual(["install --frozen-lockfile --offline"]);

    const online = install({ FAIL: "--offline" });
    expect(online.ok).toBe(true);
    expect(online.calls).toEqual([
      "install --frozen-lockfile --offline",
      "install --frozen-lockfile --prefer-offline",
    ]);
    expect(existsSync(join(online.dir, "node_modules", "half"))).toBe(false);
  });

  test("test_S1_AC17_refused_versions_fall_back_to_older_releases_without_touching_the_lockfile", () => {
    const run = install({ FAIL: "frozen-lockfile|release-age=20160$" });
    expect(run.ok).toBe(true);
    expect(run.calls.at(-1)).toBe(
      "install --offline --config.lockfile=false --config.minimum-release-age=43200",
    );
    expect(run.output).toMatch(/WARNING: .* newer than 30 days .*pnpm-lock.yaml is unchanged/s);
    expect(readFileSync(join(run.dir, "pnpm-lock.yaml"), "utf8")).toBe(LOCK);
    expect(existsSync(join(run.dir, "node_modules", "half"))).toBe(false);
    expect(existsSync(join(run.dir, "node_modules", "ok"))).toBe(true);

    // The next run goes straight to the age that worked.
    const again = install({ FAIL: "frozen-lockfile" }, run.dir);
    expect(again.ok).toBe(true);
    expect(again.calls).toEqual([
      "install --offline --config.lockfile=false --config.minimum-release-age=43200",
    ]);
  });

  test("test_S1_AC17_the_settings_forbid_the_fallback_or_the_network", () => {
    const locked = install({ FAIL: "frozen-lockfile", SANDBOX_DEPS: "locked" });
    expect(locked.ok).toBe(false);
    expect(locked.calls.every((call) => call.includes("--frozen-lockfile"))).toBe(true);
    expect(locked.output).toMatch(/SANDBOX_DEPS=locked/);

    const offline = install({ FAIL: ".", SANDBOX_OFFLINE: "1", SANDBOX_DEPS_MIN_AGE_DAYS: "14" });
    expect(offline.ok).toBe(false);
    expect(offline.calls).toEqual([
      "install --frozen-lockfile --offline",
      "install --offline --config.lockfile=false --config.minimum-release-age=20160",
    ]);
    expect(offline.output).toMatch(/no way to install the dependencies worked/);
    expect(existsSync(join(offline.dir, "node_modules"))).toBe(false);
  });

  test("test_S1_AC17_an_old_node_stops_with_a_clear_message", () => {
    for (const [version, ok] of [
      ["v20.19.0", false],
      ["v22.12.0", false],
      ["v22.13.0", true],
      ["v22.21.0", true],
      ["v23.11.0", false],
      ["v24.0.0", true],
      ["v26.1.0", true],
    ] as const) {
      const dir = project();
      writeFileSync(join(dir, "bin", "node"), `#!/usr/bin/env bash\necho ${version}\n`);
      chmodSync(join(dir, "bin", "node"), 0o755);
      const run = install({}, dir);
      expect(run.ok, version).toBe(ok);
      if (!ok) expect(run.output).toMatch(/needs Node 22\.13\+ or 24\+/);
    }
  });
});
