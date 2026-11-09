"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Field, Panel } from "@/components/career-ui";
import { resetCloudPassword } from "@/lib/cloud-client";

export function CloudPasswordReset() {
	const [token, setToken] = useState("");
	const [password, setPassword] = useState("");
	const [confirmation, setConfirmation] = useState("");
	const [error, setError] = useState("");
	const [done, setDone] = useState(false);
	const [busy, setBusy] = useState(false);
	const readLocation = useRef(false);
	/* oxlint-disable react/set-state-in-effect -- Read a one-time credential from the browser URL after SSR, then remove it from that external location. */
	useEffect(() => {
		if (readLocation.current) return;
		readLocation.current = true;
		const url = new URL(window.location.href);
		setToken(url.searchParams.get("token") ?? "");
		if (!url.searchParams.get("token") || url.searchParams.has("error"))
			setError("This password reset link is unavailable or expired. Request a new link from Cloud account.");
		// Keep the reset credential out of copied URLs and later navigation referrers.
		window.history.replaceState(null, "", url.pathname);
	}, []);
	/* oxlint-enable react/set-state-in-effect */
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (password !== confirmation) {
			setError("The passwords do not match. Enter them again.");
			return;
		}
		setBusy(true);
		setError("");
		try {
			await resetCloudPassword(token, password);
			setToken("");
			setPassword("");
			setConfirmation("");
			setDone(true);
		} catch (failure) {
			setError(failure instanceof Error ? failure.message : "Couldn't reset this password. Request a new link.");
		} finally {
			setBusy(false);
		}
	}
	return (
		<main className="main-content">
			<Panel>
				<h1>Reset your password</h1>
				{error ? (
					<p className="form-error" role="alert">
						{error}
					</p>
				) : null}
				{done ? (
					<p role="status">
						The account password changed. Its existing sessions and connected credentials were revoked. Sign in again to
						continue.
					</p>
				) : (
					<>
						<p>
							Changing this password signs that account out everywhere and removes its passkeys, API keys and connected
							apps. Your local browser workspace is separate.
						</p>
						<form onSubmit={(event) => void submit(event)}>
							<Field label="New password">
								<input
									type="password"
									autoComplete="new-password"
									minLength={8}
									maxLength={64}
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									required
								/>
							</Field>
							<Field label="Confirm new password">
								<input
									type="password"
									autoComplete="new-password"
									minLength={8}
									maxLength={64}
									value={confirmation}
									onChange={(event) => setConfirmation(event.target.value)}
									required
								/>
							</Field>
							<Button type="submit" variant="primary" disabled={!token || busy}>
								{busy ? "Changing password…" : "Change password"}
							</Button>
						</form>
					</>
				)}
				<a className="button secondary" href="/#cloud">
					Return to Cloud account
				</a>
			</Panel>
		</main>
	);
}
