import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import TopHeader from '@/components/TopHeader.astro';
import type { ContactInfo } from '@/lib/types/top-header';

const fullContact: ContactInfo = {
  phone: '+56 2 29079067',
  social: {
    facebook: 'https://facebook.com/riff',
    x: 'https://x.com/riff',
    instagram: 'https://instagram.com/riff',
    linkedin: 'https://linkedin.com/company/riff',
  },
};

async function render(contact: ContactInfo): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(TopHeader, { props: { contact } });
}

async function renderTransparent(contact: ContactInfo): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(TopHeader, { props: { contact, transparent: true } });
}

describe('TopHeader', () => {
  it('renders the primary phone as a clickable tel: link with icon', async () => {
    const html = await render(fullContact);

    expect(html).toContain('+56 2 29079067');
    expect(html).toContain('href="tel:+56229079067"');
    expect(html).toContain('aria-label="Llamar a Riff"');
    // Phone icon (svg) inside the tel: link
    expect(html).toMatch(/href="tel:\+56229079067"[\s\S]*?<svg/);
  });

  it('renders four social links separated by vertical dividers when all URLs are configured', async () => {
    const html = await render(fullContact);

    const socialLabels = html.match(/aria-label="(Facebook|X|Instagram|LinkedIn)"/g);
    expect(socialLabels).toHaveLength(4);
    // 4 links => 3 vertical dividers between them
    expect(html.match(/class="h-4 border-l border-white\/20"/g)).toHaveLength(3);
  });

  it('renders only social links that have a configured URL', async () => {
    const html = await render({
      phone: '+56 2 29079067',
      social: {
        facebook: 'https://facebook.com/riff',
        x: '',
        instagram: 'https://instagram.com/riff',
        linkedin: '',
      },
    });

    expect(html).toContain('href="https://facebook.com/riff"');
    expect(html).toContain('href="https://instagram.com/riff"');
    expect(html).not.toContain('https://x.com/riff');
    expect(html).not.toContain('https://linkedin.com/company/riff');
    expect(html).not.toContain('aria-label="X"');
    expect(html).not.toContain('aria-label="LinkedIn"');
  });

  it('omits the social nav when no social URLs are configured', async () => {
    const html = await render({
      phone: '+56 2 29079067',
      social: { facebook: '', x: '', instagram: '', linkedin: '' },
    });

    expect(html).not.toContain('aria-label="Redes sociales"');
    expect(html).not.toContain('target="_blank"');
  });

  it('is hidden on mobile via hidden sm:flex classes', async () => {
    const html = await render(fullContact);

    expect(html).toContain('hidden');
    expect(html).toContain('sm:flex');
  });

  it('applies brand navy background, compact h-8 height and full layout styling', async () => {
    const html = await render(fullContact);

    // Root region div (outermost) uses h-8 for a compact footprint.
    const regionMatch = html.match(/<div role="region"[^>]*class="([^"]*)"/);
    expect(regionMatch).not.toBeNull();
    const rootClasses = regionMatch![1];
    expect(rootClasses).toContain('h-8');
    expect(rootClasses).not.toContain('h-9');

    // Background
    expect(html).toContain('bg-secondary');
    expect(html).toContain('bg-linear-to-r from-secondary to-secondary-light');
    // Centered container
    expect(html).toContain('container mx-auto px-4');
    // Space between phone (left) and social (right)
    expect(html).toContain('justify-between');
    // Social links hover effect
    expect(html).toContain('hover:bg-white/10');
    // Vertical dividers use border-white/20
    expect(html).toContain('border-white/20');
  });

  it('adds accessible attributes to social links', async () => {
    const html = await render(fullContact);

    expect(html).toContain('aria-label="Facebook"');
    expect(html).toContain('aria-label="X"');
    expect(html).toContain('aria-label="Instagram"');
    expect(html).toContain('aria-label="LinkedIn"');
    expect(html).toContain('aria-label="Redes sociales"');
    expect(html).toMatch(/target="_blank"[^>]*rel="noopener noreferrer"/);
  });

  describe('transparent mode (home hero full-bleed background)', () => {
    it('removes the brand navy gradient background in transparent mode', async () => {
      const html = await renderTransparent(fullContact);

      expect(html).not.toContain('bg-secondary');
      expect(html).not.toContain('bg-linear-to-r from-secondary to-secondary-light');
      expect(html).toContain('bg-transparent');
    });

    it('keeps the row height, centering and content layout in transparent mode', async () => {
      const html = await renderTransparent(fullContact);

      expect(html).toContain('h-9');
      expect(html).toContain('container mx-auto px-4');
      expect(html).toContain('justify-between');
    });

    it('still renders the phone and social links in transparent mode', async () => {
      // Spec: top-header § "the phone link and social links are still
      // rendered" — transparency only changes the background classes.
      const html = await renderTransparent(fullContact);

      expect(html).toContain('href="tel:+56229079067"');
      expect(html).toContain('aria-label="Facebook"');
      expect(html).toContain('aria-label="X"');
      expect(html).toContain('aria-label="Instagram"');
      expect(html).toContain('aria-label="LinkedIn"');
      expect(html).toContain('aria-label="Redes sociales"');
    });

    it('defaults to the solid navy background when transparent is not set', async () => {
      const html = await render(fullContact);

      expect(html).toContain('bg-secondary');
      expect(html).toContain('bg-linear-to-r from-secondary to-secondary-light');
    });
  });

  it('matches the snapshot for full contact', async () => {
    const html = await render(fullContact);

    expect(html).toMatchSnapshot();
  });

  // --- Change topheader-click-to-call-x-icon ---

  it('renders the X social link with the official X brand logo (simple-icons:x), not lucide:twitter', async () => {
    const html = await render(fullContact);

    // The X anchor holds an <svg> whose data-icon is the brand logo name.
    const xAnchor = html.match(/aria-label="X"[^]*?<\/a>/);
    expect(xAnchor).not.toBeNull();
    expect(xAnchor![0]).toContain('data-icon="simple-icons:x"');
    expect(xAnchor![0]).not.toContain('data-icon="lucide:twitter"');
    expect(html).not.toContain('data-icon="lucide:twitter"');
  });

  it('normalizes a phone number with spaces/separators to an E.164 tel: link (click-to-call regression)', async () => {
    const html = await render({
      phone: '+56 2 2907 9067',
      social: { facebook: '', x: '', instagram: '', linkedin: '' },
    });

    // tel: href is E.164 (digits + single leading +), no spaces
    expect(html).toContain('href="tel:+56229079067"');
    // displayed text preserves the user-facing formatted number
    expect(html).toContain('+56 2 2907 9067');
  });

  // --- Compact TopHeader vertical footprint (topheader-click-to-call-x-icon) ---

  it('uses compact h-8 height (not h-9) to minimize vertical footprint', async () => {
    const html = await render(fullContact);

    // Root container (outermost region div) uses h-8 (32px) for a smaller
    // footprint. The inner social icon cells still use h-9 — that is expected
    // and out of scope for this change; we assert on the ROOT element only.
    const regionMatch = html.match(/<div role="region"[^>]*class="([^"]*)"/);
    expect(regionMatch).not.toBeNull();
    const rootClasses = regionMatch![1];
    expect(rootClasses).toContain('h-8');
    expect(rootClasses).not.toContain('h-9');
  });

  it('has no root-level vertical margin/padding creating a gap before the Header', async () => {
    const html = await render(fullContact);

    // The root region div must NOT carry mt/mb/py/space-y that would separate
    // it from the Header that follows in Layout.astro.
    // Match only class attributes on the outer-most region div.
    const regionMatch = html.match(/<div role="region"[^>]*class="([^"]*)"/);
    expect(regionMatch).not.toBeNull();
    const rootClasses = regionMatch![1];
    expect(rootClasses).not.toMatch(/\b(mt-[0-9]|mb-[0-9]|py-[0-9]|space-y-[0-9])\b/);
  });
});
