# MeetDex: public behavior and CareerOS role discovery

Sources accessed **8 November 2026 (UTC)**. MeetDex is the thirteenth competitor in this research set. Thirteen attempts produced twelve rendered public surfaces and one upstream failure (Jobscan). These observations inform selected workflows; they do not establish full competitor parity.

## Positioning and pricing

[MeetDex](https://meetdex.ai/) positions Dex as a talent agent for senior software engineers. Its public service emphasizes preferences beyond past employment, individually reviewed matches, feedback and candidate approval before introductions. Its [employer page](https://meetdex.ai/for-companies) describes curated technical talent, a human talent team and introductions into existing hiring workflows. These are service claims, not outcomes independently verified here.

The [candidate terms](https://meetdex.ai/candidate-terms), last updated September 2026, say in §4.1 that candidates are currently not charged; paid features may be introduced with advance notice. No employer fee or percentage was established. CareerOS's proposed $29/month remains a pricing hypothesis, not a validated or active offer.

The [current about page](https://meetdex.ai/about) identifies Paddy Lambros as Founder & CEO. The [29 April 2025 company release](https://meetdex.ai/blog/press-release) also identifies Harry Uglow as cofounder and CTO; his current role was not established. That historical release advertises voice/chat, career coaching and matchmaking. An [official 16 September 2026 update](https://www.linkedin.com/posts/meetdex_new-updates-on-dex-activity-7506021965548134400-JeG3) advertises persistent chat, application groups and tailored CVs with editing/upload. Neither announcement substitutes for observation of those live services.

## What REA actually observed

REA 6.8.0 used its actual local MCP server, `capture_browser_scenario` and `capture_web_screenshot`. All four declared scenarios completed. Exact inputs, actions, evidence IDs, request hashes, local record paths and capture limitations are preserved in [meetdex-evidence-index.json](meetdex-evidence-index.json).

| Public surface and action                            | Visible result                                                                                                                                      | Scenario evidence                                                     |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Homepage: navigate, wait for heading, settle         | Product preview with chat beside detailed role, Matches/Applications controls, one-card queue, role links and preference explanation                | `ev_c0ce08c7b9bcc2d5e5aa4cd7271d1dab78f333e481220e5dc10788b2977f2cfc` |
| Homepage: click Applications                         | Right preview changes to Draft, In review, Sent to company and Not put forward groups; the unsuccessful example includes a reason                   | `ev_3f7611dd8c12136483cb4fb10961a422c23109328b9991e99833b5520d6b9eaa` |
| Homepage: click Show the next match                  | Beam / Principal Product Engineer becomes Calibre / AI Product Engineer; salary, location, explanation and skill chips update; URL remains homepage | `ev_2a2421559408fffc96964759b01e25f3ff0bdd79cddeca2fc0b2cd36650ba592` |
| Navigate to https://app.meetdex.ai/; wait and settle | Redirects to /login?callbackUrl=%2F; welcome screen, Sign up with LinkedIn, optional news checkbox and policy links                                 | `ev_624fae622f8507953fdfb1dc81cf8df113563ea1885792d064428b35b658490f` |

The single-match preview changed from up to £250k / London Hybrid / TypeScript, React, Ruby, Ruby on Rails to up to £200k / London On-site / Python, TypeScript, AI Agents. These are public demonstration values, not verified available jobs or compensation benchmarks. The displayed application groups are demonstration entries, not evidence that a real application was sent.

Start application, Save for later and Skip in the public preview are links to app.meetdex.ai. They were not exercised as save/skip/submission operations. Observation stopped at the unauthenticated entry screen; no account, OAuth flow, input submission, upload, payment or outbound message was performed.

## From observed pattern to original local behavior

[Role discovery](../../features/role-discovery.tsx) uses the existing shared workspace and manually saved jobs. Its design, copy, components and data remain CareerOS's own.

| Observed pattern                                                       | CareerOS behavior and practical boundary                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public brief illustration covers problems, team, scope and environment | Your brief saves those four editable preferences alongside role, location and salary goals. Preferences are user statements, not verified employer facts; salary is not checked against postings.                                                                                  |
| One visible role with explanation and next actions                     | Review roles shows one eligible Saved, Unreviewed job at a time, using the shared keyword/company/location criteria. The brief is guidance; it does not power semantic matching or a learned model.                                                                                |
| Candidate feedback and deliberate choice                               | Shortlisted and Passed decisions, with optional reason and Undo, persist separately from Saved/Draft/Applied/Interview application stages. A passed role is excluded by the shared draft-preparation helper.                                                                       |
| Candidate controls sharing and sees job context                        | Shortlisted roles have editable introduction drafts from supplied identity, skills, target role/company and brief. Current template inputs are inspectable; edited draft content still needs review. A review checkbox gates copying. Refresh asks before replacing existing text. |
| Clear application stages                                               | Existing local application stages remain user maintained. Shortlisting, generating or copying an introduction never marks a role Applied or confirms delivery.                                                                                                                     |

Briefs, decisions and introduction drafts are part of the versioned local workspace and its backup/restore/reset behavior. Existing backups default missing fields. No Dex recruiter network, live discovery, AI chat, model learning, voice calls, recording, company contact or automated sharing is connected.

## Advertised features that remain untested

[Candidate terms](https://meetdex.ai/candidate-terms) §§4.2–4.5 describe LinkedIn-linked accounts or possible CV/question alternatives, a scheduled recorded/transcribed AI conversation with possible chat/email alternatives, matching analysis and introductions after candidate interest plus fit. These are documented service steps, not authenticated onboarding observed by this investigation.

Live conversation quality, actual matching, per-application CV generation, interview coaching, recruiter delivery, employer integrations, billing and native mobile availability remain unknown. LinkedIn verification/import is not evidence of a LinkedIn optimization tool. “Submitting applications” in an announcement does not establish unattended general job-board auto-apply. No profile-photo generation workflow was observed.

## Evidence scope

The full local source record is /workspace/competitor-observation/meetdex-rea/REPORT.md; source request/response files, accessibility artifacts and PNGs remain in that directory. Text research and a dated primary-source register are under /workspace/competitor-observation/meetdex-research/. The adjacent index retains artifact paths without shipping vendor screenshots or other vendor assets in CareerOS.

Each scenario captured only URL, accessibility and screenshots; `events: []` was intentional. REA therefore reports scenario completeness incomplete and equality_eligible:false. Follow-up screenshots are complete only within the visible viewport. No DOM/source, network body, private API or script analysis was requested. Owned proxy-configured Chromium used TLS verification; browser cleanup is recorded. These limits prevent a full backend or application parity claim.
