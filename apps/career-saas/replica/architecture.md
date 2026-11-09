# CareerOS architecture

## Current implementation

`apps/career-saas` is an isolated Next.js App Router application derived from the requested MIT-licensed [Next.js SaaS Starter](https://github.com/nextjs/saas-starter). React 19, TypeScript, Tailwind and shared visual tokens implement one responsive app shell. Navigation uses hash states under `/`. Career facts, resumes, jobs, contacts, goals and preparation settings live in versioned browser localStorage, validated by Zod. Uploaded photos stay in the browser. No login, database, payment, model API, job-submission or email service is connected.

Local scoring uses disclosed deterministic rules and keyword overlap. It does not predict ATS acceptance, hiring probability or LinkedIn ranking. Resume JSON adapters exchange supported text with Reactive Resume v5/v6; browser print provides Save as PDF. This app is not yet wired to the repository's PDF/DOCX engine.

## Production integration design (not active)

| Layer           | Decision and rationale                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Web             | Next.js on Vercel; server components for authenticated initial data, small client components for editing; defer heavy image/editor code until needed                     |
| Identity        | Reuse `packages/auth` Better Auth through the existing server HTTP auth entry point. Do not enable the archived starter's separate password/session stack                |
| Domain services | Use existing `packages/api` protected procedures and DTOs for career/resume/application behavior; no cross-workspace `src` imports                                       |
| Database        | One shared PostgreSQL database via `packages/db` Drizzle. Reuse existing `career_profile`, resume and application records rather than creating parallel sources of truth |
| Files           | Private object storage with short-lived signed URLs, org/user-scoped keys, upload size/type validation and lifecycle deletion                                            |
| AI              | Existing `packages/ai` adapters behind server-side limits; provider credentials stay server-side. Suggestions reference supplied facts and retain input/model versions   |
| Jobs            | A durable worker/outbox for generation and supported application/email integrations. Vercel Cron may enqueue work; long-running work runs outside request handlers       |
| Billing         | Stripe-hosted checkout/portal, verified signed webhooks, server-side entitlement ledger; monthly subscription plus separately priced photo credits                       |
| Observability   | Error monitoring and aggregate product events without resume text, photo bytes, message content or provider secrets                                                      |

`schema.sql` is a reviewable **future design**, not an applied repository migration. Its `career_saas` namespace makes the proposed extension explicit. Before implementation, map profile/resume/job/application tables to existing schemas, represent remaining additions in Drizzle, run `pnpm db:generate`, and verify account export/deletion and web/mobile contracts. Existing Better Auth user IDs are **text**, so SQL references `public."user"(id)` with text foreign keys. The new app is outside `apps/web`/`apps/mobile`; production shared feature changes must follow repository parity rules.

## Tenant and identity boundary

Every account receives a personal organization. Organization membership permits `owner`, `admin`, `member` or `viewer`; invitations and membership mutations require a dedicated authenticated server service. Owners manage billing/domains, admins manage members, members edit their own career data, viewers read only their own data. Administrative membership is not blanket access to private resumes/photos. Explicit sharing would require a separate grant model and is out of scope.

The proposed SQL enforces both `org_id` and `user_id` on private records; composite foreign keys prevent attaching another user's resume, contact or job. RLS checks the current identity and active organization plus membership. Neither query parameters nor Host headers select an authorized user. Better Auth sessions are validated server-side, membership is resolved from the database, and the server then uses transaction-local `set_config('app.user_id', ..., true)` and `set_config('app.org_id', ..., true)` on the same checked-out connection.

These custom settings are **not authentication by themselves**. Use a dedicated non-owner, non-superuser, non-BYPASSRLS application role, never expose its database credentials to a browser, and revoke unneeded public grants. Table owners/migration credentials must not serve ordinary requests. Membership/billing/webhook provisioning uses narrow server paths with explicit authorization and audit. Do not replace this identity model with `auth.uid()` unless Supabase Auth is deliberately adopted and Better Auth IDs are mapped.

## Pooling and query design

Use a managed transaction-pooler connection for serverless requests and a separate direct connection for migrations. Cap application pool size per instance and total service concurrency to the database connection budget. Set transaction-local identity on each transaction; never use session-global `SET` with transaction pooling. Disable prepared statements when the chosen pooler requires it. Use cursor pagination on `(created_at,id)`; index org/user/status/date filters and foreign-key joins. Never cache private responses by URL alone: include user/org/entitlement revision or use request-local caching.

## Custom domains and subdomains

Canonical application access remains on the primary app domain. Optional future org subdomains resolve `slug.app-domain` only after mapping a verified org; wildcard DNS and Vercel project domains are infrastructure, not authorization. Reserve system names. Normalize hostnames to lowercase ASCII/punycode, reject IP/localhost/public-suffix-only claims, and use exact host matching.

Custom domains require a cryptographically random TXT ownership token, DNS verification, routing verification through Vercel's supported domain API and a valid certificate before activation. The SQL allows only one active owner per verified hostname. Recheck ownership/routing periodically; suspend stale claims. Remove provider routing on detach before making a hostname claim reusable. Restrict domain mutations to owner/admin. Keep auth cookies host-only on the canonical auth host; custom domains do not receive broad wildcard auth cookies. A custom domain never grants access to private career data.

## Delivery state and idempotency

Application states: `saved → matched → prepared → approved → submitting → submitted`; terminal alternatives `failed`, `cancelled`; interview/offer are separate user-reported hiring stages. In this local UI, `Applied` and `Contacted` are manual tracker labels only. Migration must preserve `source=manual` and must not manufacture receipts.

Outreach states: `draft → approved → queued → sending → sent`; delivery callbacks may yield `delivered`, `bounced` or `replied`. `sent` requires the provider to accept the exact recipient/content version; it does not imply delivery. Submission requires an employer/provider receipt or an explicit manual report recorded as manual. Uncertain outcomes enter `unknown` and require reconciliation before retry.

Idempotency key = user + org + action kind + target ID + content/document revision. Persist an outbox task and its approved snapshot atomically; a unique database key prevents duplicate enqueue. Workers claim leases with `FOR UPDATE SKIP LOCKED`, bound retries with backoff, respect daily limits/exclusions and retain provider request IDs. Never blindly replay a timed-out action that may have sent. Provider webhook IDs are unique; signature verification precedes deduplication/state changes. Resume edits invalidate old approvals. State changes and confirmations must be service-controlled; RLS alone does not authorize transitions.

## Future service surface

These are proposed server operations, not existing HTTP routes.

| Operation                                              | Who                         | Input/output                                                        | Flow          |
| ------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------- | ------------- |
| Get/update career profile; list/version/export resumes | Authenticated owner         | Validated facts and revision / owned artifact                       | F01           |
| Create profile review; accept selected change          | Owner with quota            | Own text, input revision / explained checks and editable suggestion | F02           |
| Request upload; create/cancel photo generation         | Owner with credits          | Validated asset/style / private asset and run state                 | F03           |
| Create job; compare; prepare; approve/revoke           | Owner with membership       | Posting, snapshot, rules / match reasons and preparation state      | F04           |
| Submit approved application                            | Authorized worker only      | Immutable approval + idempotency key / receipt or failure           | F04           |
| Save contact; draft; approve/revoke outreach           | Owner                       | Contact source + factual text / draft revision                      | F05           |
| Send approved outreach                                 | Authorized worker only      | Exact recipient/content approval / provider receipt                 | F05           |
| Manage members/domain/billing                          | Owner or permitted admin    | Membership/domain/payment mutation / status                         | S07/S08       |
| Billing/delivery callbacks                             | Verified provider signature | Unique event + timestamp / idempotent state update                  | Cross-cutting |

## Milestones and acceptance

1. **Local loop:** S07 → S02/S05/S06, tested local persistence, import/export and clear preparation states. No external credentials required.
2. **Private beta:** Better Auth session reuse, existing shared entities, reviewed migrations/RLS, private file storage, export/deletion. Test two users across two orgs, tenant switching, revoked membership and pooled-connection isolation.
3. **Paid writing/photo beta:** provider access, quotas/cost ledger, failure/refund behavior, billing webhooks, opt-in generation and deletion. Validate actual outputs and receipts before marketing the capability.
4. **Application/outreach integrations:** supported public APIs or permitted user-assisted workflows; approval snapshots, idempotent retries, confirmed receipt tests and visible failure recovery. Test one provider end-to-end before expanding.
5. **Production launch:** restore drill, domain ownership tests, responsive/accessibility checks, cancellation/refunds, error monitoring, consent/retention documentation and a supported mobile strategy.

Open risks: employer integration coverage, deliverability, unknown external-send outcomes, cost variability, sensitive-data lifecycle and unverified willingness to pay. The current local workspace intentionally does not imply these production capabilities exist.
