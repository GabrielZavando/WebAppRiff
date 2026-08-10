# Tasks — NosotrosTeamSection

## 1. Types

- [x] 1.1 Create `apps/web/src/lib/types/nosotros-team-section.ts` with the closed union `TeamMemberRole` (`gerente-general` | `jefe-de-proyectos` | `comercial`), the `TeamMember` interface (`name`, `role`, `image: ImageMetadata`, `imageAlt`) and the `NosotrosTeamSectionProps` interface (`headline`, `subtitle`, `eyebrow`, `members`) — all fields `readonly`, no `any`
- [x] 1.2 Create the type-level tests in `apps/web/src/lib/types/__tests__/nosotros-team-section.test.ts` asserting the contract shape (readonly props, role union members, ImageMetadata images)

## 2. Config

- [x] 2.1 Create `apps/web/src/lib/config/nosotros-team-section.ts` importing `f-1.jpg`, `f-2.jpg`, `f-3.jpg` from `@/assets/img/` and exporting `TEAM_MEMBERS` (Steven Marks / Gerente General, Lara Smith / Jefe de Proyectos, John Doe / Comercial) and `NOSOTROS_TEAM_SECTION_CONTENT` (`headline: 'Liderazgo & Experiencia'`, subtitle "De una tradición familiar a la manufactura y servicios de clase mundial") as `Readonly<NosotrosTeamSectionProps>`
- [x] 2.2 Create the config tests in `apps/web/src/lib/config/__tests__/nosotros-team-section.test.ts` validating: headline/subtitle values, exactly 3 members, roles belong to `TeamMemberRole`, images are `ImageMetadata`

## 3. Component

- [x] 3.1 Create `apps/web/src/components/NosotrosTeamSection.astro` as a dumb presentational component (props-only, no logic beyond destructuring) rendering: centered header (`<h2>` title + subtitle) and a responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) of member cards
- [x] 3.2 Implement each member card: `astro:assets` `<Image>` (object-cover, `loading="lazy"`, descriptive alt, `will-change-transform`), navy overlay `bg-secondary/80`, name (`text-white font-heading font-bold`) and role (`text-primary font-heading font-semibold uppercase`) anchored at the bottom, container `relative overflow-hidden`
- [x] 3.3 Implement the hover state: overlay fades `bg-secondary/80` → `bg-secondary/30` with `transition-opacity` ease-out (≈350ms or `duration-300` if no 350ms token exists) and photo scales via a component-scoped CSS class using `scale3d(1.05, 1.05, 1)` with `transition-transform` ease-out; add `@media (prefers-reduced-motion: reduce)` rule disabling the transform while keeping the overlay change
- [x] 3.4 Create the component tests in `apps/web/src/components/__tests__/nosotros-team-section.test.ts` covering: `<h2>` headline, subtitle, exactly 3 cards with names/roles, lazy images with alt, `overflow-hidden` container, overlay rest opacity, hover/transition/will-change classes and reduced-motion rule presence

## 4. Integration

- [x] 4.1 Update `apps/web/src/pages/index.astro` to import `NosotrosTeamSection` and `NOSOTROS_TEAM_SECTION_CONTENT` and render `<NosotrosTeamSection {...NOSOTROS_TEAM_SECTION_CONTENT} />` immediately after `<PilaresSection {...PILARES_SECTION_CONTENT} />`
- [x] 4.2 Run the full `apps/web` test suite (unit + typecheck) and confirm all tests pass

## 5. POST-APPLY FIX #1 — overlay gradient, persistent overlay, grayscale-to-color (client feedback 2026-08-09)

- [x] 5.1 Update `design.md` § D5/D6 and `specs/team-section/spec.md` requirements/scenarios to declare: linear vertical gradient overlay (`bg-linear-to-b from-secondary/30 to-secondary/85`) instead of the solid `bg-secondary/80`; overlay persists on hover (only becomes more transparent: `from-secondary/10 to-secondary/55`, never disappears); photo grayscale at rest → `grayscale-0` on hover; all transitions smooth ease-out (≈300-350ms)
- [x] 5.2 Update `apps/web/src/components/NosotrosTeamSection.astro`: overlay becomes `bg-linear-to-b from-secondary/30 to-secondary/85` with `group-hover:from-secondary/10 group-hover:to-secondary/55` and `transition-[background-image]`; photo gains `grayscale` + `group-hover:grayscale-0`; photo transition covers both filter and transform (`transition-[filter,transform]`)
- [x] 5.3 Update `apps/web/src/components/__tests__/NosotrosTeamSection.test.ts` and its helper to assert: gradient stops at rest (`from-secondary/30`, `to-secondary/85`), gradient preserved + more transparent stops on hover (`from-secondary/10`, `to-secondary/55`), grayscale at rest + `grayscale-0` hover, transitions `background-image`/`filter`/`transform` with ease-out, reduced-motion disables transform and transitions
- [x] 5.4 Re-run the full `apps/web` suite (unit + typecheck + lint + build) and confirm all green

## 6. POST-APPLY FIX #2 — smooth overlay fade via opacity, gradient values left hand-editable, center card lowered on desktop (client feedback 2026-08-09)

