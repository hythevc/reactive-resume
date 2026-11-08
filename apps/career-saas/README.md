# CareerOS local workspace

A responsive Next.js career-workspace app inside Reactive Resume. It connects five preparation workflows to shared career facts: resumes, LinkedIn writing reviews, profile-photo preparation, job applications and recruiter outreach.

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
- Import/export supported Reactive Resume JSON text; print through the browser's Save as PDF dialog. This is not yet the shared PDF/DOCX rendering service.
- Start from a saved resume or review pasted LinkedIn text using disclosed writing checks and editable suggestions. Scores are local heuristics, not LinkedIn ranking or ATS predictions.
- Prepare your own photo in the browser, compare original/edited crops, preview square/circle framing, and download the edited square PNG. Local image processing is not AI headshot generation.
- Use Role discovery to save a career brief about problems, team, scope and environment; review eligible saved jobs one at a time; and shortlist or pass with a reason. Decisions are separate from application stages, and passed roles are excluded from draft preparation. Create/edit a company-specific introduction from supplied facts, review it and copy it; no details are shared automatically.
- Add/edit/filter jobs, inspect keyword overlap, save company exclusions and preferred locations, review per-job eligibility reasons, prepare matching drafts and manually update tracker stages. Preparation controls run while you use the app; there is no background scheduler or automatic submission.
- Add researched contacts with user-supplied source URLs and context, create/edit factual template drafts, copy them or open your mail composer and track user-reported stages. No email is sent by the app.
- Keep workspace state in versioned local browser storage and use settings for backup/restore/reset. Browser storage is tied to the device/browser and can be cleared; exported backups contain your career data.

Uploaded photo processing stays local. Photos and photo adjustments are not persisted in the workspace backup. Career briefs, role decisions, introduction drafts, LinkedIn drafts and daily preparation counts are included in workspace backups. Treat browser backups as private files. The local app has no account access boundary; people using the same browser profile may access its data.

## Not connected

Better Auth, PostgreSQL/Supabase, Stripe billing, AI text/image providers, job feeds/autofill/submission, contact discovery/verification, email sending, reply sync are **not active**. Plan selection is demonstration state, not payment or a server entitlement. `Applied`/`Contacted` tracker labels are user reports, not delivery receipts. A ChatGPT subscription is not used as an API credential.

The parent repository already has Better Auth, Drizzle/Postgres and resume/application services. [Architecture](replica/architecture.md) explains how to integrate them without enabling a second auth/database stack. [SQL](replica/schema.sql) is a future design draft only: not applied, generated or registered as a migration.

## Product and business design

[Actual REA observations and source-to-component mapping](replica/observations/README.md) cover thirteen competitor attempts, twelve rendered public surfaces, one inaccessible site, and local improvements from observed patterns. The [MeetDex comparison](replica/observations/meetdex.md) distinguishes working public demonstrations from untested account features. This is selected market research, not full competitor parity; authenticated competitor products were not accessed.

- [Recon and five workflows](replica/recon.md)
- [Production architecture and delivery semantics](replica/architecture.md)
- [Reviewable future schema](replica/schema.sql)
- [Evidence, pricing hypotheses, costs and honest launch copy](replica/business.md)

Public competitor research informs functionality; names, code, interface and assets are original to this implementation. No authenticated competitor screens or private endpoints were copied. The product name CareerOS is provisional and has not received trademark/domain clearance.

## Starter attribution

Based on the requested [Next.js SaaS Starter template](https://vercel.com/templates/next.js/next-js-saas-starter) and its [MIT-licensed source](https://github.com/nextjs/saas-starter). Its original scaffold/auth/database/billing examples are retained under `starter/` for reference; Next.js does not serve those archived routes. The active app does not enable their services. Copyright and permission notice: [LICENSE.saas-starter](LICENSE.saas-starter).

Reactive Resume remains MIT-licensed under the repository's root [LICENSE](../../LICENSE). The exchange adapter preserves the supported facts and escapes imported text; it does not preserve every template/layout/custom-section detail. Use shared package export maps when moving functionality into production services.
