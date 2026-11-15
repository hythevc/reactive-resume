---
version: 8.0.0
name: Reactive Resume · Working Record
description: Cool paper, slate ink, and a restrained teal action color. Functional Figtree titles organize the work; resume and letter paper retain their own typography.
colors:
  light:
    bg: "#F5F7F8"
    surface: "#FFFFFF"
    raised: "#FFFFFF"
    sunken: "#ECF1F3"
    line: "#DCE4E8"
    line-2: "#8CA2AD"
    control-border: "#708995"
    ink: "#172B32"
    ink-2: "#3F535C"
    ink-3: "#5B6E77"
    accent: "#0B6E75"
    accent-hover: "#07555B"
    on-accent: "#FFFFFF"
    accent-soft: "#E4F3F2"
    accent-text: "#075E64"
  dark:
    bg: "#101A20"
    surface: "#17262E"
    raised: "#20323B"
    sunken: "#0B1419"
    line: "#314B57"
    line-2: "#526F7D"
    control-border: "#6D8A98"
    ink: "#EFF5F6"
    ink-2: "#C0D0D8"
    ink-3: "#9CB0BA"
    accent: "#7DD2D4"
    accent-hover: "#94DFE0"
    on-accent: "#082E33"
    accent-soft: "#153E45"
    accent-text: "#A5E6E6"
  paper: "#FFFFFF"
typography:
  title:
    {
      fontFamily: Figtree,
      fontSize: "28px mobile / 32px desktop",
      lineHeight: 1.15,
      fontWeight: 600,
      letterSpacing: -0.02em,
    }
  sheet-title: { fontFamily: Figtree, fontSize: 20px, lineHeight: 28px, fontWeight: 600 }
  heading: { fontFamily: Figtree, fontSize: 20px, lineHeight: 28px, fontWeight: 600 }
  section-heading: { fontFamily: Figtree, fontSize: 17px, lineHeight: 24px, fontWeight: 600 }
  label: { fontFamily: Figtree, fontSize: 15px, lineHeight: 22px, fontWeight: 600 }
  field-label: { fontFamily: Figtree, fontSize: 12px, lineHeight: 16px, fontWeight: 500 }
  body: { fontFamily: Figtree, fontSize: 15px, lineHeight: 24px, fontWeight: 400 }
  ui: { fontFamily: Figtree, fontSize: 14px, lineHeight: 20px, fontWeight: 400 }
  small: { fontFamily: Figtree, fontSize: 13px, lineHeight: 18px, fontWeight: 400 }
  caption: { fontFamily: Figtree, fontSize: 12px, lineHeight: 16px, fontWeight: 500 }
  mono: { fontFamily: Geist Mono, fontSize: 12px, lineHeight: 16px, fontWeight: 500 }
rounded:
  xs: 4px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  2xl: 16px
  3xl: 20px
  4xl: 24px
spacing: [4, 8, 12, 16, 24, 32, 48, 64]
motion:
  quick: 120ms
  standard: 200ms
  emphasized: 320ms
  easing: cubic-bezier(0.2, 0.8, 0.2, 1)
  exit: 70% of the entering duration
marketing:
  typography:
    title: { fontFamily: Figtree, fontSize: "40–42px mobile / 60–64px desktop", lineHeight: 1.05, fontWeight: 600 }
    body: { fontFamily: Figtree, fontSize: "16–18px", lineHeight: 1.6, fontWeight: 400 }
---

## Purpose and ownership

Reactive Resume uses Working Record: a compact professional workspace around a distinct document. Cool neutral surfaces, slate text, thin separators, and teal primary actions organize the work. Figtree names tasks and screens. The resume, letter, and real template previews keep their own fonts and colors.

This is the current parent web and shared UI reference. Semantic tokens live in `packages/ui/src/styles/globals.css`; shared primitives live in `packages/ui/src/components`; feature UI belongs in its owning `apps/web` feature. Native equivalents live in `apps/mobile/src/ui`. Keep the public homepage, account workspace, and native app in the same visual family without changing their auth, persistence, or API contracts.

1. **Show the work.** Keep documents visible when editing and collection actions beside the collection name.
2. **Name the next step.** Use a clear primary action, specific row labels, and explicit sort choices.
3. **Preserve control.** Keep manual entry, undo, import, settings, and reviewable AI proposals reachable.
4. **Reveal detail when useful.** Collapse optional configuration before adding another nested card.
5. **Use actual evidence.** Show real templates and sample documents. Never invent customer counts, results, account states, activity, or synchronization claims.

## Tokens and typography

