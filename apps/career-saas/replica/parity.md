# CareerOS feature coverage

Generated 8 November 2026 with the installed Replica `replica-diff/parity.py` from `features.csv`. Scope is the combined requested career SaaS and selected public competitor workflows, not parity with any single competitor. `original=yes` means included in this requested/reference baseline. Priorities and row granularity are product judgments, so this number is not an independent benchmark. No visual score was supplied; the tool’s overall number equals feature coverage.

`yes` records implemented local functionality by source inspection; runtime browser results belong in the separate QA report. Local behavior is not evidence of cloud/provider delivery. No rows were skipped to hide production gaps.

## Parity: 46.2 / 100

features 46.2 (35 counted, must-haves 10 of 23 done)

Not shippable yet: 13 must-have features are not done.

## By area, weakest first

- mobile 0.0 (1 features)
- saas platform 6.2 (6 features)
- photos 28.6 (3 features)
- jobs 46.0 (9 features)
- outreach 50.0 (6 features)
- marketing 50.0 (1 features)
- analytics 50.0 (1 features)
- linkedin 75.0 (2 features)
- resumes 78.6 (5 features)
- web 100.0 (1 features)

## Missing, in build order

- [must] jobs: Apply to jobs unattended with resume and answers, no (No submission adapter or scheduler; opening employer URL is not submission; reference https://www.loopcv.pro/)
- [must] jobs: Capture confirmed submission receipts and failures, no (Local manual Applied status is not external proof; production automation requires receipts; requested SaaS requirement)
- [must] jobs: Continuously discover live relevant jobs, no (No live job feed crawler or scheduled discovery provider; reference https://www.sonara.ai/)
- [must] outreach: Find recruiters and verify their email addresses, no (No recruiter network email finder verifier or provenance integration; reference https://hunter.io/)
- [must] outreach: Send recruiter emails through a connected account, no (No email provider connected; mailto does not deliver a message; reference https://www.loopcv.pro/)
- [must] photos: Generate a new professional AI headshot, no (Photo editor is not headshot generation; image provider absent; reference https://www.headshotpro.com/)
- [must] resumes: AI tailor resume wording to a target job, no (No connected text model; editor and job scores do not generate tailored resumes; reference https://www.tealhq.com/)
- [must] saas platform: Cloud sign-up sign-in and account recovery, no (Current career app has no live auth; starter auth archived not active; requested SaaS requirement)
- [must] saas platform: Paid checkout subscriptions and entitlements, no (Plans are local previews; no charge checkout or active entitlement enforcement; requested SaaS requirement)
- [must] saas platform: Persist and synchronize career data across devices, no (Browser localStorage only; no live cloud database; requested SaaS requirement)
- [must] saas platform: Tenant ownership and role authorization, no (Proposed SQL schema is not applied or exercised; local browser workspace has no tenant boundary; requested multi-tenant SaaS requirement)
- [must] jobs: Compare a posting against profile skills, partial (Local keyword-overlap estimate only; no ATS integration or semantic matching; reference https://www.jobscan.co/)
- [must] linkedin: Review LinkedIn profile with actionable checks, partial (Local disclosed writing checklist implemented; no authenticated LinkedIn scan or model-backed analysis; reference https://www.careerflow.ai/)
- [should] jobs: Autofill employer application forms, no (No browser extension or form integration; reference https://simplify.jobs/copilot)
- [should] mobile: Dedicated native mobile career app, no (Existing Reactive Resume mobile app is not this career SaaS; no adapted native build; requested broader app scope)
- [should] outreach: Schedule followups and track actual replies, no (Manual Replied label only; no inbound sync or scheduler; reference https://hunter.io/)
- [should] photos: Choose generated headshot outfits and backgrounds, no (No generation engine or generated output gallery; reference https://www.aragon.ai/)
- [should] saas platform: Self-serve billing portal and payment webhooks, no (Archived starter billing is not wired to CareerOS; requested SaaS requirement)
- [should] analytics: Measure actual application delivery and interview conversion, partial (Local user-maintained counts only; no provider-confirmed delivery events; reference https://www.loopcv.pro/)
- [should] jobs: Filter automation by role location salary and company exclusions, partial (Role/location/salary goals saved but only profile keyword threshold drives current preparation; company exclusions absent; reference https://www.loopcv.pro/)
- [should] marketing: Original marketing positioning and proposed pricing, partial (About page and local proposed plans; no validated acquisition conversion or production checkout)
- [should] saas platform: Export restore and delete workspace data, partial (Local backup validated restore and reset; no server/account deletion; requested SaaS requirement)

## Next five implementation priorities

1. Wire real authentication, tenant ownership and cloud persistence, then verify isolation.
2. Connect a text/image provider and verify factual resume changes and actual headshot output.
3. Add supported job discovery/submission adapters with explicit confirmation receipts and failure recovery.
4. Connect verified recruiter data and user-authorized email delivery with reply/follow-up tracking.
5. Wire checkout, entitlements, billing webhooks and cancellation before charging customers.

## Behavior differences retained

- Competitor resume and LinkedIn tools advertise AI assistance; this version offers manual editing and disclosed local writing checks.
- HeadshotPro/Aragon generate new photos; this version crops and adjusts an uploaded photo locally.
- LoopCV/Sonara advertise applications while the user is away; this version prepares local drafts only and opens the employer page.
- NetworkAI/Hunter advertise contact/email services; this version stores supplied contacts and opens the user’s email composer.
- Cloud career services persist account data remotely; this version stores data in the current browser and offers backups.

These differences are explicitly disclosed in the product. They are launch gaps, not hidden equivalence claims. Original authenticated flows were not traversed, so click-count and delivery-reliability comparisons are not available.
