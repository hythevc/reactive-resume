# CareerOS local workspace

A responsive Next.js career-workspace app inside Reactive Resume. It connects six preparation workflows to shared career facts: resumes, LinkedIn writing reviews, profile-photo preparation, role discovery, job applications and recruiter outreach.

## Run

Use **Node 24**. This app is excluded from the parent pnpm workspace and uses its own npm lockfile; run from this directory and disable root workspace resolution:

```sh
cd /workspace/reactive-resume/apps/career-saas
npm --workspaces=false ci
npm --workspaces=false run dev
```

Open `http://localhost:3000`; the original public product page is at `/about`. No API key, database or account is required. The initial profile, companies, contacts and activity are fictional examples, not real job listings or traction.

```sh
npm --workspaces=false run typecheck
npm --workspaces=false test
npm --workspaces=false run build
npm --workspaces=false run start
```

`start` serves a completed production build on port 3000. Do not run it on the same port as `dev`. These are app-local commands; repository-wide pnpm checks remain separate.

## What works locally

- Edit career facts and create/duplicate/edit resume versions with a live preview. Compare a saved posting against explicit editable target terms, inspect missing terms, and duplicate a job-specific version without changing your career facts.
- Import/export supported Reactive Resume JSON text, including phone, website and LinkedIn links; print through the browser's Save as PDF dialog. This is not yet the shared PDF/DOCX rendering service.
- Start from a saved resume or review pasted LinkedIn text using disclosed writing checks and editable suggestions. Scores are local heuristics, not LinkedIn ranking or ATS predictions.
- Prepare your own photo in the browser, compare original/edited crops, preview square/circle framing, and download the edited square PNG. Local image processing is not AI headshot generation.
- Use Role discovery to save a career brief about problems, team, scope and environment; review eligible saved jobs one at a time; and shortlist or pass with a reason. Decisions are separate from application stages, and passed roles are excluded from draft preparation. Create/edit a company-specific introduction from supplied facts, review it and copy it; no details are shared automatically.
- Use Application workspace to compare a saved posting with supplied career facts, prepare editable resume/cover-letter drafts, export an agent review packet and import the reviewed drafts. Source snapshots, exact-document review and your acknowledgment control saving a resume version or downloading the cover letter. Local checks are limited text comparisons, not proof of factual accuracy or hiring eligibility.
- Add/edit/filter jobs, inspect keyword overlap, save company exclusions and preferred locations, review per-job eligibility reasons, prepare matching drafts and manually update tracker stages. Preparation controls run while you use the app; there is no background scheduler or automatic submission.
- Add researched contacts with user-supplied source URLs and context, create/edit factual template drafts, copy them or open your mail composer and track user-reported stages. No email is sent by the app.
- Keep workspace state in revision-checked local browser storage and use settings for backup/restore/reset. Discrete actions wait for a persistence result before reporting saved state. Conflicting tabs cannot silently replace active state. Browser storage is tied to the device/browser and can be cleared; exported backups contain your career data.

Uploaded photo processing stays local. Photos and photo adjustments are not persisted in the workspace backup. Career briefs, role decisions, introduction drafts, LinkedIn drafts and daily preparation counts are included in workspace backups. Treat browser backups as private files. The local app has no account access boundary; people using the same browser profile may access its data.

## Application drafting with Codex

The project-local [ai-job-search skill](../../.agents/skills/ai-job-search/SKILL.md) adapts the upstream draft/reviewer workflow to CareerOS packets. It is included in this checkout; start a new Codex session from the repository root to discover it. If the runtime does not list the skill, explicitly open that SKILL.md and ask it to follow the workflow. This adapter needs no extra Python, Bun, LaTeX or MCP installation. Its [source record](../../.agents/skills/ai-job-search/SOURCE.md) pins the upstream commit and preserves the [MIT license](../../.agents/skills/ai-job-search/LICENSE); the separate upstream toolkit and its portal CLIs are not SaaS dependencies.

1. In **Job autopilot**, select a saved job and use **Application workspace** in its details. Choose the master career profile or a saved resume as **Draft source**, then choose **Create local drafts**. **Fit** shows disclosed term coverage and gaps; **Drafts** lets you edit the resume and cover letter. The local starting draft reorders supplied skill labels and uses supplied background text; it does not generate new achievements.
2. Choose **Export review packet**. Save the downloaded JSON outside the repository and provide its path plus a private result path to Codex. Exporting the packet is possible before review, provided its source snapshots are current.
3. Invoke the skill with a prompt such as: `$ai-job-search Read my exported packet at the private path I provided; draft both documents, use a separate read-only reviewer, revise, review the exact final pair, and write result JSON to my designated private output path.` The agent uses its own configured access; the browser makes no model call and requires no model API key for this manual handoff.
4. Choose **Import reviewed drafts** and select the returned JSON. It must echo the original packet ID and complete inputs. The app stores an **Imported reviewer report** bound to those returned documents; it cannot authenticate the author's identity or prove that an independent review occurred. Read the documents and report yourself.
5. In **Review**, resolve any actionable draft issues and acknowledge the final documents. With current sources, a matching report, a nonempty review summary, no unresolved issues and your acknowledgment, use **Save resume version** or **Export cover letter**. Editing either document invalidates the previous exact-document review. Source changes require a refreshed package and packet; an old result cannot be relabeled to bypass this check.

Qualification gaps belong in the review summary and fit comparison, not as invented qualifications. Nonempty actionable issues can be imported for display and repair but block reviewed-document export. The skill returns plain text and structured resume data; use browser print preview separately to inspect a resume's exported layout.

