# Source and adaptation

Upstream: [ai-job-search-dev/ai-job-search](https://github.com/ai-job-search-dev/ai-job-search).

Pinned source commit: `e9ab29dcc20b3d802356077b02898cd97db0d312`.

License: MIT, copyright 2026 Mads Lorentzen. The exact upstream notice is retained in [LICENSE](LICENSE).

Adapted references:

- [Drafter/reviewer application command](https://github.com/ai-job-search-dev/ai-job-search/blob/e9ab29dcc20b3d802356077b02898cd97db0d312/.claude/commands/apply.md): source-grounded drafting, inline reviewer context and revision.
- [Writing style](https://github.com/ai-job-search-dev/ai-job-search/blob/e9ab29dcc20b3d802356077b02898cd97db0d312/.claude/skills/job-application-assistant/03-writing-style.md): concise, specific writing and honest reframing.
- [Job evaluation](https://github.com/ai-job-search-dev/ai-job-search/blob/e9ab29dcc20b3d802356077b02898cd97db0d312/.claude/skills/job-application-assistant/04-job-evaluation.md): requirement/evidence comparison and explicit gaps.

This is an intentionally tracked CareerOS adapter, not a vendor checkout. It adds a portable JSON packet/result handoff, exact source/draft binding, a separate read-only review of the final pair, and private output paths. It replaces upstream candidate/profile files with exported source facts, omits culture/eligibility scores and unsupported assumptions, and removes mandatory product branding, portal scraping, salary lookup, LaTeX compilation, external tracker writes and application submission.

Upstream personal profile templates, `.claude` settings, portal CLIs and copied candidate artifacts are not dependencies of this adapter and are not shipped with the SaaS. The upstream repository is separately installable for local developer use; no upstream update silently changes this pinned adapter. Review source, license and behavior before deliberately updating the pin.
