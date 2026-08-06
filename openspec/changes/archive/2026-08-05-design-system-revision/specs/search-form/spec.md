# search-form Specification — delta for design-system-revision

## MODIFIED Requirements

### Requirement: SearchForm renders the submit button
The search-form SHALL render a `<button type="submit">` labelled with the configured submit text using the `--color-accent` (`#F26A21`) token via the Tailwind utility `bg-accent` (with a hover state derived from `--color-accent-dark` `#D14E12` or an alpha overlay of the accent color). The obsolete utility `bg-brand-orange` and references to `--color-brand-orange` SHALL NOT appear.

#### Scenario: Submit button uses accent token
- **WHEN** the search-form renders
- **THEN** the `<button type="submit">` carries the `bg-accent` class (resolving to `#F26A21`)
- **AND** its `class` attribute does NOT contain `bg-brand-orange`
- **AND** the label text is the configured `submitLabel`

### Requirement: SearchForm renders a category select with a default option
The search-form SHALL render a `<select>` populated from the `categories` prop, where the first option is `{ id: "", label: "Todas las categorías" }` and is pre-selected when `initialCategoriaId` is empty. The select border SHALL use the `--color-border` (`#E3E8ED`) token; the selected/focused state SHALL use a primary-color ring via `focus:border-primary` (resolving to `#41B3C4`). Hex literals SHALL NOT appear in `class` attributes.

#### Scenario: Border uses color-border token
- **WHEN** the search-form renders its `<select>` in default state
- **THEN** the select element's border color resolves from the `--color-border` token
- **AND** no literal `#E3E8ED` appears in `class` attributes of the rendered HTML

#### Scenario: Focus state uses primary token
- **WHEN** the select receives focus
- **THEN** its border color resolves from `--color-primary` (`#41B3C4`)
- **AND** the class string does NOT contain literal `#41B3C4`
