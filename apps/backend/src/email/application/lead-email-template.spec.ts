import { renderLeadEmailHtml } from './lead-email-template';

const FIELDS = [
  { label: 'Nombre', value: 'Juan Pérez' },
  { label: 'Mensaje', value: 'Necesito soporte técnico' },
] as const;

describe('renderLeadEmailHtml', () => {
  it('renders the subject and a label/value row for every field', () => {
    const html = renderLeadEmailHtml('Nuevo contacto', FIELDS);

    expect(html).toContain('Nuevo contacto');
    expect(html).toContain('Nombre');
    expect(html).toContain('Juan Pérez');
    expect(html).toContain('Mensaje');
    expect(html).toContain('Necesito soporte técnico');
  });

  it('uses the Riff brand colors', () => {
    const html = renderLeadEmailHtml('Nuevo contacto', FIELDS);

    expect(html).toContain('#41B3C4');
    expect(html).toContain('#1F2D40');
  });

  it('escapes HTML in the subject and field values', () => {
    const html = renderLeadEmailHtml('<b>Asunto</b>', [
      { label: 'Nombre', value: '<script>alert("x")</script> & \'q\'' },
    ]);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;');
    expect(html).toContain('&#39;');
    expect(html).toContain('&lt;b&gt;Asunto&lt;/b&gt;');
  });
});
