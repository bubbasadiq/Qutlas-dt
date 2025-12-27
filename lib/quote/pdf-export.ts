// lib/quote/pdf-export.ts
// PDF export utilities for quotes using browser-native methods

import { DetailedQuoteResult, formatPriceNGN } from './estimate'

export interface PDFExportOptions {
  includeBreakdown?: boolean
  includeNotes?: boolean
  companyName?: string
  companyLogo?: string
}

/**
 * Generate a quote PDF using browser-native methods (canvas + download)
 * This avoids external dependencies while providing clean PDF output
 */
export async function exportQuoteAsPDF(
  quote: DetailedQuoteResult,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    includeBreakdown = true,
    includeNotes = true,
    companyName = 'Qutlas',
  } = options

  // Create a printable HTML document
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Please allow popups to export PDF')
  }

  const html = generateQuoteHTML(quote, {
    includeBreakdown,
    includeNotes,
    companyName,
  })

  printWindow.document.write(html)
  printWindow.document.close()

  // Wait for content to load, then trigger print dialog
  printWindow.onload = () => {
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      // Close after a delay (user may want to keep it open)
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close()
        }
      }, 1000)
    }, 250)
  }
}

/**
 * Generate HTML for quote PDF
 */
function generateQuoteHTML(
  quote: DetailedQuoteResult,
  options: {
    includeBreakdown: boolean
    includeNotes: boolean
    companyName: string
  }
): string {
  const { includeBreakdown, includeNotes, companyName } = options
  const date = new Date(quote.timestamp).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quote ${quote.jobId}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #0066cc;
    }
    
    .company-info h1 {
      font-size: 28pt;
      color: #0066cc;
      margin-bottom: 5px;
    }
    
    .company-info p {
      color: #666;
      font-size: 10pt;
    }
    
    .quote-info {
      text-align: right;
    }
    
    .quote-info h2 {
      font-size: 20pt;
      color: #333;
      margin-bottom: 10px;
    }
    
    .quote-info p {
      font-size: 10pt;
      color: #666;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 600;
      color: #333;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 20px;
      margin-bottom: 15px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    
    .info-label {
      color: #666;
      font-weight: 500;
    }
    
    .info-value {
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .price-summary {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 25px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .price-total {
      text-align: center;
      margin-bottom: 15px;
    }
    
    .price-total .label {
      font-size: 11pt;
      color: #666;
      margin-bottom: 5px;
    }
    
    .price-total .amount {
      font-size: 32pt;
      font-weight: 700;
      color: #0066cc;
    }
    
    .price-details {
      display: flex;
      justify-content: center;
      gap: 30px;
      font-size: 10pt;
      color: #666;
    }
    
    .breakdown-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    .breakdown-table th,
    .breakdown-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .breakdown-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #333;
    }
    
    .breakdown-table td:last-child,
    .breakdown-table th:last-child {
      text-align: right;
    }
    
    .breakdown-total {
      font-weight: 700;
      font-size: 14pt;
      color: #0066cc;
      border-top: 3px double #333;
    }
    
    .breakdown-subtotal {
      font-weight: 600;
      border-top: 2px solid #333;
    }
    
    .notes {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
    
    .notes-title {
      font-weight: 600;
      color: #856404;
      margin-bottom: 10px;
    }
    
    .notes ul {
      list-style: none;
      padding-left: 0;
    }
    
    .notes li {
      color: #856404;
      padding: 3px 0;
    }
    
    .notes li:before {
      content: "• ";
      font-weight: bold;
      margin-right: 5px;
    }
    
    .manufacturability {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 10pt;
    }
    
    .manufacturability.excellent {
      background: #d4edda;
      color: #155724;
    }
    
    .manufacturability.good {
      background: #d1ecf1;
      color: #0c5460;
    }
    
    .manufacturability.fair {
      background: #fff3cd;
      color: #856404;
    }
    
    .manufacturability.poor {
      background: #f8d7da;
      color: #721c24;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
      color: #999;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${companyName}</h1>
      <p>Manufacturing Solutions</p>
      <p>Advanced CNC & Fabrication</p>
    </div>
    <div class="quote-info">
      <h2>QUOTE</h2>
      <p><strong>Quote ID:</strong> ${quote.jobId}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Valid for:</strong> ${quote.pricingValidMinutes} minutes</p>
    </div>
  </div>

  <div class="price-summary">
    <div class="price-total">
      <div class="label">Estimated Total</div>
      <div class="amount">${formatPriceNGN(quote.breakdown.totalPrice)}</div>
    </div>
    <div class="price-details">
      <span><strong>Unit Price:</strong> ${formatPriceNGN(quote.breakdown.unitPrice)}</span>
      <span>•</span>
      <span><strong>Lead Time:</strong> ${quote.breakdown.leadTimeDays} days</span>
    </div>
  </div>

  <div class="section">
    <h3 class="section-title">Part Specifications</h3>
    <div class="info-grid">
      <div class="info-row">
        <span class="info-label">Geometry Type:</span>
        <span class="info-value">${quote.geometry.type}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Volume:</span>
        <span class="info-value">${quote.geometry.volumeCm3} cm³</span>
      </div>
      <div class="info-row">
        <span class="info-label">Material:</span>
        <span class="info-value">${quote.material.name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Process:</span>
        <span class="info-value">${quote.process}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Weight:</span>
        <span class="info-value">${quote.material.massKg} kg</span>
      </div>
      <div class="info-row">
        <span class="info-label">Manufacturability:</span>
        <span class="manufacturability ${getManufacturabilityClass(quote.manufacturability.score)}">
          ${quote.manufacturability.score}/100
        </span>
      </div>
    </div>
  </div>

  ${includeBreakdown ? `
  <div class="section">
    <h3 class="section-title">Cost Breakdown</h3>
    <table class="breakdown-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Details</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Material Cost</td>
          <td>${quote.material.volumeCm3} cm³ @ ${formatPriceNGN(quote.material.pricePerKg)}/kg</td>
          <td>${formatPriceNGN(quote.breakdown.materialCost)}</td>
        </tr>
        <tr>
          <td>Material Waste</td>
          <td>~${((quote.breakdown.materialWaste / quote.breakdown.materialCost) * 100).toFixed(0)}%</td>
          <td>${formatPriceNGN(quote.breakdown.materialWaste)}</td>
        </tr>
        <tr>
          <td>Machine Time</td>
          <td>${quote.breakdown.machineTimeMinutes} minutes</td>
          <td>${formatPriceNGN(quote.breakdown.machineCost)}</td>
        </tr>
        <tr>
          <td>Tooling</td>
          <td>${quote.toolpath.machine}</td>
          <td>${formatPriceNGN(quote.breakdown.toolCost)}</td>
        </tr>
        <tr>
          <td>Labor</td>
          <td>Setup + Inspection</td>
          <td>${formatPriceNGN(quote.breakdown.laborCost)}</td>
        </tr>
        <tr>
          <td>Setup Fee</td>
          <td>One-time setup</td>
          <td>${formatPriceNGN(quote.breakdown.setupCost)}</td>
        </tr>
        <tr class="breakdown-subtotal">
          <td colspan="2">Subtotal</td>
          <td>${formatPriceNGN(quote.breakdown.subtotal)}</td>
        </tr>
        <tr>
          <td>Platform Fee</td>
          <td>${(quote.breakdown.platformFeePercent * 100).toFixed(0)}%</td>
          <td>${formatPriceNGN(quote.breakdown.platformFee)}</td>
        </tr>
        <tr class="breakdown-total">
          <td colspan="2">Total</td>
          <td>${formatPriceNGN(quote.breakdown.totalPrice)}</td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ''}

  ${includeNotes && quote.details.notes.filter(Boolean).length > 0 ? `
  <div class="notes">
    <div class="notes-title">Important Notes</div>
    <ul>
      ${quote.details.notes.filter(Boolean).map(note => `<li>${note}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="footer">
    <p>This quote is valid for ${quote.pricingValidMinutes} minutes from generation time.</p>
    <p>Final pricing may vary based on final design review and material availability.</p>
    <p>${companyName} - Manufacturing Excellence</p>
  </div>
</body>
</html>
  `
}

function getManufacturabilityClass(score: number): string {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'fair'
  return 'poor'
}

/**
 * Download quote as JSON
 */
export function downloadQuoteAsJSON(quote: DetailedQuoteResult): void {
  const data = JSON.stringify(quote, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `quote-${quote.jobId}.json`
  a.click()
  URL.revokeObjectURL(url)
}
