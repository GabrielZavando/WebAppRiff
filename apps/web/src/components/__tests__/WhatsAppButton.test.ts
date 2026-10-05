import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import WhatsAppButton from '@/components/WhatsAppButton.astro';

/**
 * Site WhatsApp number (SC-004): the component receives it via the `phone`
 * prop and derives `https://wa.me/{digits}`; it MUST NOT be hardcoded in the
 * markup. `+56 9 3752 6162` → `https://wa.me/56937526162`.
 */
const WHATSAPP_PHONE = '+56 9 3752 6162';

/**
 * Renders the dumb WhatsAppButton component with a `phone` prop through the
 * AstroContainer, the same pattern used by the rest of the component tests
 * (e.g. SearchForm.test.ts, PanelHome.test.ts).
 */
async function render(phone: string = WHATSAPP_PHONE): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(WhatsAppButton, {
    props: { phone },
  });
  // Strip AstroContainer-emitted JSX comments so literal mentions of
  // "WhatsApp" inside documentation comments don't count as visible text.
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

/** Extracts the floating `<a ...>...</a>` (tag + full markup) for inspection. */
function getAnchor(html: string): { tag: string; html: string } {
  const match = html.match(/<a\s[^>]*>[\s\S]*?<\/a>/);
  if (!match) throw new Error('WhatsApp anchor not found in rendered HTML');
  return {
    tag: match[0].match(/<a\s[^>]*>/)?.[0] ?? '',
    html: match[0],
  };
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle === '') return 0;
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count += 1;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

describe('WhatsAppButton — floating link (SC-007)', () => {
  it('renders an <a> to the wa.me link derived from the phone prop, with target and rel', async () => {
    const { tag } = getAnchor(await render('+56 9 3752 6162'));
    expect(tag).toContain('href="https://wa.me/56937526162"');
    expect(tag).toContain('target="_blank"');
    expect(tag).toContain('rel="noopener noreferrer"');
  });

  it('derives the wa.me href from the phone prop digits (SC-004)', async () => {
    // A different prop value must produce a different href: proves the number
    // comes from the prop, not from a hardcoded literal (SC-004).
    const { tag } = getAnchor(await render('+56 9 1111 2222'));
    expect(tag).toContain('href="https://wa.me/56911112222"');
    expect(tag).not.toContain('href="https://wa.me/56937526162"');
  });

  it('is fixed at the bottom-right corner (fixed bottom-6 right-6 z-20)', async () => {
    const { tag } = getAnchor(await render());
    expect(tag).toContain('fixed');
    expect(tag).toContain('bottom-6');
    expect(tag).toContain('right-6');
    expect(tag).toContain('z-20');
  });

  it('uses the WhatsApp design tokens bg-whatsapp / hover:bg-whatsapp-dark with no raw hex', async () => {
    const { tag } = getAnchor(await render());
    expect(tag).toContain('bg-whatsapp');
    expect(tag).toContain('hover:bg-whatsapp-dark');
    // Token rule (frontend-standards): no literal hex in the markup.
    expect(tag).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it('carries the accessible name aria-label="Contactar por WhatsApp"', async () => {
    const { tag } = getAnchor(await render());
    expect(tag).toContain('aria-label="Contactar por WhatsApp"');
  });
});

describe('WhatsAppButton — icon-only (SC-007, SC-008)', () => {
  it('renders exactly one icon and no visible text label with the phone number', async () => {
    const html = await render();
    expect(countOccurrences(html, '<svg')).toBe(1);

    const anchor = getAnchor(html).html;
    // The only child is the icon: after removing the <svg> subtree and all
    // markup, the anchor must contain no text (icon-only button).
    const textContent = anchor
      .replace(/<svg[\s\S]*?<\/svg>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();
    expect(textContent).toBe('');
    // Explicit guard: no text node renders the phone number or a "WhatsApp"
    // label (the href/aria-label attributes are exempt — not visible text).
    expect(anchor).not.toMatch(/>\s*56937526162\s*</);
    expect(anchor).not.toMatch(/>\s*WhatsApp\s*</);
  });

  it('the icon is the simple-icons:whatsapp brand icon with aria-hidden="true"', async () => {
    const html = await render();
    const svg = html.match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? '';
    expect(svg).not.toBe('');
    expect(svg).toContain('data-icon="simple-icons:whatsapp"');
    expect(svg).toContain('aria-hidden="true"');
  });
});