# CareerOS · Working Record

CareerOS puts the candidate's work first: their source experience, the role they chose, the document they are editing, and the next action they will take. Clear record structure supplies the identity. Application chrome stays distinct from the resume's own appearance.

## Typography and hierarchy

Figtree is the application and marketing face. Use 600–650 weight for task headings, 32px on desktop and 28px on a phone. Body text is 15px with a 24px line; controls are 14px and metadata/labels at least 12px. Phone text inputs use 16px. Marketing may use a 60–64px heading on desktop and 40–42px on a phone, with concrete product copy rather than an abstract introduction.

Instrument Serif remains available to document specimens. Actual resume templates retain their independent typography; changing the interface must not change exported document appearance.

## Semantic palette

| Role                     | Light value |
| ------------------------ | ----------- |
| Background               | `#F5F7F8`   |
| Surface and paper        | `#FFFFFF`   |
| Ink                      | `#172B32`   |
| Secondary text           | `#3F535C`   |
| Muted text               | `#5B6E77`   |
| Divider                  | `#DCE4E8`   |
| Strong decorative line   | `#8CA2AD`   |
| Control boundary         | `#708995`   |
| Primary action and focus | `#0B6E75`   |
| Primary hover            | `#07555B`   |
| On-primary text          | `#FFFFFF`   |
| Selection surface        | `#E4F3F2`   |
| Selection text           | `#075E64`   |

The shared parent web/native system defines paired dark roles in `apps/web/DESIGN.md`. Do not imply the standalone app offers a theme switch before that behavior exists. Warning, error and recorded application stages keep distinct semantic meaning; their labels remain readable without color.

Use matte surfaces. Dividers separate repeated records; a work panel groups an actual editing or review task. Shadows are for overlays and elevated controls, not ordinary list rows. Controls use a 6px radius, work panels 8–12px, and sheets up to 16px. Touch targets are at least 44px; native Android uses 48dp where required by its owner.

## Composition

- Public pages show one useful example connecting a selected role, source document and review. A clearly labeled fictional example is evidence of the workflow, not a delivered outcome. Specimen text does not pollute page heading navigation.
- Tool pages name their specific input/output and next action. Default personal review comes before the optional external-agent handoff. Pricing explains the actual free local offer.
- App headers name the task and put actions nearby. Repeated career records use clear role-first rows with full stage labels. Counts navigate to the state they describe.
- Optional preparation settings, version metadata and import guidance are secondary. Document editing and preview/export remain within reach on a phone. Returning from a review restores a useful place and keyboard focus.
- Navigation, forms, loading/empty/error/saving states, storage recovery and strict source/review guards remain functional. The design does not rename preparation as submission or imply an unavailable service is active.

## Sources and rationale

The repository UI workflow records the required Core Five and component research. Relevant reference principles are the Glassdoor/Handshake record hierarchy, Teal's adjacent source/document flow, shadcn Item/Empty slots, and the Linear design study's type discipline and product evidence. These are principles to adapt into existing owners, with original branding and palette; no proprietary source, private catalog asset or complete reference design is copied.

The visual direction is professional and active through hierarchy, distinct content rhythm and meaningful state. Interaction motion is limited to clear hover/press/focus feedback, respects reduced motion and never requires a multi-viewport pinned scene to understand the product.
