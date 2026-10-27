import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import PhoneFab from '@/components/PhoneFab.astro';

const PHONE = '+56 2 29079067';

async function render(phone?: string): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(PhoneFab, {
    props: { phone: arguments.length === 0 ? PHONE : phone },
  });
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function getAnchor(html: string): { tag: string; html: string } {
  const match = html.match(/<a\s[^>]*>[\s\S]*?<\/a>/);
  if (!match) throw new Error('Phone FAB anchor not found in rendered HTML');
  return {
    tag: match[0].match(/<a\s[^>]*>/)?.[0] ?? '',
    html: match[0],
  };
}

function readComponentSource(): string {
  return readFileSync(new URL('../PhoneFab.astro', import.meta.url), 'utf-8');
}

describe('PhoneFab — floating phone link (SC-201, SC-202)', () => {
  it('derives the tel href from the phone prop and normalizes separators', async () => {
    const { tag } = getAnchor(await render());
    expect(tag).toContain('href="tel:+56229079067"');
    expect(tag).not.toContain('target="_blank"');
  });

  it('does not hardcode the configured phone number', async () => {
    const { tag } = getAnchor(await render('+56 2 1111 2222'));
    expect(tag).toContain('href="tel:+56211112222"');
    expect(tag).not.toContain('href="tel:+56229079067"');
    expect(readComponentSource()).not.toContain(PHONE);
  });

  it('is fixed above the WhatsApp FAB at bottom-24 right-6 z-20', async () => {
    const { tag } = getAnchor(await render());
    expect(tag).toContain('fixed');
    expect(tag).toContain('bottom-24');
    expect(tag).toContain('right-6');
    expect(tag).toContain('z-20');
  });

  it('uses the 56x56 accent FAB with a white 28px icon', async () => {
    const { tag, html } = getAnchor(await render());
    expect(tag).toContain('h-14');
    expect(tag).toContain('w-14');
    expect(tag).toContain('bg-accent');
    expect(tag).toContain('text-white');
    expect(tag).toContain('hover:bg-accent-dark');
    expect(tag).not.toMatch(/#[0-9A-Fa-f]{3,8}/);

    const svg = html.match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? '';
    expect(svg).toContain('data-icon="lucide:phone"');
    expect(svg).toContain('h-7');
    expect(svg).toContain('w-7');
    expect(svg).toContain('text-white');
    expect(svg).toContain('aria-hidden="true"');
  });

  it('is icon-only and exposes aria-label="Llamar a Riff"', async () => {
    const { tag, html } = getAnchor(await render());
    expect(tag).toContain('aria-label="Llamar a Riff"');
    const textContent = html
      .replace(/<svg[\s\S]*?<\/svg>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();
    expect(textContent).toBe('');
  });

  it('renders nothing when the phone is empty or undefined', async () => {
    expect(await render('')).not.toContain('<a');
    expect(await render(undefined)).not.toContain('<a');
  });
});

describe('PhoneFab — pulse animation (SC-205 to SC-207)', () => {
  it('declares an infinite GPU-friendly pulse in pure CSS', () => {
    const source = readComponentSource();
    expect(source).toMatch(/@keyframes\s+phone-fab-pulse/);
    expect(source).toMatch(/animation:[^;]*phone-fab-pulse[^;]*infinite/);
    expect(source).not.toMatch(/<script/);

    const keyframes =
      source.match(/@keyframes\s+phone-fab-pulse\s*\{([\s\S]*?)\}\s*\}/)?.[1] ?? '';
    expect(keyframes).toMatch(/transform:\s*scale/);
    expect(keyframes).toMatch(/opacity\s*:/);
    expect(keyframes).not.toMatch(/(width|height|top|left|right|bottom|margin|padding)\s*:/);
  });

  it('disables the pulse under prefers-reduced-motion: reduce', () => {
    const source = readComponentSource();
    expect(source).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(source).toMatch(/animation:\s*none/);
  });
});
