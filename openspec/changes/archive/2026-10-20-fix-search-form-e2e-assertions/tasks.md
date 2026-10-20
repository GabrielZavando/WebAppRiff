## 1. Actualizar aserciones E2E

- [x] 1.1 En `apps/web/e2e/search-form.spec.ts`, reemplazar en el test de `/productos` las expectativas `bg-linear-to-r` y `from-secondary` por `bg-secondary`, manteniendo la aserción negativa de `bg-white`.
- [x] 1.2 En el test de `/productos/{slug}`, reemplazar las mismas expectativas de gradiente por `bg-secondary`.
- [x] 1.3 Revisar el resto de `search-form.spec.ts` para confirmar que no quedan aserciones de las clases retiradas.

## 2. Verificación

- [x] 2.1 Ejecutar los tests E2E de `search-form.spec.ts` y confirmar que los dos tests afectados pasan.
- [x] 2.2 Ejecutar `make ci` completo y confirmar que lint, typecheck, tests y audit terminan en verde.
- [x] 2.3 Confirmar que no se modificó código de aplicación (`apps/web/src`) en este change.

## 3. Git

- [x] 3.1 Revisar `git status` y `git diff` para incluir solo el spec E2E y los artefactos OpenSpec.
- [x] 3.2 Crear el commit con mensaje `test(web): actualiza aserciones de búsqueda al fondo sólido`.
- [x] 3.3 Hacer `git push` a `main`.
