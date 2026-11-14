# Frontend design and verification workflow

This workflow applies to marketing sites, authenticated web apps and native mobile apps. Apply it to CareerOS and any marketing, SaaS or native surface changed in this repository. Use relevant checks on every change and document any tool or reference that could not be exercised.

## Rule for repository instructions

Add the following to the root `AGENTS.md` in each participating repository.

> Follow the frontend design and verification workflow for every user-facing UI change. Identify affected routes, roles, device sizes and screen states before editing. Capture the current experience. Check existing project primitives, then search 21st.dev and the relevant shadcn registry before authoring a new component. Use the project design system for typography, spacing, colour and interaction states. Keep a one-by-one record of the named tools and references, with an evidence link for each applied check and a reason for every inapplicable or blocked check. For an existing flow, exercise its critical path before and after changes. Run the repository checks and the relevant accessibility, responsiveness and interaction checks. Include the evidence in the PR and identify any screens that require a fixture, a test account or a native device.

## Assessment and implementation

1. **Inventory the product.** Map public routes, signup, activation, daily tasks, settings and account management. Link each route to its source and backend dependencies. Include dialogs and permission, loading, empty, error, offline and destructive states. Record which surfaces are responsive web, iOS or Android.
2. **Set the baseline.** Capture screenshots from the live product or a production-like environment. Record the commit, route, role, state, device and viewport. Test critical tasks using safe fixtures. Keep the test script and distinguish observations, source inspection and unverified claims.
3. **Benchmark comparable tasks.** Choose competitors by buyer, job and platform. Review their home, pricing and conversion pages and comparable onboarding and daily workflows. Use first-party evidence or licensed references. Record capture dates and access gaps. Compare task completion, time, steps, error recovery and design consistency under the same conditions.
4. **Prioritise redesign.** Fix blockers that prevent activation or task completion first. Define `DESIGN.md` and semantic tokens, then update shared primitives and navigation, marketing, authenticated journeys and native screens. State the expected user benefit for every change. Use isolated branches and keep changes reviewable by flow.
5. **Verify the new UI.** Retest the same tasks and roles using the same fixtures and capture sizes. Check web reflow at 390, 768, 1024 and 1440 px, plus critical narrow and wide sizes. Check keyboard access, visible focus, contrast, touch targets, reduced motion, network failure, route continuity and correct data submission. Use a device or simulator for native accessibility, back gestures, safe areas, keyboard and lifecycle.
6. **Measure the result.** Compare baseline and candidate for the primary conversion or activation rate, task success, median time on task, errors and rendering performance. Treat outcomes as hypotheses until measured. Record the comparison method, time window and sample size. Use regression counts and traceable evidence to decide whether to ship.

## Requested tools, one by one

