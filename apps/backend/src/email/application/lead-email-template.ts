const BRAND_TEAL = '#41B3C4';
const BRAND_NAVY = '#1F2D40';
const PAGE_BACKGROUND = '#F6F8FA';
const BORDER = '#E3E8ED';
const TEXT_MUTED = '#5C6675';

export interface LeadEmailTemplateField {
  readonly label: string;
  readonly value: string;
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}

function renderRow(field: LeadEmailTemplateField): string {
  return `<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${BORDER};color:${TEXT_MUTED};font-size:13px;line-height:20px;width:150px;vertical-align:top;">${escapeHtml(field.label)}</td>
  <td style="padding:10px 0 10px 16px;border-bottom:1px solid ${BORDER};color:${BRAND_NAVY};font-size:14px;line-height:20px;vertical-align:top;">${escapeHtml(field.value)}</td>
</tr>`;
}

/**
 * Renders the branded HTML body shared by every lead notification (contact and
 * quote). Uses table-based layout and inline styles for email-client
 * compatibility, and escapes all dynamic values before interpolating them.
 */
export function renderLeadEmailHtml(
  subject: string,
  fields: readonly LeadEmailTemplateField[],
): string {
  const rows = fields.map(renderRow).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BACKGROUND};font-family:Arial,Helvetica,sans-serif;color:${BRAND_NAVY};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BACKGROUND};padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid ${BORDER};border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:${BRAND_NAVY};padding:24px 28px;border-bottom:4px solid ${BRAND_TEAL};">
            <div style="color:#FFFFFF;font-size:20px;font-weight:bold;line-height:24px;">Riff</div>
            <div style="color:${BRAND_TEAL};font-size:13px;line-height:18px;margin-top:4px;">Notificación del sitio</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <h1 style="margin:0 0 20px;color:${BRAND_NAVY};font-size:18px;line-height:24px;">${escapeHtml(subject)}</h1>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${rows}
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${PAGE_BACKGROUND};padding:16px 28px;color:${TEXT_MUTED};font-size:12px;line-height:18px;border-top:1px solid ${BORDER};">
            Notificación automática generada por somosriff.cl
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