- Use semantic utilities such as `bg-bg`, `bg-surface`, `border-line`, `text-ink`, and `bg-accent`. Legacy `background`, `foreground`, `primary`, and `sidebar-*` names are not defined.
- Use `bg` for the workspace, `surface` for a task panel, `raised` for menus and inputs, and `sunken` for tracks and the editor canvas. Avoid a card inside a card when spacing and a separator express the relationship.
- `ink` is primary text, `ink-2` secondary text, and `ink-3` readable metadata. Check text contrast on every tinted surface.
- `line` separates content; `line-2` is a decorative stronger rule. **Interactive boundaries use `control-border`**, whose light value is `#708995`: the lighter decorative rule does not provide sufficient control contrast against every surface.
- Native `controlLine` maps to web `control-border`; native `lineStrong` maps to the decorative strong line. Native also has an intermediate weak line. Match roles rather than assuming property names are identical.
- `danger`, `warn`, and `info` tokens retain their established meanings. Use `warn-ink` on solid warning fills. Stage colors appear with stage names; color alone never communicates an application state.
- `--paper` remains white in both themes. Theme changes must not invert a resume or letter.
- Figtree (`font-ui` / `font-sans`) is the app font, including page, sheet, dialog, and empty-state titles. Page titles use 28px on phones and 32px on larger screens, weight 600. Title spacing is tighter than body copy; text must wrap.
- Instrument Serif (`font-display`) is available for actual paper/specimen typography. It has one weight (400 and italic); never request synthetic bold. Resume templates retain their established fonts, Pokémon names, and palettes.
- Geist Mono (`font-mono`) is for shortcuts, URLs, slugs, filenames, and counts. Labels are sentence case and at least 12px. Avoid uppercase eyebrows and decorative tracking.
- Rich text uses the owned shadcn Typeset stylesheet at `packages/ui/src/styles/typeset.css`, with `typeset-chat` or `typeset-field`. Use `not-typeset` to opt a nested component out.
- Self-host Figtree, Instrument Serif, and Geist Mono through the existing font packages. Touch inputs use at least 16px text to prevent iOS zoom.

## Layout and controls

Use the 4px spacing scale. Phone pages have 16px margins; desktop content typically has 32–40px margins. Favor readable rows with a direct title/action relationship over a grid of status cards. A document may use a visual paper preview; metadata must remain readable in the list alternative.

- Small marks use 4px corners, controls 6px, work panels 8–12px, dialogs 16px, and native bottom sheets 20px. Real paper keeps its own geometry.
- Default buttons and inputs are 44px high. Compact 32px buttons remain available for dense desktop contexts; `touch-target` expands compact hit areas to 44×44px. Android controls use at least 48px targets.
- Reserve elevation for floating menus, layers, toasts, dragged items, and document paper. A stationary collection card does not need a shadow.
- Keep a contextual New action in the Documents header as well as global creation access. Creation must preserve the current collection context.
- Search, filters, sort, and view controls sit together beneath a collection title. Sorting presents named choices and the selected value, including on native.
- When a collection is genuinely empty, show one explanation and its useful action. Hide filters that have no items to filter. Preserve loading, error/retry, filtered-empty, selected-item, and forgotten-item recovery states.
- Facts starts with manual entry and resume import. Optional memory preferences sit behind a named disclosure; every preference remains available. Stories uses one fresh-empty action and restores the list/editor arrangement once work exists.

Phosphor regular icons come through the shared `Icon` registry; add new glyphs there. App icons are 20px on desktop and 24px on touch. Pair icons with text when useful. `IconButton` requires an accessible name; decorative icons are hidden from assistive technology. Directional arrows and chevrons mirror in RTL. Icons stored in resume data remain a separate Phosphor web-font contract.

## Component behavior

- Buttons use `primary`, `secondary`, `ghost`, `danger`, or `link`. Loading sets `aria-busy`, blocks repeat activation, and uses a progress label.
- Inputs use `raised` and `control-border`; focus adds the accent boundary and soft ring. Keep labels, error associations, and explicit remedies.
- Use `SwitchRow` so labels remain clickable; use `SegmentedControl` for short radio groups and `Tabs` for distinct panels. Native sort choices use the existing `SelectSheet`.
- Menus contain content-sized choices, with destructive actions last after a separator. Dialogs hold short create forms or decisions; sheets hold longer tasks. A New document form uses a bottom sheet on phones, fixed for the lifetime of the open task so a resize cannot discard work.
- Reversible actions offer undo. Confirm irreversible actions and explain what Cancel keeps. Closing a modal restores focus to its trigger.
- Toasts show one at a time, bottom center, with `bg-ink` / `text-bg`; default timeout is six seconds. Undo closes its toast after the handler; repeat activation during exit does nothing.
- Chats use the existing `MessageScroller` following/Latest behavior. AI proposals remain reviewable and provider configuration remains explicit. A visual cleanup must not remove functioning manual or AI controls.
- Empty-state headings use 20px Figtree 600 with concise body copy. Use an unframed or compact state inside an existing section instead of adding another panel.
- Preserve every primitive's `data-slot`; styles and behavior tests depend on it.

## Accessibility, themes, and localization

