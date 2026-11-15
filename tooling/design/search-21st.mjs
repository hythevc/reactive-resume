#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";

const args = process.argv.slice(2);
if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
	console.log(`Usage: node tooling/design/search-21st.mjs "generic component query"

Read-only component search using an existing 21st CLI installation.
Requires API_KEY_21ST in the environment. Optional DESIGN_21ST_CLI is an absolute
executable path; otherwise 21st must be on PATH. No key files or key arguments.
Runs outside the project so automatic design context cannot upload project files.
Does not generate, install, publish, bookmark, or change account configuration.`);
	process.exit(0);
}

if (args.length !== 1 || !args[0].trim() || args[0].length > 500 || args[0].trimStart().startsWith("-")) {
	console.error("Supply one generic component query of at most 500 characters. Use --help for setup.");
	process.exit(2);
}

const key = process.env.API_KEY_21ST?.trim();
if (!key || /[\r\n]/.test(key) || key.startsWith("an_")) {
	console.error(
		"Set a current API_KEY_21ST in the launching environment. No login or credential-file fallback was attempted.",
	);
	process.exit(2);
}
const executable = process.env.DESIGN_21ST_CLI || "21st";
if (/[\\/]/.test(executable) && !isAbsolute(executable)) {
	console.error("DESIGN_21ST_CLI must be an absolute executable path or a command on PATH.");
	process.exit(2);
}

const scratch = mkdtempSync(join(tmpdir(), "rr-design-search-"));
const redact = (value) => String(value || "").replaceAll(key, "[redacted]");
let status = 1;
try {
	const result = spawnSync(executable, ["search", args[0].trim(), "--type", "component", "--limit", "5", "--json"], {
		cwd: scratch,
		env: {
			...process.env,
			API_KEY_21ST: key,
			TWENTYFIRST_TOKEN: key,
			NODE_USE_ENV_PROXY: process.env.NODE_USE_ENV_PROXY || "1",
		},
		encoding: "utf8",
		timeout: 45_000,
		maxBuffer: 5 * 1024 * 1024,
		shell: false,
	});
	if (result.error) {
		console.error(
			"21st search could not run. Check the installed CLI, network/proxy and service access; use local components meanwhile.",
		);
	} else {
		process.stdout.write(redact(result.stdout));
		process.stderr.write(redact(result.stderr));
		status = result.status ?? 1;
	}
} catch {
	console.error(
		"21st search could not run. Use --help to check local setup and continue with local component references.",
	);
} finally {
	rmSync(scratch, { recursive: true, force: true });
}
process.exit(status);
