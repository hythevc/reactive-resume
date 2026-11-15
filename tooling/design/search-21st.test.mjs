import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vite-plus/test";

const script = fileURLToPath(new URL("./search-21st.mjs", import.meta.url));
const placeholder = "fictional-test-credential-only";

function run(args, extra = {}) {
	const env = { ...process.env, ...extra };
	delete env.API_KEY_21ST;
	if (extra.API_KEY_21ST !== undefined) env.API_KEY_21ST = extra.API_KEY_21ST;
	return spawnSync(process.execPath, [script, ...args], { env, encoding: "utf8", timeout: 10_000 });
}

test("missing environment key fails before running a CLI or using a saved login", () => {
	const result = run(["onboarding progress"], { DESIGN_21ST_CLI: "/not/an/installed/executable" });
	assert.equal(result.status, 2);
	assert.match(result.stderr, /No login or credential-file fallback/);
	assert.equal(result.stdout, "");
});

test("queries cannot become arbitrary commands or key flags", () => {
	for (const args of [["--token=fictional"], ["dialog", "--api-key", "fictional"], [" "]]) {
		const result = run(args, { API_KEY_21ST: placeholder, DESIGN_21ST_CLI: "/not/an/executable" });
		assert.equal(result.status, 2);
		assert.doesNotMatch(result.stderr, /fictional/);
	}
});

test("search passes credentials only through environment, outside project context, and cleans scratch data", () => {
	const directory = mkdtempSync(join(tmpdir(), "rr-search-test-"));
	try {
		const cli = join(directory, "fake-cli.mjs");
		writeFileSync(
			cli,
			`#!/usr/bin/env node
console.log(JSON.stringify({ args: process.argv.slice(2), sameToken: process.env.API_KEY_21ST === process.env.TWENTYFIRST_TOKEN, token: process.env.API_KEY_21ST, cwd: process.cwd(), proxy: process.env.NODE_USE_ENV_PROXY }));
`,
		);
		chmodSync(cli, 0o700);
		const result = run(["onboarding progress"], {
			API_KEY_21ST: placeholder,
			TWENTYFIRST_TOKEN: "stale-fictional-value",
			DESIGN_21ST_CLI: cli,
			NODE_USE_ENV_PROXY: "1",
		});
		assert.equal(result.status, 0, result.stderr);
		const output = JSON.parse(result.stdout);
		assert.deepEqual(output.args, ["search", "onboarding progress", "--type", "component", "--limit", "5", "--json"]);
		assert.equal(output.sameToken, true);
		assert.equal(output.token, "[redacted]");
		assert.equal(output.proxy, "1");
		assert.notEqual(output.cwd, process.cwd());
		assert.equal(existsSync(output.cwd), false);
		assert.doesNotMatch(result.stdout + result.stderr, new RegExp(placeholder));
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});

test("upstream failures remain failures and redact accidental credential output", () => {
	const directory = mkdtempSync(join(tmpdir(), "rr-search-failure-"));
	try {
		const cli = join(directory, "fake-cli.mjs");
		writeFileSync(cli, "#!/usr/bin/env node\nconsole.error(process.env.API_KEY_21ST); process.exit(17);\n");
		chmodSync(cli, 0o700);
		const result = run(["dialog"], { API_KEY_21ST: placeholder, DESIGN_21ST_CLI: cli });
		assert.equal(result.status, 17);
		assert.match(result.stderr, /\[redacted\]/);
		assert.doesNotMatch(result.stderr, new RegExp(placeholder));
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
