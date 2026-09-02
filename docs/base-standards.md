---
description: Reglas globales de desarrollo para agentes IA (OpenCode). Aplica siempre.
alwaysApply: true
---

# Base Standards — Agencia Zavando

## 1. Principios core

- **Pasos pequeños, uno a la vez**: Nunca avanzar más de un paso sin confirmar. Baby steps siempre.
- **TDD (Test-Driven Development)**: Escribir test fallido primero para cualquier funcionalidad nueva.
- **Tipado completo**: Todo el código debe estar completamente tipado (TypeScript, PHPDoc, etc.).
- **Nombres descriptivos**: Variables y funciones con nombres claros y específicos al dominio.
- **Cambios incrementales**: Preferir modificaciones pequeñas y revisables sobre cambios grandes.
- **Cuestionar supuestos**: Siempre preguntar ante ambigüedades antes de asumir.
- **Detectar patrones repetidos**: Identificar y señalar código duplicado o patrones que deben abstraerse.

## 2. Idioma del código

- **Todo en inglés**: Variables, funciones, clases, comentarios, mensajes de error, logs.
- **Documentación en español**: READMEs para el cliente, comentarios de negocio, tickets pueden ir en español.
- **Commits en inglés**: Siempre. Conventional commits format.
- **Nombres de base de datos en inglés**: Tablas, columnas, índices.

## 3. Estándares específicos por área

Para estándares detallados, leer los archivos correspondientes:

- [Backend Standards](backend-standards.md) — API, base de datos, testing, seguridad
- [Frontend Standards](frontend-standards.md) — Componentes, UI/UX, estado
- [Documentation Standards](documentation-standards.md) — Estructura docs, OpenAPI, mantenimiento

## 7. Actualización de artefactos OpenSpec ante cambios post-apply

Si aparece un fix o cambio nuevo después de `/apply` y antes de `/archive`:

1. Actualizar primero los artefactos OpenSpec afectados (scenarios, requirements, tasks.md)
2. Si se necesita regenerar artefactos, ejecutar el paso OpenSpec correspondiente antes de codear
3. Solo implementar código después de que los artefactos reflejen el nuevo requerimiento
4. Re-ejecutar verificación contra artefactos actualizados antes de archivar

**No aplicar fixes directos en código sin actualizar OpenSpec primero.**

## 8. Contexto del proyecto (personalizar por proyecto)

> ⚠️ Esta sección no se completa aquí: `base-standards.md` es intocable (plantilla de
> principios). El contexto específico del proyecto vive en `docs/project/` (plantillas del
> framework): `docs/project/stack.md`, `docs/project/domain.md` y `docs/project/client.md`.
> Ver `docs/docs-standard.md` para la frontera intocable/del proyecto en `docs/`.

El proyecto debe definir, en esos archivos:

- **Stack**: lenguajes, frameworks, bases de datos e infraestructura.
- **Arquitectura**: estilo elegido por el proyecto (Clean Architecture, MVC, hexagonal, etc.).
- **Dominio**: descripción del negocio y entidades centrales.
- **Cliente / audiencia**: para quién se construye.

Convenciones transversales (aplican a todo proyecto):

- Convenciones de commits: Conventional Commits
- Lenguaje del código: English
- Lenguaje de documentación cliente: Español

Esto mantiene `base-standards.md` como plantilla pura de principios (SDD/TDD/SOLID) sin
placeholders sin reemplazar.

## 9. Principios de Diseño No Negociables

Todo el código generado para este proyecto debe respetar **SOLID** y priorizar
**encapsulamiento y composición sobre herencia** como regla general rectora. La
herencia solo se admite con justificación explícita en el código; por defecto se
compone comportamiento inyectando abstracciones.

Esta sección es solo el **principio rector a nivel de proyecto**. Las reglas
**concretas y verificables** —umbrales numéricos, estructura de carpetas,
patrones de inyección, ejemplos de violación por stack— viven en:

- [Backend Standards](backend-standards.md) — sección _Principios de Diseño — Backend (NestJS)_
- [Frontend Standards](frontend-standards.md) — secciones _Principios de Diseño — Frontend (Angular)_ y _Principios de Diseño — Astro_

No duplicar aquí contenido técnico: leer y aplicar el doc del stack
correspondiente.
