"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Button, EmptyState, Field, PageHeading, Panel } from "@/components/career-ui";
import {
	authenticateCloud,
	downloadCloudResumePdf,
	getCloudReadiness,
	getCloudCapabilities,
	getCloudUser,
	listCloudResumes,
	readCloudResume,
	requestCloudPasswordReset,
	signOutCloud,
	uploadCloudResume,
	verifyCloudSecondFactor,
	CloudRequestError,
	type CloudReadiness,
	type CloudCapabilities,
	type CloudResume,
	type CloudUser,
} from "@/lib/cloud-client";
import { outboundBlockReason } from "@/lib/workflow-safety";
import { importResume, MAX_RESUMES } from "@/lib/workspace";
import { useWorkspace } from "@/lib/workspace-context";

function downloadFile(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function CloudView() {
	const { data, mutate } = useWorkspace();
	const [readiness, setReadiness] = useState<CloudReadiness | null>(null);
	const [capabilities, setCapabilities] = useState<CloudCapabilities | null>(null);
	const [user, setUser] = useState<CloudUser | null>(null);
	const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [secondFactor, setSecondFactor] = useState(false);
	const [code, setCode] = useState("");
	const [backupCode, setBackupCode] = useState(false);
	const [resumes, setResumes] = useState<CloudResume[]>([]);
	const [offset, setOffset] = useState(0);
	const [total, setTotal] = useState(0);
	const [sourceId, setSourceId] = useState(data.resumes[0]?.id ?? "");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const source = data.resumes.find((resume) => resume.id === sourceId);
	const accountScope = useRef({ id: null as string | null, generation: 0 });
	const userId = user?.id;
	const adoptAccount = useCallback((account: CloudUser | null) => {
		if (accountScope.current.id !== (account?.id ?? null)) {
			accountScope.current = { id: account?.id ?? null, generation: accountScope.current.generation + 1 };
			setResumes([]);
			setTotal(0);
			setOffset(0);
		}
		setUser(account);
	}, []);

	useEffect(() => {
		let active = true;
		async function load() {
			try {
				const state = await getCloudReadiness();
				if (!active) return;
				setReadiness(state);
				if (state.configured) {
					const flags = await getCloudCapabilities();
					if (new URL(flags.appUrl).origin !== window.location.origin) throw new Error("Cloud origin mismatch");
					if (active) setCapabilities(flags);
					const account = await getCloudUser();
					if (active) adoptAccount(account);
				}
			} catch {
				if (active) setError("Couldn't check cloud availability. Refresh this page to try again.");
			}
		}
		void load();
		return () => {
			active = false;
		};
	}, [adoptAccount]);

	useEffect(() => {
		if (!userId) return;
		let active = true;
		const generation = accountScope.current.generation;
		void listCloudResumes(offset, userId)
			.then((result) => {
				if (!active || accountScope.current.id !== userId || accountScope.current.generation !== generation) return;
				setResumes(result.resumes);
				setTotal(result.total);
			})
			.catch((failure) => {
				if (!active || accountScope.current.id !== userId || accountScope.current.generation !== generation) return;
				if (failure instanceof CloudRequestError && [401, 409].includes(failure.status)) adoptAccount(null);
				setError("Couldn't load your cloud resumes. Check your account and refresh the list.");
			});
		return () => {
			active = false;
		};
	}, [userId, offset, adoptAccount]);

	async function action(work: () => Promise<void>) {
		setBusy(true);
		setError("");
		setMessage("");
		try {
			await work();
		} catch (failure) {
			if (failure instanceof CloudRequestError && [401, 409].includes(failure.status)) adoptAccount(null);
			setError(failure instanceof Error ? failure.message : "Couldn't complete this action. Try again.");
		} finally {
			setBusy(false);
		}
	}

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		void action(async () => {
			if (secondFactor) await verifyCloudSecondFactor(code, backupCode);
			else {
				const result = await authenticateCloud(mode, { name, email, password });
				setPassword("");
				if (result.twoFactorRedirect) {
					setSecondFactor(true);
					setMessage("Enter the verification code from your authenticator, or use a backup code.");
					return;
				}
			}
			const account = await getCloudUser();
			adoptAccount(account);
			setSecondFactor(false);
			setCode("");
			setOffset(0);
			setMessage(
				account
					? "Signed in. Choose a resume copy to upload or download."
					: "Account request received. Complete any email verification, then sign in.",
			);
		});
	}

	async function refresh() {
		const account = await getCloudUser();
		const previousId = accountScope.current.id;
		adoptAccount(account);
		if (!account) {
			setResumes([]);
			throw new Error("Your cloud session ended. Sign in again.");
		}
		const generation = accountScope.current.generation;
		const result = await listCloudResumes(previousId === account.id ? offset : 0, account.id);
		if (accountScope.current.id !== account.id || accountScope.current.generation !== generation) return;
		setResumes(result.resumes);
		setTotal(result.total);
	}

	return (
		<div className="feature-view">
			<PageHeading
				title="Your cloud account"
				description="Keep reviewed resume copies in your account. This browser workspace remains separate."
			/>
			{error ? (
				<p className="form-error" role="alert">
					{error}
				</p>
			) : null}
			{message ? <p role="status">{message}</p> : null}
			{readiness === null ? (
				<Panel>
					<p>Checking cloud availability…</p>
				</Panel>
			) : !readiness.configured ? (
				<Panel>
					<EmptyState
						title="Cloud accounts are not available yet"
						description="Your workspace continues to save in this browser. Keep private backups; account storage is not connected on this installation."
					/>
				</Panel>
			) : !user && (!capabilities || capabilities.disableEmailAuth) ? (
				<Panel>
					<EmptyState
						title="Cloud sign-in is unavailable"
						description="Your local workspace is available. Cloud sign-in needs the account service to be enabled and verified by the operator."
					/>
				</Panel>
			) : !user ? (
				<Panel>
					<h2>{secondFactor ? "Verify your sign-in" : mode === "sign-in" ? "Sign in" : "Create your account"}</h2>
					<p className="muted">
						Your credentials go to the configured account service at {new URL(readiness.origin).hostname}. No career
						records upload automatically.
					</p>
					<form onSubmit={submit} className="settings-grid">
						{secondFactor ? (
							<>
								<Field label={backupCode ? "Backup code" : "Authenticator code"}>
									<input
										autoComplete="one-time-code"
										value={code}
										onChange={(event) => setCode(event.target.value)}
										required
										maxLength={100}
									/>
								</Field>
								<label>
									<input
										type="checkbox"
										checked={backupCode}
										onChange={(event) => setBackupCode(event.target.checked)}
									/>{" "}
									Use a backup code
								</label>
							</>
						) : (
							<>
								{mode === "sign-up" ? (
									<Field label="Full name">
										<input
											autoComplete="name"
											value={name}
											onChange={(event) => setName(event.target.value)}
											required
											maxLength={64}
										/>
									</Field>
								) : null}
								<Field label="Email">
									<input
										type="email"
										autoComplete="username"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										required
										maxLength={254}
									/>
								</Field>
								<Field label="Password">
									<input
										type="password"
										autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										required
										minLength={mode === "sign-up" ? 8 : 1}
										maxLength={64}
									/>
								</Field>
							</>
						)}
						<div className="button-row">
							<Button type="submit" variant="primary" disabled={busy}>
								{busy ? "Checking…" : secondFactor ? "Verify" : mode === "sign-in" ? "Sign in" : "Create account"}
							</Button>
							{!secondFactor && !capabilities?.disableSignups ? (
								<Button
									type="button"
									disabled={busy}
									onClick={() => {
										setMode(mode === "sign-in" ? "sign-up" : "sign-in");
										setError("");
										setPassword("");
									}}
								>
									{mode === "sign-in" ? "Create an account" : "Use an existing account"}
								</Button>
							) : null}
						</div>
						{!secondFactor && capabilities?.smtpEnabled ? (
							<Button
								type="button"
								disabled={busy || !email}
								onClick={() =>
									void action(async () => {
										await requestCloudPasswordReset(email);
										setMessage(
											"If this address has an account, a password reset link has been requested. Check your email.",
										);
									})
								}
							>
								Send password reset link
							</Button>
						) : null}
					</form>
				</Panel>
			) : (
				<>
					<Panel>
						<h2>Signed in as {user.name}</h2>
						<p>{user.email}</p>
						<p className="muted">
							Only explicit resume uploads are stored in this account. Jobs, recruiter contacts, LinkedIn drafts and
							photo edits remain in this browser. Signing out does not erase local data.
						</p>
						<Button
							disabled={busy}
							onClick={() =>
								void action(async () => {
									setResumes([]);
									await signOutCloud(user.id);
									adoptAccount(null);
									setTotal(0);
									setMessage("Signed out of your cloud account. Local workspace data remains on this device.");
								})
							}
						>
							Sign out
						</Button>
					</Panel>
					<Panel>
						<h2>Upload a reviewed resume copy</h2>
						<p className="muted">
							This creates a separate private resume in your account. It does not replace an existing cloud resume or
							synchronize later edits.
						</p>
						<Field label="Local resume">
							<select value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
								<option value="">Choose a resume</option>
								{data.resumes.map((resume) => (
									<option key={resume.id} value={resume.id}>
										{resume.title}
									</option>
								))}
							</select>
						</Field>
						<Button
							variant="primary"
							disabled={busy || !source}
							onClick={() =>
								void action(async () => {
									if (!source) return;
									const blocked = outboundBlockReason(source.profile, JSON.stringify(source.profile));
									if (blocked) throw new Error(blocked);
									if (
										!window.confirm(
											`Upload the supported text of “${source.title}” to ${user.email}'s cloud account? Unsupported sections and original formatting are not included.`,
										)
									)
										return;
									const current = await getCloudUser();
									if (!current || current.id !== user.id)
										throw new Error("Your cloud account changed. Refresh this page before uploading.");
									await uploadCloudResume(source, user.id);
									setMessage("Resume copy stored in your cloud account. Later local edits are not synchronized.");
									try {
										await refresh();
									} catch {
										setError(
											"The resume was stored, but the list could not refresh. Refresh the list before uploading another copy.",
										);
									}
								})
							}
						>
							Upload resume copy
						</Button>
					</Panel>
					<Panel>
						<div className="button-row">
							<h2>Your cloud resumes</h2>
							<Button disabled={busy} onClick={() => void action(refresh)}>
								Refresh list
							</Button>
						</div>
						{!resumes.length ? (
							<p>No cloud resumes on this page.</p>
						) : (
							<ul>
								{resumes.map((resume) => (
									<li key={resume.id} style={{ marginBlock: "1rem" }}>
										<strong>{resume.name}</strong>
										<p className="muted">{resume.isPublic ? "Published in your account" : "Private in your account"}</p>
										<div className="button-row">
											<Button
												disabled={busy}
												onClick={() =>
													void action(async () => {
														if (data.resumes.length >= MAX_RESUMES)
															throw new Error(
																"Your local resume limit is reached. Export a backup and remove a copy before importing.",
															);
														if (
															!window.confirm(
																`Add a local text copy of “${resume.name}”? Unsupported sections and cloud formatting are not retained.`,
															)
														)
															return;
														const imported = importResume(await readCloudResume(resume.id, user.id));
														if (
															!(await mutate((workspace) => ({
																...workspace,
																resumes: [...workspace.resumes, imported],
															})))
														)
															throw new Error(
																"Couldn't save the local copy. Resolve the storage notice and try importing again.",
															);
														setMessage(
															"A supported text copy was added to local Resumes. Your shared career profile remains separate.",
														);
													})
												}
											>
												Add local copy
											</Button>
											<Button
												disabled={busy}
												onClick={() =>
													void action(async () => {
														downloadFile(await downloadCloudResumePdf(resume.id, user.id), "careeros-resume.pdf");
														setMessage("PDF downloaded. Review it before sharing.");
													})
												}
											>
												Download cloud PDF
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}
						<div className="button-row">
							<Button disabled={busy || offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))}>
								Previous
							</Button>
							<span>
								{total ? `${offset + 1}–${Math.min(offset + resumes.length, total)} of ${total}` : "0 resumes"}
							</span>
							<Button disabled={busy || offset + resumes.length >= total} onClick={() => setOffset(offset + 20)}>
								Next
							</Button>
						</div>
					</Panel>
				</>
			)}
		</div>
	);
}
