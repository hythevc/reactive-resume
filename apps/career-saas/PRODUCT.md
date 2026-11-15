# CareerOS product

CareerOS is a local job-search workspace for people preparing their own application materials. A visitor can begin without an account or payment, replace fictional examples with their experience, create resume versions, inspect a saved role, review documents and keep track of their next action.

## Tasks

- Edit a factual career profile and resume versions; import supported Reactive Resume JSON and export JSON or browser-print PDF.
- Review supplied LinkedIn writing and edit section drafts using explained local checks.
- Crop and adjust an uploaded photo locally, compare the result and download a square image.
- Record career preferences, shortlist or pass on saved roles, and keep decisions separate from application stages.
- Prepare a resume and cover letter for a saved role. Personal review is the default; an external agent packet and imported report are optional.
- Keep user-researched contacts, source context, editable introduction drafts and manually recorded contact stages.

## Boundaries

The standalone browser app does not call an AI model, generate a new headshot, fetch a live job feed, submit applications, send employer messages, verify contact addresses or take payments. Do not describe preparation as delivery. Optional account-backed resume copies use the existing Reactive Resume bridge and require an explicit user action.

Browser data is local to a browser profile, without a local account lock or CareerOS encryption. Photos are temporary and excluded from backups. Preserve input on persistence errors, make recovery visible, and keep backup/reset confirmations and source/review freshness guards.

## Experience

The public site explains the actual product and its limits, shows clearly identified fictional examples and takes visitors into a useful task. The application names the current task, keeps editing and review within reach, shows real recorded state and reveals advanced configuration when needed. The same task must remain usable on a narrow phone, with keyboard access, reduced motion and readable full values.

The parent Reactive Resume web/server and Expo app are separate surfaces with real account-backed workflows. Preserve their ownership and platform conventions. Resume document templates keep their own typography and appearance independently of application chrome.

## Evidence

Implementation and data boundaries: README.md, features/, lib/workspace.ts, lib/application.ts and lib/workflow-safety.ts. Do not invent customers, hiring outcomes, review identities, ATS guarantees, paid entitlements or service availability.
