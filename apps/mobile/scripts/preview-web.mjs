import { spawn } from "node:child_process";
import { createServer, request as requestHttp } from "node:http";
import { createRequire } from "node:module";
import { connect } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

/** Expo owns the HTML response outside Metro's enhanceMiddleware hook. */
export function createPreviewProxy(metroPort) {
	const sockets = new Set();
	const track = (socket) => {
		sockets.add(socket);
		socket.once("close", () => sockets.delete(socket));
	};
	const server = createServer((request, response) => {
		response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
		response.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
		const upstream = requestHttp(
			{
				hostname: "127.0.0.1",
				port: metroPort,
				path: request.url,
				method: request.method,
				headers: { ...request.headers, host: `localhost:${metroPort}` },
				agent: false,
			},
			(result) => {
				const headers = { ...result.headers };
				delete headers["cross-origin-opener-policy"];
				delete headers["cross-origin-embedder-policy"];
				response.writeHead(result.statusCode ?? 502, headers);
				result.pipe(response);
				result.on("error", () => response.destroy());
			},
		);
		upstream.on("error", () => {
			if (!response.headersSent) response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
			response.end("The local preview is starting or unavailable. Refresh after Metro is ready.");
		});
		request.once("aborted", () => upstream.destroy());
		request.pipe(upstream);
	});
	server.on("connection", track);
	server.on("upgrade", (request, socket, head) => {
		const upstream = connect(metroPort, "127.0.0.1", () => {
			const headers = { ...request.headers, host: `localhost:${metroPort}` };
			const lines = Object.entries(headers)
				.map(([key, value]) => `${key}: ${value}`)
				.join("\r\n");
			upstream.write(`${request.method} ${request.url} HTTP/${request.httpVersion}\r\n${lines}\r\n\r\n`);
			if (head.length) upstream.write(head);
			upstream.pipe(socket);
			socket.pipe(upstream);
		});
		track(upstream);
		upstream.on("error", () => socket.destroy());
		socket.on("error", () => upstream.destroy());
		socket.once("close", () => upstream.destroy());
		upstream.once("close", () => socket.destroy());
	});
	return {
		server,
		closeConnections: () => {
			for (const socket of sockets) socket.destroy();
		},
	};
}

function parsePort(value) {
	const port = Number(value);
	if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Use a port between 1024 and 65535.");
	return port;
}

async function unusedPort() {
	const probe = createServer();
	await new Promise((resolveReady, reject) => {
		probe.once("error", reject);
		probe.listen(0, "127.0.0.1", resolveReady);
	});
	const address = probe.address();
	if (!address || typeof address === "string") throw new Error("Couldn't select a local Metro port.");
	await new Promise((resolveClosed) => probe.close(resolveClosed));
	return address.port;
}

async function main() {
	const { values } = parseArgs({
		options: {
			port: { type: "string", default: "8081" },
			"metro-port": { type: "string" },
			clear: { type: "boolean", default: false },
			help: { type: "boolean", default: false },
		},
	});
	if (values.help) {
		console.log(
			"pnpm --filter mobile preview:web [--port 8081] [--metro-port 8083] [--clear]\nRuns the React Native Web primitive gallery with the isolation headers required by SQLite. Full native routes still require a device or simulator.",
		);
		return;
	}
	const publicPort = parsePort(values.port);
	const metroPort = values["metro-port"] ? parsePort(values["metro-port"]) : await unusedPort();
	if (publicPort === metroPort) throw new Error("Choose different preview and Metro ports.");
	const require = createRequire(import.meta.url);
	const expoCli = resolve(dirname(require.resolve("expo/package.json")), "bin/cli");
	const { server, closeConnections } = createPreviewProxy(metroPort);
	await new Promise((resolveReady, reject) => {
		server.once("error", reject);
		server.listen(publicPort, "127.0.0.1", resolveReady);
	});
	const previewUrl = `http://localhost:${publicPort}`;
	const child = spawn(
		process.execPath,
		[
			expoCli,
			"start",
			"--web",
			"--host",
			"localhost",
			"--port",
			String(metroPort),
			...(values.clear ? ["--clear"] : []),
		],
		{
			cwd: resolve(dirname(fileURLToPath(import.meta.url)), ".."),
			env: { ...process.env, EXPO_MOBILE_WEB_PREVIEW: "1", BROWSER: "none" },
			stdio: ["inherit", "pipe", "pipe"],
		},
	);
	const forward = (stream, destination) =>
		stream.on("data", (data) =>
			destination.write(
				data
					.toString()
					.replaceAll(`http://localhost:${metroPort}`, previewUrl)
					.replaceAll(`http://127.0.0.1:${metroPort}`, previewUrl),
			),
		);
	forward(child.stdout, process.stdout);
	forward(child.stderr, process.stderr);
	console.log(
		`Primitive gallery: ${previewUrl}\nThis preview covers shared components, not the full native application.`,
	);
	let closing = false;
	const shutdown = (code) => {
		if (closing) return;
		closing = true;
		process.exitCode = code;
		server.close();
		closeConnections();
		if (!child.pid || child.exitCode !== null) process.exit(code);
		child.kill("SIGTERM");
		child.once("exit", () => process.exit(code));
		setTimeout(() => {
			child.kill("SIGKILL");
			process.exit(code);
		}, 3000).unref();
	};
	process.once("SIGINT", () => shutdown(130));
	process.once("SIGTERM", () => shutdown(143));
	child.once("error", (error) => {
		console.error(error.message);
		shutdown(1);
	});
	child.once("exit", (code) => shutdown(code ?? 1));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
	main().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
