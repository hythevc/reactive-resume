"use client";

import {
	ArrowUpRight,
	Check,
	Copy,
	Mail,
	MessageSquare,
	Pencil,
	Plus,
	Search,
	Sparkles,
	Trash2,
	Users,
	X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { outboundBlockReason, outreachReviewKey } from "@/lib/workflow-safety";
import { buildOutreach, CONTACT_CONTEXT_MAX_LENGTH, CONTACT_SOURCE_MAX_LENGTH, type Contact } from "@/lib/workspace";
import { useWorkspace } from "@/lib/workspace-context";

type ContactForm = Pick<Contact, "name" | "company" | "role" | "email" | "sourceUrl" | "context">;
const emptyContact: ContactForm = {
	name: "",
	company: "",
	role: "",
	email: "",
	sourceUrl: "",
	context: "",
};
const contactStages: Contact["status"][] = ["Draft", "Contacted", "Replied"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeContactSource(value: string) {
	try {
		const url = new URL(value);
		return /^https:\/\//i.test(value) && url.protocol === "https:" && !url.username && !url.password
			? url.toString()
			: null;
	} catch {
		return null;
	}
}

export function OutreachView() {
	const { data, setData, mutate, ready, persistenceStatus } = useWorkspace();
	const [search, setSearch] = useState("");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<ContactForm>(emptyContact);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [refreshId, setRefreshId] = useState<string | null>(null);
	const [reviewedFor, setReviewedFor] = useState<string | null>(null);
	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		return data.contacts.filter(
			(contact) =>
				!query || `${contact.name} ${contact.company} ${contact.role} ${contact.email}`.toLowerCase().includes(query),
		);
	}, [data.contacts, search]);
	const selected = data.contacts.find((contact) => contact.id === selectedId) ?? filtered[0];

	const reviewKey = selected ? outreachReviewKey(data.profile, selected) : null;
	const reviewed = reviewKey !== null && reviewedFor === reviewKey;
	const blockedReason = selected
		? outboundBlockReason(data.profile, selected.message, { email: selected.email })
		: null;

	function openForm(contact?: Contact) {
		setForm(
			contact
				? {
						name: contact.name,
						company: contact.company,
						role: contact.role,
						email: contact.email,
						sourceUrl: contact.sourceUrl,
						context: contact.context,
					}
				: emptyContact,
		);
		setEditingId(contact?.id ?? null);
		setShowForm(true);
		setError("");
	}

	async function saveContact(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!form.name.trim() || !form.company.trim()) {
			setError("Add a name and company to save this contact.");
			return;
		}
		if (!editingId && data.contacts.length >= 2000) {
			setError("This workspace has reached 2,000 contacts. Remove an old contact before adding another.");
			return;
		}
		if (form.email.trim() && !emailPattern.test(form.email.trim())) {
			setError("Enter a valid email address, or leave the email blank.");
			return;
		}
		if (form.sourceUrl.trim() && !safeContactSource(form.sourceUrl.trim())) {
			setError("Use a full HTTPS source URL without a username or password, or leave it blank.");
			return;
		}
		const values: ContactForm = Object.fromEntries(
			Object.entries(form).map(([key, value]) => [key, value.trim()]),
		) as ContactForm;
		const id = editingId ?? crypto.randomUUID();
		const newContact: Contact = { id, ...values, status: "Draft", message: "" };
		setNotice("");
		if (
			!(await mutate((current) => ({
				...current,
				contacts: editingId
					? current.contacts.map((contact) => (contact.id === editingId ? { ...contact, ...values } : contact))
					: [{ ...newContact, message: buildOutreach(current.profile, newContact) }, ...current.contacts],
			})))
		) {
			setError("Couldn't save this contact. Your form is kept; check the storage notice before trying again.");
			return;
		}
		setSelectedId(id);
		setShowForm(false);
		setNotice(
			editingId
				? "Contact updated. Your existing draft has been kept; review its recipient, company and wording again before using it."
				: "Contact saved with an editable draft. No message was sent.",
		);
	}

	function updateMessage(id: string, message: string) {
		setData((current) => ({
			...current,
			contacts: current.contacts.map((contact) => (contact.id === id ? { ...contact, message } : contact)),
		}));
	}

	async function regenerate(contact: Contact) {
		setNotice("");
		if (
			!(await mutate((current) => ({
				...current,
				contacts: current.contacts.map((item) =>
					item.id === contact.id ? { ...item, message: buildOutreach(current.profile, item) } : item,
				),
			})))
		) {
			setNotice(
				"Couldn't save the refreshed draft. Your confirmation and input are kept; check the storage notice before trying again.",
			);
			return;
		}
		setReviewedFor(null);
		setRefreshId(null);
		setNotice(
			"Draft refreshed from your career profile and supplied context. Review the wording and facts before using it.",
		);
	}

	async function copyMessage(contact: Contact) {
		const blocked = outboundBlockReason(data.profile, contact.message, { email: contact.email });
		if (blocked || reviewedFor !== outreachReviewKey(data.profile, contact)) {
			setNotice(blocked || "Review the current career facts, recipient and message before copying.");
			return;
		}
		if (!contact.message.trim()) {
			setNotice("Write a message or create a draft before copying.");
			return;
		}
		try {
			await navigator.clipboard.writeText(contact.message);
			setNotice("Message copied. Review it in your email or LinkedIn before sending.");
		} catch {
			setNotice("Clipboard access is unavailable. Select the message text and copy it with your keyboard.");
		}
	}

	async function updateStage(contact: Contact, status: Contact["status"]) {
		setNotice("");
		if (
			!(await mutate((current) => ({
				...current,
				contacts: current.contacts.map((item) => (item.id === contact.id ? { ...item, status } : item)),
			})))
		) {
			setNotice("Couldn't save the contact stage. Check the storage notice before trying again.");
			return;
		}
		setNotice(
			status === "Contacted"
				? "Marked as contacted in your tracker. This app did not send a message."
				: "Contact stage updated.",
		);
	}

	async function removeContact(id: string) {
		setNotice("");
		if (
			!(await mutate((current) => ({
				...current,
				contacts: current.contacts.filter((contact) => contact.id !== id),
			})))
		) {
			setNotice("Couldn't delete this contact. Check the storage notice before trying again.");
			return;
		}
		if (selectedId === id) setSelectedId(null);
		setDeleteId(null);
		setNotice("Contact and draft removed from your workspace.");
	}

	const composeUrl =
		selected && reviewed && !blockedReason && emailPattern.test(selected.email)
			? `mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent(`A conversation about ${data.profile.role || "new opportunities"}`)}&body=${encodeURIComponent(selected.message)}`
			: null;

	return (
		<div>
			<div className="feature-heading">
				<div>
					<h1>Good things start with a hello.</h1>
					<p className="muted">Build real connections with recruiters and the people behind your next role.</p>
				</div>
				<button className="button primary" type="button" onClick={() => openForm()} disabled={!ready}>
					<Plus size={16} /> Add a contact
				</button>
			</div>
			<p className="muted small-print">
				Draft facts come from your shared career profile in Settings: {data.profile.name || "No name added"} ·{" "}
				{data.profile.role || "No role added"}. Importing a resume alone does not replace this profile.
			</p>
			{notice ? (
				<div className="notice" role="status">
					{notice}
				</div>
			) : null}

			{showForm ? (
				<section className="panel" style={{ marginBottom: 24 }} aria-label={editingId ? "Edit contact" : "Add contact"}>
					<div className="section-title">
						<h2>{editingId ? "Edit your contact" : "A new connection"}</h2>
						<button
							className="button secondary small"
							type="button"
							onClick={() => setShowForm(false)}
							aria-label="Close contact form"
						>
							<X size={16} />
						</button>
					</div>
					<form onSubmit={saveContact}>
						<div className="form-grid">
							<label className="field">
								Full name
								<input
									className="input"
									required
									maxLength={500}
									value={form.name}
									onChange={(event) => setForm({ ...form, name: event.target.value })}
									placeholder="e.g. Alex Morgan"
								/>
							</label>
							<label className="field">
								Company
								<input
									className="input"
									required
									maxLength={500}
									value={form.company}
									onChange={(event) => setForm({ ...form, company: event.target.value })}
									placeholder="e.g. Fern Studio"
								/>
							</label>
							<label className="field">
								Their role
								<input
									className="input"
									maxLength={500}
									value={form.role}
									onChange={(event) => setForm({ ...form, role: event.target.value })}
									placeholder="Talent partner"
								/>
							</label>
							<label className="field">
								Email (optional)
								<input
									className="input"
									type="email"
									maxLength={254}
									value={form.email}
									onChange={(event) => setForm({ ...form, email: event.target.value })}
									placeholder="alex@fern.example.test"
								/>
							</label>
						</div>
						<label className="field">
							Source URL (optional)
							<input
								className="input"
								type="url"
								maxLength={CONTACT_SOURCE_MAX_LENGTH}
								value={form.sourceUrl}
								onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })}
								placeholder="https://company.example.test/team"
							/>
							<small className="muted">
								Where did you find this contact? Add their company page or public profile.
							</small>
						</label>
						<label className="field">
							Reason to connect / notes
							<textarea
								className="textarea"
								rows={3}
								maxLength={CONTACT_CONTEXT_MAX_LENGTH}
								value={form.context}
								onChange={(event) => setForm({ ...form, context: event.target.value })}
								placeholder="Add a specific, factual reason for reaching out. Your words will be included in a new or refreshed draft."
							/>
							<small className="muted">
								Saved drafts stay unchanged when you edit these notes. Refresh a draft to include the new context.
							</small>
						</label>
						<p className="muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
							Source is user supplied; email has not been verified by this app.
						</p>
						{error ? (
							<p className="notice" role="alert">
								{error}
							</p>
						) : null}
						<div style={{ display: "flex", gap: 10, marginTop: 18 }}>
							<button className="button primary" type="submit">
								<Check size={15} /> Save contact
							</button>
							<button className="button secondary" type="button" onClick={() => setShowForm(false)}>
								Cancel
							</button>
						</div>
					</form>
				</section>
			) : null}

			<div className="two-column" style={{ alignItems: "start" }}>
				<section className="panel">
					<div className="section-title">
						<h2>
							Your network{" "}
							<span className="muted" style={{ fontSize: 14 }}>
								({data.contacts.length})
							</span>
						</h2>
						<Users size={19} />
					</div>
					<label className="field">
						<span style={{ display: "flex", alignItems: "center", gap: 7 }}>
							<Search size={14} /> Find a contact
						</span>
						<input
							className="input"
							type="search"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Name, company, role or email"
						/>
					</label>
					<div className="table-wrap">
						<table className="data-table">
							<thead>
								<tr>
									<th>Connection</th>
									<th>Stage</th>
									<th>
										<span className="sr-only">Open draft</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((contact) => (
									<tr key={contact.id} style={selected?.id === contact.id ? { background: "#f3f7ed" } : undefined}>
										<td>
											<button
												type="button"
												onClick={() => setSelectedId(contact.id)}
												style={{
													background: "none",
													border: 0,
													padding: 0,
													textAlign: "left",
													cursor: "pointer",
													font: "inherit",
													color: "#173f35",
												}}
											>
												<strong>{contact.name}</strong>
												<span
													className="muted"
													style={{
														display: "block",
														fontSize: 12,
														marginTop: 4,
													}}
												>
													{contact.role || "Recruiter"} · {contact.company}
												</span>
											</button>
										</td>
										<td>
											<span className="status">{contact.status}</span>
										</td>
										<td>
											<button
												className="button secondary small"
												type="button"
												onClick={() => setSelectedId(contact.id)}
												aria-label={`Open draft for ${contact.name}`}
											>
												<ArrowUpRight size={15} />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{!filtered.length ? (
						<div className="empty">
							<Users size={25} />
							<h3>{data.contacts.length ? "No contacts found" : "Make your first connection"}</h3>
							<p className="muted">
								{data.contacts.length
									? "Try another name, company or role."
									: "Add a recruiter or hiring manager to create a personal introduction."}
							</p>
						</div>
					) : null}
					<p className="muted" style={{ fontSize: 11, lineHeight: 1.7, marginTop: 20 }}>
						Your network is a personal tracker. Contact stages are recorded by you, and messages are never sent
						automatically.
					</p>
				</section>

				{selected ? (
					<section className="panel" aria-label="Outreach draft">
						<div className="section-title">
							<div>
								<p className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
									A note to {selected.name}
								</p>
								<h2>A personal introduction</h2>
							</div>
							<MessageSquare size={19} />
						</div>
						{blockedReason ? (
							<div className="notice" role="alert">
								{blockedReason}
							</div>
						) : null}
						<label className="intro-review-check" style={{ marginTop: 14 }}>
							<input
								type="checkbox"
								checked={reviewed}
								disabled={Boolean(blockedReason) || !selected.message.trim()}
								onChange={(event) => setReviewedFor(event.target.checked ? reviewKey : null)}
							/>
							<span>
								I've checked the current career facts, recipient {selected.email || selected.name}, company and message.
								Review is required again after any of these change.
							</span>
						</label>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: 12,
								padding: "14px 0",
								borderTop: "1px solid #e8ece8",
								borderBottom: "1px solid #e8ece8",
								marginBottom: 20,
							}}
						>
							<div>
								<strong style={{ fontSize: 13 }}>{selected.name}</strong>
								<p className="muted" style={{ fontSize: 12, margin: "5px 0 0" }}>
									{selected.company}
									{selected.email ? ` · ${selected.email}` : " · No email added"}
								</p>
							</div>
							<button
								className="button secondary small"
								type="button"
								onClick={() => openForm(selected)}
								aria-label={`Edit ${selected.name}`}
							>
								<Pencil size={14} />
							</button>
						</div>
						<div className="contact-provenance" style={{ marginBottom: 20, fontSize: 12, lineHeight: 1.7 }}>
							{safeContactSource(selected.sourceUrl) ? (
								<a
									className="text-button"
									href={safeContactSource(selected.sourceUrl) ?? undefined}
									target="_blank"
									rel="noopener noreferrer"
								>
									Open contact source <ArrowUpRight size={13} />
								</a>
							) : (
								<span className="muted">No contact source added.</span>
							)}
							<p className="muted" style={{ margin: "7px 0 0" }}>
								Source is user supplied; email has not been verified by this app.
							</p>
							{selected.context ? (
								<div style={{ marginTop: 14 }}>
									<strong>Your reason to connect</strong>
									<p className="muted" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: "6px 0 0" }}>
										{selected.context}
									</p>
								</div>
							) : null}
						</div>
						<label className="field">
							Your message
							<textarea
								className="textarea"
								rows={11}
								maxLength={50000}
								value={selected.message}
								onChange={(event) => updateMessage(selected.id, event.target.value)}
								placeholder="Write a thoughtful, specific introduction."
								style={{ lineHeight: 1.8 }}
							/>
						</label>
						<p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
							{persistenceStatus === "saved"
								? "Saved locally"
								: persistenceStatus === "saving"
									? "Saving…"
									: "Not saved — check the workspace notice"}{" "}
							· {selected.message.length}
							/50,000 characters
						</p>
						<div
							style={{
								display: "flex",
								flexWrap: "wrap",
								gap: 8,
								marginTop: 18,
							}}
						>
							<button
								className="button primary small"
								type="button"
								onClick={() => copyMessage(selected)}
								disabled={!selected.message.trim() || !reviewed || Boolean(blockedReason)}
							>
								<Copy size={14} /> Copy message
							</button>
							{composeUrl ? (
								<a className="button secondary small" href={composeUrl}>
									<Mail size={14} /> Compose in email
								</a>
							) : null}
							<button
								className="button secondary small"
								type="button"
								onClick={() => (selected.message.trim() ? setRefreshId(selected.id) : regenerate(selected))}
							>
								<Sparkles size={14} /> {selected.message.trim() ? "Refresh draft" : "Create draft"}
							</button>
						</div>
						{refreshId === selected.id ? (
							<div className="notice">
								<p>Replace the current message with a new template from your profile?</p>
								<button className="button primary small" type="button" onClick={() => regenerate(selected)}>
									Replace draft
								</button>{" "}
								<button className="button secondary small" type="button" onClick={() => setRefreshId(null)}>
									Keep my message
								</button>
							</div>
						) : null}
						<p className="muted" style={{ fontSize: 12, lineHeight: 1.7, marginTop: 18 }}>
							This template uses your profile, contact details and supplied context. Check every fact, add a specific
							reason to connect, and send from your own account. Refreshing replaces the current draft.
						</p>
						<label className="field" style={{ marginTop: 24 }}>
							Record contact stage
							<select
								className="input"
								value={selected.status}
								onChange={(event) => updateStage(selected, event.target.value as Contact["status"])}
							>
								{contactStages.map((item) => (
									<option key={item}>{item}</option>
								))}
							</select>
						</label>
						<button
							className="button secondary small"
							type="button"
							style={{ marginTop: 18 }}
							onClick={() => setDeleteId(selected.id)}
						>
							<Trash2 size={14} /> Remove contact
						</button>
						{deleteId === selected.id ? (
							<div className="notice" role="alert">
								<p>Remove this contact and their saved draft?</p>
								<button className="button primary small" type="button" onClick={() => removeContact(selected.id)}>
									Remove contact
								</button>{" "}
								<button className="button secondary small" type="button" onClick={() => setDeleteId(null)}>
									Keep contact
								</button>
							</div>
						) : null}
					</section>
				) : (
					<section className="panel empty" style={{ background: "#edf5d5" }}>
						<Mail size={30} />
						<h2>A little context goes a long way.</h2>
						<p className="muted">Add a contact to draft a thoughtful introduction using your career profile.</p>
						<button className="button primary" type="button" onClick={() => openForm()}>
							Add your first contact
						</button>
					</section>
				)}
			</div>
		</div>
	);
}
