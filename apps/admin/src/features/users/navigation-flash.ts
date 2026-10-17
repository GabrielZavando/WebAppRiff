/**
 * Error flash via Router navigation state (companion of the catalog
 * `flash-state` success flow, design D5/D11). The form navigates with
 * `{ state: { flashError } }` when the user was created but the invitation
 * email could not be sent; the list consumes it once and clears it, so a
 * browser reload never re-shows the banner.
 */
export function consumeNavigationFlashError(): string | null {
  const state = history.state as { flashError?: unknown } | null;
  const message = state?.flashError;
  if (typeof message !== 'string' || message === '') {
    return null;
  }
  if (state !== null && state.flashError !== undefined) {
    const rest: Record<string, unknown> = { ...state };
    delete rest['flashError'];
    history.replaceState(rest, '');
  }
  return message;
}

/** Shown on the list when the user was created but the invitation failed. */
export const INVITATION_FAILED_FLASH =
  'El usuario fue creado pero la invitación no pudo enviarse. Usa «Reenviar invitación» en el listado.';
