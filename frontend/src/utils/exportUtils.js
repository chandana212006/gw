export function exportToCSV(data, filename) {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + (val ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(title, headers, rows, stats = null, filtersUsed = null) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return alert('Please allow popups to export PDFs.');

  const now = new Date().toLocaleString();

  let statsHtml = '';
  if (stats) {
    statsHtml = `
      <div class="stats-section">
        <h3 style="font-size: 15px; margin: 0 0 8px 0; color: #1e3a8a;">Summary Statistics</h3>
        <div class="stats-grid">
          ${Object.entries(stats).map(([k, v]) => `
            <div class="stat-card">
              <div class="stat-lbl">${k}</div>
              <div class="stat-val">${v}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  let filtersHtml = '';
  if (filtersUsed) {
    filtersHtml = `
      <div class="filters-section">
        <strong>Filters Applied:</strong> ${Object.entries(filtersUsed)
          .map(([k, v]) => `<span><strong>${k}:</strong> ${v || 'All'}</span>`)
          .join(' | ')}
      </div>
    `;
  }

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Outfit', sans-serif; padding: 30px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
          .title-area h1 { margin: 0; color: #1e3a8a; font-size: 24px; font-weight: 700; }
          .title-area p { margin: 4px 0 0; font-size: 13px; color: #666; }
          .filters-section { background: #f3f4f6; padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-bottom: 20px; }
          .stats-section { margin-bottom: 20px; }
          .stats-grid { display: flex; gap: 12px; flex-wrap: wrap; }
          .stat-card { background: #fff; border: 1px solid #e5e7eb; padding: 10px 14px; border-radius: 6px; min-width: 140px; }
          .stat-lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .stat-val { font-size: 18px; font-weight: 700; color: #111827; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; font-size: 12px; }
          th { background: #2563eb; color: #fff; font-weight: 600; }
          tr:nth-child(even) { background: #f8fafc; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-area">
            <h1>${title}</h1>
            <p>Groundwater Monitoring System</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #666;">
            <strong>Generated on:</strong><br>${now}
          </div>
        </div>
        ${filtersHtml}
        ${statsHtml}
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>${row.map(cell => `<td>${cell ?? '—'}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