Packets, result files, drafts and reports contain career data. Keep them in private locations outside tracked source, and treat providing a packet to an agent as sharing those contents with that agent session. Application drafts and imported reports are included in local workspace backups. This workflow does not submit an application, contact an employer, change a tracker stage or automatically upload anything to the optional cloud connection.

## Not connected

The optional Cloud account bridge reuses the parent Better Auth service and private resume APIs when an operator configures a verified backend. It supports email account access, existing two-factor checks and password recovery, plus explicit resume-copy upload/list/download. It does not synchronize jobs, contacts, LinkedIn drafts or the whole local workspace. With no backend configured, account actions fail closed and the UI says unavailable.

Stripe billing, AI text/image providers, job feeds/autofill/submission, contact discovery/verification, email sending and reply sync are **not active** in this standalone workspace. Plan selection is demonstration state, not payment or a server entitlement. `Applied`/`Contacted` tracker labels are user reports, not delivery receipts. A ChatGPT subscription is not used as an API credential.

The parent repository already has Better Auth, Drizzle/Postgres and resume/application services. [Architecture](replica/architecture.md) explains how to integrate them without enabling a second auth/database stack. [SQL](replica/schema.sql) is a future design draft only: not applied, generated or registered as a migration.

## Product and business design

[Actual REA observations and source-to-component mapping](replica/observations/README.md) cover thirteen competitor attempts, twelve rendered public surfaces, one inaccessible site, and local improvements from observed patterns. The [MeetDex comparison](replica/observations/meetdex.md) distinguishes working public demonstrations from untested account features. This is selected market research, not full competitor parity; authenticated competitor products were not accessed.

- [Recon and six workflows](replica/recon.md)
- [Production architecture and delivery semantics](replica/architecture.md)
- [Reviewable future schema](replica/schema.sql)
- [Evidence, pricing hypotheses, costs and honest launch copy](replica/business.md)

Public competitor research informs functionality; names, code, interface and assets are original to this implementation. No authenticated competitor screens or private endpoints were copied. The product name CareerOS is provisional and has not received trademark/domain clearance.

## Starter attribution

Based on the requested [Next.js SaaS Starter template](https://vercel.com/templates/next.js/next-js-saas-starter) and its [MIT-licensed source](https://github.com/nextjs/saas-starter). Its original scaffold/auth/database/billing examples are retained under `starter/` for reference; Next.js does not serve those archived routes. The active app does not enable their services. Copyright and permission notice: [LICENSE.saas-starter](LICENSE.saas-starter).

Reactive Resume remains MIT-licensed under the repository's root [LICENSE](../../LICENSE). The exchange adapter preserves supported career and contact facts and escapes imported text; it does not preserve every template/layout/custom-section detail. Use shared package export maps when moving functionality into production services.

## Data-safety behavior

- The active workspace uses a separate v2 storage key. Legacy v1 data is read for migration and remains visibly recoverable until deliberately removed; old deployed scripts cannot replace active v2 state.
- Web Locks serialize saves. Revision and reset-generation checks reject stale writers. Browsers without safe storage/locking remain memory-only and display a warning; export before leaving.
- Backups have a format/version envelope and a consistent 64 MiB UTF-8 limit. Old raw workspace JSON, v1 storage and valid v2 recovery formats remain readable. Accepted changes stay within the export budget. Browser quota can be lower; unsaved continuous edits remain exportable.
- Discrete create/import/delete actions wait for confirmed persistence. A failure keeps the form/candidate retryable. Continuous typing retains unsaved content on storage failure and warns before navigation.
- Reset verifies deletion of primary, legacy and recovery keys. A nonpersonal reset generation prevents old clients from reviving deleted data. Close/reload already-running pre-upgrade tabs for erasure from their memory and obsolete writes.
- Recovery deletion is blocked while edits are pending/unsaved. Reset cannot remove downloaded backups, clipboard contents, email drafts or OS copies.
- Use a selected resume as the shared career profile only through the confirmed promotion action. Existing resume snapshots remain independent. Outbound draft actions require current review and reject seeded fictional identities.
- Salary preferences support GBP, USD and EUR, without claiming salary-based matching. Manual Offer/Rejected/Withdrawn stages and explicit-offset interview instants do not schedule reminders.

## Optional cloud connection

Set the standalone frontend's server-only `CAREEROS_BACKEND_URL` to the fixed HTTPS origin of an existing Reactive Resume backend. Do not use a public browser environment variable or a service API key. The parent backend's `APP_URL` must equal the frontend's canonical public origin so Better Auth callbacks, CSRF checks and host-only Secure cookies agree. Keep cookie Domain unset.

The gateway exposes a narrow route allowlist, checks caller origin and bound account, disables private-response caching, refuses HTML/foreign redirects and delegates ownership to existing authenticated backend services. Signing in never automatically uploads local information. An upload creates a separate resume copy; refresh the cloud list before retrying an uncertain upload.

The backend requires real database/private-storage/auth configuration, genuine email delivery for account verification/recovery, and recorded two-user ownership/deletion/recovery checks. Keep signup/email login disabled until those checks pass. Do not treat a configured URL, proposed SQL or a successful local test as live-provider verification. See [deployment and acceptance](../../docs/contributing/careeros-deployment.mdx).

The isolated frontend currently ships English copy; it does not participate in the parent web/mobile Lingui catalogs. Cloud backend changes continue to follow parent localization, ownership and compatibility rules.
