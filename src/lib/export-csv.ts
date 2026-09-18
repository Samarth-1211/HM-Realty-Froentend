/**
 * Dependency-free CSV export — opens directly in Excel/Google Sheets.
 * (Deliberately not using a .xlsx library: the maintained options either ship
 * unpatched high-severity vulnerabilities on npm (`xlsx`) or drag in a large,
 * partly-unmaintained transitive tree for a feature CSV already covers.)
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escapeCell = (cell: string | number | null | undefined): string => {
    const value = cell === null || cell === undefined ? '' : String(cell)
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','))
  // Leading BOM so Excel detects UTF-8 correctly instead of mangling ₹/non-ASCII text.
  const csvContent = '﻿' + lines.join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
