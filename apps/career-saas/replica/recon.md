# CareerOS product recon

Working product name: CareerOS. Audience: experienced professionals managing a job search. Platform: responsive web first. Scope: one reusable career profile serving five workflows—resumes, LinkedIn reviews, profile photos, application preparation, and recruiter outreach. This is an original implementation of observed functional patterns, not a replica of any single competitor's visual identity.

## Evidence and boundary

Public pages were read on **8 November 2026**. Evidence describes advertised features and visible public flows; paid product screens, private APIs, application binaries, actual delivery reliability, and algorithm quality were not inspected. “Proposed” below denotes our product decisions. Prices are dated snapshots. The linked X post could not be retrieved and is not evidence.

| Source                                                                                                                            | Public evidence                                                                                                                                  | Product implication                                                              |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Teal](https://www.tealhq.com/), [pricing](https://www.tealhq.com/pricing)                                                        | Resume versions, job matching, tracker; $29 per 30 days                                                                                          | Keep documents and job context connected                                         |
| [Rezi](https://www.rezi.ai/), [pricing](https://www.rezi.ai/pricing)                                                              | Build, score, target; Pro $29/month                                                                                                              | Editable structured sections with understandable checks                          |
| [Jobscan](https://www.jobscan.co/)                                                                                                | Resume/job comparison, skills gaps, LinkedIn optimization                                                                                        | Explain which supplied terms match; avoid hiring-probability claims              |
| [Resume Worded](https://resumeworded.com/linkedin-review/)                                                                        | Dedicated LinkedIn review entry point; deeper flow behind signup                                                                                 | Separate review workspace; details beyond public entry remain unknown            |
| [Careerflow](https://www.careerflow.ai/)                                                                                          | LinkedIn optimizer, resume tools, autofill, networking and job tracking                                                                          | Reuse one factual career profile across tools                                    |
| [HeadshotPro](https://www.headshotpro.com/)                                                                                       | Selfie guidance, styles, generation queue, gallery; $29–$59 one-time packages                                                                    | Quality guidance → style/crop → result/download                                  |
| [Aragon](https://www.aragon.ai/)                                                                                                  | Headshots, attire/background options, image edits                                                                                                | Offer clear professional presets; generation remains provider-backed             |
| [Simplify](https://www.simplify.jobs/)                                                                                            | Matched jobs, reusable profile, autofill and tracker                                                                                             | Review role context before application                                           |
| [LoopCV](https://www.loopcv.pro/), [pricing](https://www.loopcv.pro/pricing/)                                                     | Search loops, exclusions, review modes, recruiter emails; paid from €9.99/month advertised                                                       | Preview relevance and show preparation separately from delivery                  |
| [Sonara](https://www.sonara.ai/)                                                                                                  | Preferences → matching → applications advertised                                                                                                 | Explicit role/location preferences; no assumed application coverage              |
| [NetworkAI](https://www.wonsulting.ai/networkai)                                                                                  | Contact discovery and resume-powered networking drafts                                                                                           | Contact → factual draft → edit → copy/send → track                               |
| [Hunter](https://hunter.io/)                                                                                                      | Email discovery/verification, source evidence, sequences                                                                                         | Store contact provenance; never invent or imply verified addresses               |
| [Teal user reviews](https://www.trustpilot.com/review/tealhq.com), [LoopCV reviews](https://www.trustpilot.com/review/loopcv.pro) | Small qualitative sample describes repetitive tailoring, inaccessible notes, robotic wording, irrelevant matches and failed application attempts | Visible notes, editable wording, match explanations and explicit failure reasons |

Research detail and dated vendor pricing are reproduced in [business.md](business.md). Review anecdotes are research, never testimonials. No frequency or representative-market claim follows from this small sample.

## Screen inventory

The IDs below describe **our proposed/implemented screen structure**, inferred from the patterns above; they are not a claim to have inspected competitors' authenticated screens. The single Next.js route `/` currently uses hash navigation.

| ID  | Screen / location               | Purpose and components                                                           | Required states                                                                       |
| --- | ------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| S01 | Overview `/#overview`           | Profile readiness, task links, job/activity summaries                            | Fictional example, user data, empty workspace                                         |
| S02 | Resumes `/#resumes`             | Versions list, section form, document preview, JSON import/export, print/PDF     | Empty, editing, saved, invalid import, delete confirmation                            |
| S03 | LinkedIn studio `/#linkedin`    | Headline/About/experience/skills input, explained checks, editable output        | Before review, results, incomplete input, copy fallback                               |
| S04 | Photo studio `/#photo`          | Own-image upload, preview, framing and download                                  | Empty, valid image, rejected file, preview, export failure                            |
| S05 | Job autopilot `/#jobs`          | Search/stage filters, job list, details/notes, preferences, preparation controls | Saved, draft, manually applied/interview, no matches, paused, preparation limit       |
| S06 | Recruiter outreach `/#outreach` | Contact list/form, editable message, copy/compose, manual status                 | Empty, draft, contacted/replied tracker, invalid email, clipboard denied              |
| S07 | Settings `/#settings`           | Career profile, local backup/import, reset                                       | Unsaved edit, valid restore, rejected backup, reset confirmation, storage unavailable |
| S08 | Plans `/#plans`                 | Proposed tiers and capability limits                                             | Informational/local selection; no checkout or entitlement claim                       |
| S09 | Product page `/about`           | Original positioning, workflow overview, workspace CTA                           | Responsive public page; no invented testimonials or outcome claims                    |

## Five core flows

| ID  | Goal and path                                                                                                 | Completion evidence                        | Important edge                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| F01 | S07 career facts → S02 resume → edit/duplicate → export                                                       | JSON download or browser print dialog      | Imported text is validated and escaped; unsupported formatting may be lost      |
| F02 | S03 own profile text → local review → inspect explanations → edit/copy                                        | Visible checklist and copied selected text | Score measures disclosed writing rules, not LinkedIn ranking or recruiter reach |
| F03 | S04 upload own photo → frame/style locally → download                                                         | Downloaded image                           | Local crop/filter is not an AI headshot; generation needs a connected provider  |
| F04 | S07 goals → S05 add posting → compare supplied keywords → prepare draft → open employer page → manually track | Local draft and user-reported stage        | No scheduler, browser autofill, submission or receipt in this version           |
| F05 | S06 research/add contact → draft from facts → edit → copy/open email app → manually track                     | Saved message and user-selected stage      | Opening a mail composer does not send; copying does not change delivery state   |

Happy-path click counts are not claimed: competitor authenticated paths were not measured, and editable field counts vary. These flows give browser testing concrete completion conditions.

## Shared components and model

Shared shell/navigation, page heading, primary/secondary button, labeled field, validation notice, confirmation, editable list/detail panel, status filter and empty state recur across screens. Desktop sidebar collapses to a mobile navigation drawer. Keyboard focus and readable control text are requirements.

| Entity                  | Relationship                                                 | Evidence / confidence                                                                         |
| ----------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Career profile          | One user; supplies many resume/message versions              | Integrated Careerflow/Teal patterns; high-level concept high, exact competitor schema unknown |
| Resume version          | Owned profile snapshot, optional target job                  | Teal/Rezi versioning; high-level high                                                         |
| Review                  | Input snapshot, rule/model version, checks, accepted wording | LinkedIn review patterns; proposed storage fields                                             |
| Photo asset             | User-owned source/output, optional generation run            | HeadshotPro sequence; proposed storage fields                                                 |
| Job and application     | Posting, resume snapshot, preparation and delivery state     | Simplify/LoopCV; high-level high, exact transitions proposed                                  |
| Contact and outreach    | Source, message snapshot, delivery attempts                  | NetworkAI/Hunter; high-level high, exact schema proposed                                      |
| Organization/membership | Tenant boundary and role; personal org initially             | Our future SaaS architecture, not competitor inference                                        |

## Scope and differentiation

Build shared factual context and control: show why a match appears, keep notes visible, preserve user claims, edit every suggestion, distinguish a prepared action from an externally confirmed one. These are concrete product choices grounded in qualitative evidence, not proven commercial differentiation.

Excluded: competitor branding/assets/code, proprietary contact/job networks, their users/data, inferred private endpoints, interview guarantees, autonomous external submission without a supported integration, native mobile release, live AI generation, email delivery, payments and cloud persistence in the local version. Existing Reactive Resume remains the source for its resume exchange format and future shared services.

Size: eight workspace screens plus one product page, five core flows, local implementation medium; reliable multi-tenant production automation large. Hardest work: verified delivery across employer systems, safe identity/tenant integration, and provider economics/reliability. Architectural decisions and proposed SQL follow in [architecture.md](architecture.md) and [schema.sql](schema.sql).
