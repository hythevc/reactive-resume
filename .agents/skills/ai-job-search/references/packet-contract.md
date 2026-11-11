# CareerOS packet contract

The authoritative Zod schemas are in `apps/career-saas/lib/application.ts`. This reference describes version 1. Do not add keys or convert an unsupported version silently.

## Shared structures

`Profile` is a strict object with eleven normalized string fields:

| Field                                  | Maximum characters                                               |
| -------------------------------------- | ---------------------------------------------------------------- |
| name, email, phone, role, location     | 500 each                                                         |
| website, linkedinUrl                   | Empty or http/https URL, 2,000 each; never fetched by this skill |
| summary, skills, experience, education | 50,000 each                                                      |

Downloaded packets contain all eleven keys. The underlying profile schema defaults older missing phone/website/linkedinUrl values to empty strings, but this workflow must echo the complete normalized downloaded input rather than reconstructing it.

`SourceJob` is a strict object, not the full workspace Job record:

| Field                   | Type / limit                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| company, role, location | String, 500 characters each                                                               |
| url                     | String, empty or an http/https URL, at most 2,000 characters; never fetched by this skill |
| description             | String, at most 50,000 characters                                                         |

`ApplicationInput` is a strict object with exactly:

- `sourceProfile`: Profile, authoritative candidate facts.
- `sourceJob`: SourceJob, employer-supplied role context.
- `targetKeywords`: string, at most 10,000 characters and 100 comma/semicolon/newline-separated terms.
- `resume`: Profile, editable baseline; not an independent source of candidate facts.
- `coverLetter`: string, at most 20,000 characters; editable baseline.

## Export packet

The strict outer object has exactly `format`, `packetId` and `input`:

- `format`: literal `careeros.application-packet.v1`.
- `packetId`: nonempty string, at most 100 characters, preserved exactly.
- `input`: ApplicationInput, preserved exactly in the result.

## Return result

The strict outer object has exactly `format`, `packetId`, `input`, `resume`, `coverLetter` and `review`:

- `format`: literal `careeros.application-result.v1`.
- `packetId`: the original packet's exact packetId.
- `input`: a deep copy of the original packet's exact input values. Preserve all strings, including spaces and line endings; do not substitute the newly drafted documents here.
- `resume`: the finally reviewed Profile object, all eleven normalized fields present.
- `coverLetter`: the finally reviewed string, at most 20,000 characters.
- `review`: strict object containing only `summary` (string with non-whitespace content, at most 5,000 characters) and `issues` (array of at most 50 strings, each at most 2,000 characters). Empty or whitespace-only summaries are rejected on import.

No `approved` boolean, score, file path, status update, model metadata or other extra field is accepted. Do not add wrapper objects or Markdown fences. Empty strings are valid where the schema permits them; they do not authorize inventing missing facts.

The browser's result import limits both files and pasted text to 8 MiB of UTF-8 data. Keep the serialized UTF-8 result within that limit. If reducing output verbosity cannot fit while preserving the complete input echo, ask the user to shorten the source in CareerOS and export a fresh packet. Never remove source fields or truncate the echoed input to fit.

`issues` means unresolved actionable problems in the drafted documents. Qualification gaps and unknowns belong in `summary`; they are not automatically draft defects. Nonempty issues are allowed on import and retained for display and repair; they block reviewed-document export. They must not be deleted merely to unlock export. If the limited final review finds no remaining draft issue, `issues` may be an empty array. Neither import nor an empty issue list verifies real-world facts or gives permission to submit.

## Binding and stale results

CareerOS rejects a result with a different packet ID or input echo. The packet captures both original sources and the document baselines; editing either baseline after exporting makes the old result stale. Updating source facts or the job requires refreshing the source snapshot and exporting a new packet. Do not repair a stale result by changing its echoed values: re-run drafting/review from a new packet.

The result's review is bound to its returned resume and cover letter. After import, subsequent manual document edits invalidate that exact-document review. The review must describe the documents actually returned, not an earlier revision. Reviewed-package export also requires current source snapshots and human acknowledgment in the browser. The skill does not manufacture an approval state. The imported report is a user-supplied record, not authenticated proof of a reviewer identity.