| Tool or reference | Where it applies | How to verify use |
|---|---|---|
| Refero | Find marketing, SaaS and app reference screens by product or task | Link selected examples and describe the observable pattern |
| Mobbin | Review mobile task sequences | Link the flow, record captured steps and explain transferable decisions |
| DesignSystem | Define system foundations, tokens and component variants | Review the design-system diff and map tokens to implemented components |
| Awesome DESIGN.md | Compare density, type, composition and motion across design studies | Record chosen characteristics in the project's own DESIGN.md |
| Product Design | Capture and critique each user journey before redesign | Cite screenshots and observed behaviour by step |
| Intuitive Software Design | Review task hierarchy, labels, feedback and recovery | Walk through the first-use and repeat-use journeys |
| Better Design | Validate source and rendered screens across review categories | Record rule IDs, severity and measured or source-derived findings |
| UXCritique | Challenge hierarchy, copy and prioritisation against the user task | Attach annotated issues and a proposed fix |
| UX Pilot | Model or review a scoped flow in an owned design | Link the design version and identify which findings were independently verified |
| imperial_masters_cv.docx | Use if the document is supplied and contains relevant brand or content instructions | Record relevance. A Library title search did not find it |
| [Hallmark](https://github.com/Nutlope/hallmark) | Compare screenshots and preserve product behaviour through a redesign | Record routes, fields and actions retained alongside screenshots |
| [Astryx](https://github.com/meta/astryx) | Compare tokens, composable primitives and table or wizard patterns | Document adopted patterns and confirm React compatibility before using the package |
| [Rune](https://github.com/anomalyco/rune) | Review screenshot and accessibility-tree verification ideas | Apply a relevant verification technique in the existing stack |
| [Logia guide](https://logiaweb.net/hub/library/guides/design-inspo-stack) | Design-inspiration reference | Retrieval failed. Review when the source is reachable |
| [Unslop](https://github.com/heydamir/unslop) | Check spacing, colour, icons, copy, type, layout, details, visuals and motion | Show the changes for applicable passes |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | Search and inspect suitable React primitives and blocks | Review installed source, dependencies, keyboard behaviour and token integration |
| [Personal UI fork](https://github.com/jaimedhenriques/ui) | Check the user's shadcn fork for compatible project conventions | Compare selected component and upstream versions before merging |
| [Elaya design skills](https://github.com/elayadesign/ai-design-skills) | Improve campaign message, audience and primary action | Review consistency across campaign entry and conversion pages |
| [Emil Kowalski skills](https://github.com/emilkowalski/skills) | Review motion, timing, easing, press feedback and interruption | Exercise transitions with standard and reduced motion |
| [Apple Design](https://raw.githubusercontent.com/emilkowalski/skills/main/skills/apple-design/SKILL.md) | Review touch, direct manipulation, cancellation and native conventions | Check gestures, feedback and keyboard or accessibility equivalents |
| [UX/UI Agent Skills](https://github.com/plugin87/ux-ui-agent-skills) | Review tokens, contrast, focus, target size and responsive layout | Attach measurements and accessibility results |
| [Impeccable](https://github.com/pbakaus/impeccable) | Critique, audit, harden, adapt and polish the interface | Run the relevant source checks and review rendered evidence |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Check industry conventions, data presentation and stack guidance | Record the applicable recommendations and adopted decisions |
| [TasteSkill](https://www.tasteskill.dev/) | Establish art direction, visual hierarchy and product imagery | Inspect the candidate at desktop and mobile widths |
| [Web Design Guidelines](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md) | Check semantic HTML, forms, focus, navigation, motion and performance | Read current upstream rules and cite file and line for issues |
| [Image-to-Code](https://github.com/Leonxlnx/imagegen-skills) | Implement a selected visual reference | Compare responsive rendered output with the reference. The original TasteSkill path has moved |
| [Playwright CLI](https://github.com/microsoft/playwright-cli) | Record reproducible web flows, screenshots, traces and failure states | Attach matched baseline and candidate evidence at supported sizes |
| [Anti Slop](https://github.com/miqdadbadjuber/anti-slop) | Edit generic copy and unnecessary decoration | Show the revised copy or layout and its purpose |
| [SkillUI](https://github.com/amaancoderx/npxskillui) | Inspect existing style, tokens and reference interaction patterns | Identify observable inputs and apply the project's conventions |
| [Screenshot-to-code](https://github.com/abi/screenshot-to-code) | Prototype from an approved visual | Validate final behaviour and integrate through the existing component system |
| [AI Website Cloner](https://github.com/JCodesMore/ai-website-cloner-template) | Map public reference pages and selectively reproduce layout behaviour with original assets | Compare equivalent states at the same sizes |
| 21st CLI and MCP | Search the catalogue, inspect results and review changed UI | Record search terms, component provenance and results from the local review |
| 21st UI Explore and UI Build | Compare meaningful alternatives and implement in the product's stack | Log the chosen direction and review the integrated code |
| 21st UI Review | Find deterministic issues and design-system drift | Save output for the changed source and check against the rendered app |
| 21st AI | Generate variants when account usage confirms access | Check entitlement first and record any generated variant integrated |
| 21st Design Sync and Registry | Inspect or prepare eligible theme and component work | Link relevant registry or theme artefacts when sharing is in scope |

## 21st.dev and local verification

Keep account credentials in the environment or the local CLI sign-in store. Never commit a credential. Verify live discovery before claiming the MCP is connected.

In the target repository on a network that reaches 21st, use:

```bash
npm install --global @21st-dev/cli@1.18.0
21st login
21st whoami
21st skills install --agent codex
21st skills check
21st init --design-context
21st search "accessible dashboard navigation" --limit 2
```

Set `API_KEY_21ST` through the environment or CI secret configuration. The key pasted in chat should be rotated. Use the replacement key via the environment.

```bash
codex mcp add 21st --url https://21st.dev/api/mcp --bearer-token-env-var API_KEY_21ST
codex mcp get 21st
```

Restart the MCP client and verify discovery by listing the live server tools and exercising `search` and `get_component` against a relevant catalogue entry. A local config listing establishes registration only. Before using an AI tool, check the current generation entitlement with `21st usage --json`.

Sources: [21st setup](https://docs.21st.dev/mcp), [shadcn CLI](https://ui.shadcn.com/docs/cli), [Playwright CLI](https://github.com/microsoft/playwright-cli).
