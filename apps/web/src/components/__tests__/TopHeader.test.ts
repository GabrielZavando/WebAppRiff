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

  it('applies brand navy background, h-9 height and full layout styling', async () => {
    const html = await render(fullContact);

    // Background and height
    expect(html).toContain('bg-brand-navy');
    expect(html).toContain('h-9');
    expect(html).toContain('bg-linear-to-r from-brand-navy to-brand-navy-light');
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

  it('matches the snapshot for full contact', async () => {
    const html = await render(fullContact);

    expect(html).toMatchSnapshot();
  });
});
