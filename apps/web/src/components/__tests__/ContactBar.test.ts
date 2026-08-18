import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ContactBar from '@/components/ContactBar.astro';
import { CONTACT_PAGE_CONTENT } from '@/lib/config/contact-page';
import type { ContactBarProps } from '@/lib/types/contact-form';
import type { SocialLink as TopHeaderSocialLink } from '@/lib/types/top-header';

const baseProps: ContactBarProps = CONTACT_PAGE_CONTENT.bar;

async function render(
  props: ContactBarProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ContactBar, { props: { ...props } });
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

const SAMPLE_SOCIAL: TopHeaderSocialLink[] = [
  { name: 'Facebook', href: 'https://facebook.com/riff' },
  { name: 'X', href: 'https://x.com/riff' },
];

describe('ContactBar — phone and email', () => {
  it('renders a clickable tel anchor', async () => {
    const html = await render();
    expect(html).toContain('href="tel:+56229079067"');
    expect(html).toContain('+56 2 29079067');
  });

  it('renders a clickable mailto anchor', async () => {
    const html = await render();
    expect(html).toContain('href="mailto:contacto@riff.cl"');
    expect(html).toContain('contacto@riff.cl');
  });
});

describe('ContactBar — social links', () => {
  it('renders a social nav with one anchor per configured link', async () => {
    const html = await render({ ...baseProps, socialLinks: SAMPLE_SOCIAL });
    expect(html).toContain('aria-label="Redes sociales"');
    const nav = html.match(/<nav[^>]*aria-label="Redes sociales"[\s\S]*?<\/nav>/);
    expect(nav, 'social nav').toBeTruthy();
    expect(nav![0]).toContain('href="https://facebook.com/riff"');
    expect(nav![0]).toContain('href="https://x.com/riff"');
  });

  it('each social anchor carries aria-label, target and rel', async () => {
    const html = await render({ ...baseProps, socialLinks: SAMPLE_SOCIAL });
    const nav = html.match(/<nav[^>]*aria-label="Redes sociales"[\s\S]*?<\/nav>/)![0];
    for (const link of SAMPLE_SOCIAL) {
      const anchor = nav.match(
        new RegExp(`<a[^>]*href="${link.href}"[^>]*>[\\s\\S]*?</a>`),
      );
      expect(anchor, `anchor for ${link.name}`).toBeTruthy();
      expect(anchor![0]).toContain(`aria-label="${link.name}"`);
      expect(anchor![0]).toContain('target="_blank"');
      expect(anchor![0]).toContain('rel="noopener noreferrer"');
    }
  });

  it('omits the social nav when no links are configured', async () => {
    const html = await render({ ...baseProps, socialLinks: [] });
    expect(html).not.toContain('aria-label="Redes sociales"');
  });
});

describe('ContactBar — flat design', () => {
  it('does not use rounded or shadow classes', async () => {
    const clean = stripComments(await render());
    expect(clean).not.toMatch(/rounded/);
    expect(clean).not.toMatch(/shadow/);
  });
});

describe('ContactBar — background and width (below-form correction)', () => {
  it('uses the page background (bg-primary-deep) and aligns to the full page content width, not a dark footer strip', async () => {
    const clean = stripComments(await render());
    const section = clean.match(/<section[^>]*>[\s\S]*?<\/section>/)![0];
    // Same background as the page, NOT a distinct dark footer
    expect(section).toContain('bg-primary-deep');
    expect(clean).not.toContain('bg-secondary-dark');
    // Aligns to the full page content width (same container as the header/form), not a narrower max-w-3xl strip
    expect(section).toContain('container mx-auto');
    expect(section).not.toContain('max-w-3xl');
  });

  it('aligns phone/email to the left and social icons to the right', async () => {
    const clean = stripComments(await render({ ...baseProps, socialLinks: SAMPLE_SOCIAL }));
    const section = clean.match(/<section[^>]*>[\s\S]*?<\/section>/)![0];
    // Row layout with space-between: left group (phone+email) and right nav (socials)
    expect(section).toContain('sm:justify-between');
    // The bar row container must NOT center its items; note the social icon
    // buttons legitimately use `justify-center` on themselves, so we scope the
    // negative check to the responsive `sm:justify-center` variant.
    expect(section).not.toMatch(/sm:justify-center/);
    // Phone and email share a single left-group ancestor before the social nav
    const leftGroup = section.match(/<div class="flex items-center gap-2 sm:gap-8">[\s\S]*?<\/div>/);
    expect(leftGroup, 'phone/email left group').toBeTruthy();
    expect(leftGroup![0]).toContain('tel:+56229079067');
    expect(leftGroup![0]).toContain('contacto@riff.cl');
    // The social nav is a sibling AFTER the left group (right side)
    const leftEnd = section.indexOf(leftGroup![0]) + leftGroup![0].length;
    const navIndex = section.indexOf('aria-label="Redes sociales"');
    expect(navIndex).toBeGreaterThan(leftEnd);
  });
});

describe('ContactBar — primary divider above the contact data', () => {
  it('renders a 1px primary divider spanning the form width, before the contacts, with equivalent padding', async () => {
    const clean = stripComments(await render({ ...baseProps, socialLinks: SAMPLE_SOCIAL }));
    const section = clean.match(/<section[^>]*>[\s\S]*?<\/section>/)![0];
    // Divider is the first child of the content container: border-t + border-primary
    const divider = section.match(/<div class="border-t border-primary[^"]*">/);
    expect(divider, 'primary divider').toBeTruthy();
    // Equivalent vertical padding (16px mobile / 32px desktop) above and below
    expect(divider![0]).toMatch(/my-\d/);
    expect(divider![0]).toContain('my-4');
    // The divider must appear in DOM order BEFORE the phone/email/social anchors
    const dividerIndex = section.indexOf(divider![0]);
    const contactsIndex = section.indexOf('tel:+56229079067');
    expect(dividerIndex).toBeLessThan(contactsIndex);
  });
});

describe('ContactBar — snapshot', () => {
  it('matches the snapshot', async () => {
    const html = await render();
    expect(html).toMatchSnapshot();
  });
});
