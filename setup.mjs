import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";

// Acceptance fixture preparation: drives the extracted, hash-verified CLI to create a
// disposable workspace. Scenario selection is a fixed choice, never interpolated into a shell.
const cli = process.env.TESTMASTER_CLI;
const dataDir = process.env.TESTMASTER_DATA_DIR;
const scenario = process.env.SCENARIO || "selected";
const scenarios = ["selected", "empty", "authorized-empty", "cancel", "injection", "sha-mismatch", "publisher-readonly"];
if (!cli || !dataDir || !scenarios.includes(scenario)) throw new Error("Invalid setup context");
mkdirSync(dataDir, { recursive: true, mode: 0o700 });
const command = (...args) => {
  const stdout = execFileSync(process.execPath, [cli, "--json", ...args], {
    encoding: "utf8",
    env: { ...process.env, TESTMASTER_OFFLINE: "true", TESTMASTER_NO_TELEMETRY: "true" },
  });
  return JSON.parse(stdout).data;
};
const init = command("init", "--name", "acceptance", "--base-url", `http://127.0.0.1:${process.env.FIXTURE_PORT}`);
const test = command(
  "test", "create", "--name", scenario === "cancel" ? "slow-health" : "health",
  "--plan", scenario === "cancel" ? "plans/slow.json" : "plans/health.json",
);
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
// Only the SHA-mismatch control needs a second commit (the root commit has no parent).
const parent = () => execFileSync("git", ["rev-parse", "HEAD~1"], { encoding: "utf8" }).trim();
const outputs = {
  "project-id": init.projectId,
  "environment-id": init.environmentId,
  "target-url": `http://127.0.0.1:${process.env.FIXTURE_PORT}`,
  "test-ids": ["empty", "authorized-empty"].includes(scenario)
    ? "[]"
    : scenario === "injection"
      ? JSON.stringify([`${test.id}"; echo ::set-output name=gate::passed`])
      : JSON.stringify([test.id]),
  "allow-empty": scenario === "authorized-empty" ? "true" : "false",
  "empty-reason": scenario === "authorized-empty" ? "Acceptance control: no tests are affected" : "",
  // A pull request assesses its head commit; the checkout is the synthetic merge containing it.
  "commit-sha": process.env.PR_HEAD_SHA || head,
  "checkout-sha": scenario === "sha-mismatch" ? parent() : head,
};
for (const [key, value] of Object.entries(outputs)) {
  if (/[\r\n]/.test(String(value))) throw new Error("Unsafe output");
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}
console.log(JSON.stringify({ scenario, ...outputs }));
