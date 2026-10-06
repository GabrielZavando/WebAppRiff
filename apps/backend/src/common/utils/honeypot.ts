/**
 * Anti-spam honeypot check shared by the public lead-capture endpoints
 * (`POST /api/v1/contacts` and `POST /api/v1/quotes`). A hidden `website` field
 * that a human never fills is considered "filled" when it carries any
 * non-whitespace content, which indicates an automated bot.
 */
export function isHoneypotFilled(website: unknown): boolean {
  return typeof website === 'string' && website.trim() !== '';
}