- [x] 6.1 Update `design.md` § D5/D6 and `specs/team-section/spec.md`: overlay hover animates `opacity` (`transition-opacity`) instead of `background-image` stops (gradients are NOT reliably interpolated by all browsers → abrupt change); gradient stop VALUES stay in the component as hand-editable classes for the client (`bg-linear-to-b from-secondary/30 to-secondary/85`, do not change them); center card (index 1) gets a desktop-only downward offset (`lg:translate-y-8`)
- [x] 6.2 Update `apps/web/src/components/NosotrosTeamSection.astro`: overlay drops `transition-[background-image]` and the hover stop overrides, keeping `bg-linear-to-b from-secondary/30 to-secondary/85` as the single hand-editable gradient, and animates `opacity-100 → group-hover:opacity-40` with `transition-opacity duration-300 ease-out`; `members.map` becomes `map((member, index) => …)` and the card at `index === 1` gains `lg:translate-y-8`
- [x] 6.3 Update `apps/web/src/components/__tests__/NosotrosTeamSection.test.ts` and its helper to assert: overlay keeps the editable gradient classes and transitions `opacity` (no `transition-[background-image]`, no hover stop overrides), rest opacity `opacity-100` → hover `group-hover:opacity-40`, center card carries `lg:translate-y-8` while first/third do not
- [x] 6.4 Re-run the full `apps/web` suite (unit + typecheck + lint + build) and confirm all green

## 7. POST-APPLY FIX #3 — client hand-tuning of gradient stops and hover opacity (client feedback 2026-08-09)

The client hand-edited the overlay to `from-secondary/80 to-secondary/95 opacity-90 group-hover:opacity-80` and asked for the delivered recipe A: lighter top `/50`, darker bottom `/90`, rest opacity `100`, hover opacity `60` (perceptible fade while keeping bottom text legible).

- [x] 7.1 Update `design.md` § D5 and `specs/team-section/spec.md`: final overlay values are `bg-linear-to-b from-secondary/50 to-secondary/90 opacity-100 transition-opacity duration-300 ease-out group-hover:opacity-60` — top 50% (face visible), bottom 90% (text legible), hover fades the whole element to 60% (effective top ~30% / bottom ~54%)
- [x] 7.2 Update `apps/web/src/components/__tests__/NosotrosTeamSection.test.ts` expectations from the FIX #2 values to the final ones: rest `from-secondary/50`/`to-secondary/90`/`opacity-100` and hover `group-hover:opacity-60` (still no per-stop hover overrides, still `transition-opacity` without `background-image`)
- [x] 7.3 Update `apps/web/src/components/NosotrosTeamSection.astro` gradient overlay to the recipe A values (`bg-linear-to-b from-secondary/50 to-secondary/90 opacity-100 transition-opacity duration-300 ease-out group-hover:opacity-60`)
- [x] 7.4 Re-run the full `apps/web` suite (unit + typecheck + lint + build) and confirm all green

## 8. POST-APPLY FIX #4 — darker bottom third via positioned via stop (client feedback 2026-08-09)

Client: "Necesito que en el tercio bajo de la imagen sea más oscuro". A two-stop linear gradient cannot localize darkness in the bottom third, so the overlay gains a third stop positioned at 67% (`via-[67%]`): `bg-linear-to-b from-secondary/40 via-secondary/75 via-[67%] to-secondary/95` — face stays visible in the top two thirds, darkness ramps 75%→95% through the bottom third. Rest `opacity-100` / hover `group-hover:opacity-60` unchanged.

- [x] 8.1 Update `design.md` § D5 and `specs/team-section/spec.md`: overlay gradient becomes `bg-linear-to-b from-secondary/40 via-secondary/75 via-[67%] to-secondary/95` — positioned `via` stop concentrates darkness in the bottom third while the top stays light
- [x] 8.2 Update `apps/web/src/components/__tests__/NosotrosTeamSection.test.ts` expectations: rest `from-secondary/40`/`via-secondary/75`/`via-[67%]`/`to-secondary/95`, hover `group-hover:opacity-60` unchanged (still one static gradient, no per-stop hover overrides, `transition-opacity` only)
- [x] 8.3 Update `apps/web/src/components/NosotrosTeamSection.astro` overlay to the new gradient (`bg-linear-to-b from-secondary/40 via-secondary/75 via-[67%] to-secondary/95 opacity-100 transition-opacity duration-300 ease-out group-hover:opacity-60`)
- [x] 8.4 Re-run the full `apps/web` suite (unit + typecheck + lint + build) and confirm all green

## 9. POST-APPLY FIX #5 — verification-drift cleanup: empty-list test coverage, spec requirement sync, stale config comment (2026-08-09)

Found during the `openspec verify`-style review of the change: (a) the scenario "Empty member list renders no cards" had no test; (b) the `spec.md` requirement text for "Team member card shows photo, overlay, name and role" still declared the pre-FIX gradient `bg-linear-to-b from-secondary/30 to-secondary/85` while its own scenarios and the implementation use `from-secondary/40 via-secondary/75 via-[67%] to-secondary/95`; (c) the config docblock still referenced the removed `bg-secondary/80` overlay fading to `/30`. No behavior changes.

- [x] 9.1 Update `specs/team-section/spec.md` requirement text to the current gradient (`bg-linear-to-b from-secondary/40 via-secondary/75 via-[67%] to-secondary/95`) so the requirement matches its own scenarios
- [x] 9.2 Add a RED test "empty member list renders only the header with no cards" to `apps/web/src/components/__tests__/NosotrosTeamSection.test.ts` (render with `members: []` overrides) and confirm it fails before the fix (TDD)
- [x] 9.3 Confirm GREEN: the empty state already renders correctly with no production change (`.map` of an empty array emits no cards); update the stale docblock in `apps/web/src/lib/config/nosotros-team-section.ts` (`bg-secondary/80`/`/30` → current overlay description)
- [x] 9.4 Re-run the full `apps/web` suite (unit + typecheck + lint + build) and confirm all green