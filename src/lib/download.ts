/**
 * Utility to trigger a browser download of a string or blob.
 */
export function triggerDownload(content: string | Blob, fileName: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = fileName;
  
  // Ensure the link is in the document for some browsers
  link.style.display = 'none';
  document.body.appendChild(link);
  
  // Trigger click
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Simple CSV stringifier that handles basic quoting.
 */
export function jsonToCsv(data: any[]) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');
  
  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header] === null || row[header] === undefined ? '' : String(row[header]);
      // Quote if contains comma, newline or double quote
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [headerRow, ...rows].join('\n');
}
