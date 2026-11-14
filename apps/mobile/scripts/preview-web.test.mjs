import assert from "node:assert/strict";
import { createServer } from "node:http";
import { connect } from "node:net";
import test from "node:test";
import { createPreviewProxy } from "./preview-web.mjs";

function listen(server) {
	return new Promise((resolveReady, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => resolveReady(server.address().port));
	});
}

test("preview forwards HTTP bodies/status and isolates HTML as well as assets", async (t) => {
	const upstream = createServer((request, response) => {
		response.writeHead(201, { "Content-Type": "text/html", "Cross-Origin-Embedder-Policy": "unsafe-none" });
		response.end(`<main>${request.url}</main>`);
	});
	const metroPort = await listen(upstream);
	const proxy = createPreviewProxy(metroPort);
	const previewPort = await listen(proxy.server);
	t.after(() => {
		proxy.closeConnections();
		proxy.server.close();
		upstream.closeAllConnections();
		upstream.close();
	});
	for (const path of ["/", "/entry.bundle?platform=web"]) {
		const response = await fetch(`http://127.0.0.1:${previewPort}${path}`);
		assert.equal(response.status, 201);
		assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
		assert.equal(response.headers.get("cross-origin-embedder-policy"), "credentialless");
		assert.equal(await response.text(), `<main>${path}</main>`);
	}
});

test("preview retains websocket upgrade transport for Metro refresh", { timeout: 5000 }, async (t) => {
	const upstream = createServer();
	const sockets = new Set();
	upstream.on("upgrade", (_request, socket) => {
		sockets.add(socket);
		socket.once("close", () => sockets.delete(socket));
		socket.write("HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n");
		socket.on("data", (data) => socket.write(data));
	});
	const metroPort = await listen(upstream);
	const proxy = createPreviewProxy(metroPort);
	const previewPort = await listen(proxy.server);
	t.after(() => {
		proxy.closeConnections();
		proxy.server.close();
		for (const socket of sockets) socket.destroy();
		upstream.close();
	});
	await new Promise((resolveDone, reject) => {
		const socket = connect(previewPort, "127.0.0.1", () =>
			socket.write("GET /hot HTTP/1.1\r\nHost: localhost\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n"),
		);
		socket.on("error", reject);
		let received = "";
		let sent = false;
		socket.on("data", (chunk) => {
			received += chunk.toString();
			if (!sent && received.includes("\r\n\r\n")) {
				assert.match(received, /^HTTP\/1\.1 101/);
				sent = true;
				socket.write("refresh-check");
			}
			if (received.includes("refresh-check")) {
				socket.destroy();
				resolveDone();
			}
		});
	});
});
