## MODIFIED Requirements

### Requirement: ContactBar renders phone, email and social icons
The contact-bar SHALL render a clickable phone (`tel:`), a clickable email (`mailto:`) and social network icons, consuming the same contact source as TopHeader/Footer. The email displayed and linked SHALL be `contacto@somosriff.cl` (MODIFIED in `web-home-contact-tweaks`: was `contacto@riff.cl`).

#### Scenario: Phone and email clickable
- **WHEN** the ContactBar renders with `phone="+56 2 29079067"` and `email="contacto@somosriff.cl"`
- **THEN** an anchor with `href="tel:+56229079067"` is rendered
- **AND** an anchor with `href="mailto:contacto@somosriff.cl"` is rendered
- **AND** the email anchor's visible text equals `contacto@somosriff.cl`

#### Scenario: Social icons rendered when configured
- **WHEN** the ContactBar renders with social links present
- **THEN** a `<nav aria-label="Redes sociales">` (or equivalent) renders one anchor per configured social link
- **AND** each anchor carries `aria-label` and `rel="noopener noreferrer"` and `target="_blank"`