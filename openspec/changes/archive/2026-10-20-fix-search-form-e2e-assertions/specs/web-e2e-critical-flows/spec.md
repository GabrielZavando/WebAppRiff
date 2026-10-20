## ADDED Requirements

### Requirement: search-form.spec.ts valida el wrapper sólido actual

El spec E2E `apps/web/e2e/search-form.spec.ts` SHALL verificar que el wrapper `role="search"` de la búsqueda global usa el fondo sólido `bg-secondary`, conforme a la especificación `search-form` vigente. Las aserciones SHALL NOT esperar las clases del gradiente retirado `bg-linear-to-r` ni `from-secondary`.

#### Scenario: /productos usa el wrapper sólido sin gradiente

- **WHEN** el test visita `/productos`
- **THEN** la clase del wrapper `role="search"` contiene `bg-secondary`
- **AND** la clase NO contiene `bg-linear-to-r`
- **AND** la clase NO contiene `from-secondary`
- **AND** la clase NO contiene `bg-white`

#### Scenario: /productos/{slug} usa el wrapper sólido sin gradiente

- **WHEN** el test visita `/productos/mwn-medidor-industrial-agua-fria`
- **THEN** la clase del wrapper `role="search"` contiene `bg-secondary`
- **AND** la clase NO contiene `bg-linear-to-r`
- **AND** la clase NO contiene `from-secondary`
