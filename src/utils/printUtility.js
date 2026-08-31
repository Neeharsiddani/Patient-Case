/**
 * Universal Healthcare Document Printer Utility
 * Prints an HTML element directly using an isolated, self-styled iframe
 * Works seamlessly across Desktop, Mobile, Chrome, Safari, Firefox, Edge, and Sandboxes
 */
export const printElement = (elementOrHtml, title = 'MediMitra OPD Consultation Slip') => {
  if (!elementOrHtml) return;

  const contentHtml = typeof elementOrHtml === 'string' ? elementOrHtml : elementOrHtml.innerHTML;

  // Remove any pre-existing print iframe
  const existingIframe = document.getElementById('medimitra-print-frame');
  if (existingIframe) {
    try {
      document.body.removeChild(existingIframe);
    } catch {}
  }

  // Create an off-screen print iframe with real dimensions (critical for browser print renderer)
  const iframe = document.createElement('iframe');
  iframe.id = 'medimitra-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '850px';
  iframe.style.height = '1100px';
  iframe.style.border = '0';
  iframe.style.opacity = '0.01';
  iframe.style.pointerEvents = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Copy all document styles and fonts from main window
  let styleTags = '';
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
    styleTags += el.outerHTML;
  });

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        ${styleTags}
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 13px !important;
            line-height: 1.4 !important;
            padding: 10px !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .printable-card {
            max-width: 650px !important;
            margin: 0 auto !important;
            border: 2px solid #cbd5e1 !important;
            border-radius: 20px !important;
            padding: 24px !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="printable-card">
          ${contentHtml}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Allow iframe to render layout before printing
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.print():', e);
      window.print();
    } finally {
      setTimeout(() => {
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        } catch {}
      }, 4000);
    }
  }, 350);
};
