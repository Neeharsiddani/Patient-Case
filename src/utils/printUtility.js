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

  // Create an invisible sandboxed print iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'medimitra-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            font-size: 13px;
            line-height: 1.4;
            padding: 10px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .printable-card {
            max-width: 650px;
            margin: 0 auto;
            border: 2px solid #cbd5e1;
            border-radius: 20px;
            padding: 24px;
            background: #ffffff;
          }
          .border-dashed { border-style: dashed !important; }
          .border-b-2 { border-bottom-width: 2px !important; }
          .border-t-2 { border-top-width: 2px !important; }
          .border-slate-300 { border-color: #cbd5e1 !important; }
          .border-slate-200 { border-color: #e2e8f0 !important; }
          .border-slate-900 { border-color: #0f172a !important; }
          .grid { display: grid !important; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
          .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
          .gap-2 { gap: 0.5rem !important; }
          .gap-3 { gap: 0.75rem !important; }
          .gap-4 { gap: 1rem !important; }
          .text-xs { font-size: 0.75rem !important; }
          .text-sm { font-size: 0.875rem !important; }
          .text-base { font-size: 1rem !important; }
          .text-lg { font-size: 1.125rem !important; }
          .text-xl { font-size: 1.25rem !important; }
          .text-2xl { font-size: 1.5rem !important; }
          .font-semibold { font-weight: 600 !important; }
          .font-bold { font-weight: 700 !important; }
          .font-extrabold { font-weight: 800 !important; }
          .font-black { font-weight: 900 !important; }
          .font-mono { font-family: monospace !important; }
          .uppercase { text-transform: uppercase !important; }
          .bg-slate-50 { background-color: #f8fafc !important; }
          .bg-slate-100 { background-color: #f1f5f9 !important; }
          .bg-slate-900 { background-color: #0f172a !important; color: #ffffff !important; }
          .bg-cyan-50 { background-color: #ecfeff !important; }
          .p-1 { padding: 0.25rem !important; }
          .p-1\\.5 { padding: 0.375rem !important; }
          .p-2 { padding: 0.5rem !important; }
          .p-2\\.5 { padding: 0.625rem !important; }
          .p-3 { padding: 0.75rem !important; }
          .p-4 { padding: 1rem !important; }
          .p-6 { padding: 1.5rem !important; }
          .p-8 { padding: 2rem !important; }
          .pb-3 { padding-bottom: 0.75rem !important; }
          .pb-4 { padding-bottom: 1rem !important; }
          .pt-2 { padding-top: 0.5rem !important; }
          .pt-4 { padding-top: 1rem !important; }
          .pt-6 { padding-top: 1.5rem !important; }
          .rounded-lg { border-radius: 0.5rem !important; }
          .rounded-xl { border-radius: 0.75rem !important; }
          .rounded-2xl { border-radius: 1rem !important; }
          .rounded-3xl { border-radius: 1.5rem !important; }
          .border { border-width: 1px !important; }
          .border-2 { border-width: 2px !important; }
          .text-slate-400 { color: #94a3b8 !important; }
          .text-slate-500 { color: #64748b !important; }
          .text-slate-600 { color: #475569 !important; }
          .text-slate-700 { color: #334155 !important; }
          .text-slate-800 { color: #1e293b !important; }
          .text-slate-900 { color: #0f172a !important; }
          .text-cyan-800 { color: #155e75 !important; }
          .text-cyan-900 { color: #164e63 !important; }
          .text-emerald-700 { color: #047857 !important; }
          .flex { display: flex !important; }
          .items-center { align-items: center !important; }
          .items-start { align-items: flex-start !important; }
          .items-end { align-items: flex-end !important; }
          .justify-between { justify-content: space-between !important; }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .space-y-1 > * + * { margin-top: 0.25rem !important; }
          .space-y-2 > * + * { margin-top: 0.5rem !important; }
          .space-y-4 > * + * { margin-top: 1rem !important; }
          .space-y-6 > * + * { margin-top: 1.5rem !important; }
          .w-14 { width: 3.5rem !important; }
          .h-14 { height: 3.5rem !important; }
          .w-16 { width: 4rem !important; }
          .h-16 { height: 4rem !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { padding: 6px 8px !important; border-bottom: 1px solid #e2e8f0 !important; }
          .no-print { display: none !important; }
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
      }, 3000);
    }
  }, 300);
};