Target WCAG 2.2 AA. Show focus, name controls, pair status colors with words, provide keyboard/menu alternatives to drag, and trap focus only in modal layers. Escape closes the top layer; closing returns focus. Routine save feedback is polite; assertive announcements are for urgent errors. The application navigation focus manager may focus a heading after a route change; retain this behavior.

Every `DndContext` uses `dndContextProps()` so announcements name the item and its destination in the UI language. Test pointer, keyboard, text expansion, phone widths, and dark mode; source inspection or a web-rendered native gallery does not substitute for actual iOS/Android device testing.

The `theme` cookie stores light, dark, or system. `ThemeProvider` and the prepaint script apply the shared preference; the homepage follows the same mechanism. Preserve light document paper in all themes.

Translate copy and accessible labels through Lingui. Shared primitives receive translated labels as props. Locales come from `packages/utils/src/locale.ts`; root routing sets `lang`, `dir`, and Base UI direction. Prefer logical properties (`ps`, `pe`, `start`, `end`) and allow 30–50% expansion. Reuse existing IDs when rearranging copy; coordinate one extraction pass after parallel source changes settle.

## Motion

Use 120ms for hover/focus/toggles, 200ms for menus and content swaps, and 320ms for sheets/toasts, with `cubic-bezier(0.2,0.8,0.2,1)`. Exits take 70% of entrance duration. App timing helpers remain in `apps/web/src/libs/motion.ts`.

Keep loading placeholders still and document reflow instant. Reduced motion removes spatial movement, stagger, and decorative effects; known layer changes may retain a short opacity transition. Native system sheets retain platform accessibility behavior. Preserve existing navigation and drag timing contracts.

## Public homepage

`apps/web/src/features/homepage/page.tsx` composes the compact public page. Its hero puts the translated product promise and account-aware CTA beside the actual rendered sample resume. Factual capabilities follow as compact sections and separator rows, with real template thumbnails, language access, FAQ, support, and footer navigation.

- Use Figtree for public headings and body copy; large titles are 40–42px on phones and 60–64px on desktop. The rendered sample and template previews keep their document typography.
- Repeat the existing primary CTA in useful entry/exit positions. Preserve signed-in, signed-out, and guest destinations. Do not fabricate marketing statistics or convert decorative mock data into product claims.
- Use solid matte surfaces and buttons, restrained separators, and real product evidence. Avoid pinned scroll scenes, ambient particles, cursor glows, decorative theme cords, texture, gradients, and a repeated card grid for factual paragraphs.
- The active homepage does not mount the legacy scroll-story engine. Legacy scene modules may remain for compatibility, but their pinning and illustration choreography are not the active design contract.
- Use one `h1`, semantic sections/landmarks, a skip link, native links, and named controls. FAQ and locale controls must work with keyboard and touch. Nothing relies on hover or animation.
- The same `Homepage` composition feeds client routing and build-time prerender. Keep headings and body copy in initial HTML; public page content and the CTA must not wait for animation or client hydration.
- `apps/server/src/static/web.ts` serves locale-specific HTML and canonical, OpenGraph, hreflang, and structured data. Preserve the public ATS checker, routing fallbacks, support links, locale links, metadata, and the factual zero-price offer.

- **Template previews** come from each template's sample PDF (`apps/web/public/templates/pdf/<id>.pdf`), never at print resolution: `templates/jpg/<id>.jpg` at 600×848 (builder and letter cards, the mobile picker and the README; old mobile builds load this URL, so it stays a JPEG), and `templates/thumb/<id>.webp` at 596×843 with a 300×424 `<id>-small.webp` (homepage and gallery). Regenerate them with the server's sharp:

  ```sh
  id=gengar
  pdftoppm -png -r 300 -singlefile "apps/web/public/templates/pdf/$id.pdf" "/tmp/$id"
  (cd apps/server && node --input-type=module -e '
  import sharp from "sharp";
  const id = process.argv[1], dir = "../web/public/templates";
  const page = (width) => sharp(`/tmp/${id}.png`).resize(width, Math.round((width * 3508) / 2481), { fit: "fill" });
  const webp = { quality: 75, effort: 6, smartSubsample: true };
  await page(600).jpeg({ mozjpeg: true, quality: 75 }).toFile(`${dir}/jpg/${id}.jpg`);
  await page(596).webp(webp).toFile(`${dir}/thumb/${id}.webp`);
  await page(300).webp(webp).toFile(`${dir}/thumb/${id}-small.webp`);
  ' "$id")
  ```

## Review before shipping

Verify the actual affected flows: create/import, filters and pagination, sort selection, empty recovery, modal focus, and manual/settings controls. Check representative populated and empty states in light/dark, phone/desktop, expanded text, and RTL. Run appropriate behavior tests and typechecks. Record native runtime limits plainly; host tests, Hermes exports, and RNWeb gallery evidence are different kinds of proof.
