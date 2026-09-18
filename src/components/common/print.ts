export const printStyles = `
      <style>
        @media print {
          @page {
            margin: 0.6in;
            size: A4;
          }
          
          * {
            color: #000 !important;
            background: transparent !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            line-height: 1.5;
            color: #000;
          }
          
          /* Hide non-print elements */
          .no-print,
          .no-print *,
          button,
          nav,
          header:not(.print-header) {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          /* Remove all card/box styling */
          .bg-card,
          .bg-gradient-to-br,
          .bg-gradient-to-r,
          .bg-slate-50,
          .bg-muted\/30,
          .bg-green-50,
          .bg-blue-50,
          .bg-red-50,
          .bg-orange-50,
          .bg-yellow-50,
          [class*="bg-"] {
            background: transparent !important;
            background-color: transparent !important;
          }
          
          /* Remove shadows and rounded corners */
          .shadow,
          .shadow-lg,
          .shadow-md,
          .rounded-lg,
          .rounded-full,
          .rounded-md,
          [class*="shadow"],
          [class*="rounded"] {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          /* Clean borders - only horizontal rules */
          .border {
            border: none !important;
            border-bottom: 1px solid #ccc !important;
          }
          
          /* Section spacing */
          .break-inside-avoid {
            page-break-inside: avoid !important;
            margin-bottom: 16px !important;
            padding-bottom: 12px !important;
            border-bottom: 1px solid #ddd !important;
          }
          
          /* Remove excessive padding */
          .p-6,
          .p-4,
          .p-3,
          .px-6,
          .py-6,
          .pt-6,
          .pb-6,
          [class*="p-"] {
            padding: 4px 0 !important;
          }
          
          .p-6 {
            padding: 8px 0 !important;
          }
          
          /* Grid becomes single column */
          .grid {
            display: block !important;
          }
          
          .grid > * {
            margin-bottom: 8px !important;
          }
          
          /* Typography */
          h1 { font-size: 20px !important; margin: 0 0 4px 0 !important; }
          h2 { font-size: 14px !important; font-weight: bold !important; margin: 12px 0 6px 0 !important; border-bottom: 1px solid #000 !important; padding-bottom: 3px !important; }
          h3 { font-size: 12px !important; font-weight: bold !important; margin: 8px 0 4px 0 !important; }
          p { margin: 2px 0 !important; }
          
          /* Tables */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 8px 0 !important;
            font-size: 10px !important;
          }
          
          th, td {
            padding: 4px 8px !important;
            text-align: left !important;
            border-bottom: 1px solid #ccc !important;
          }
          
          th {
            font-weight: bold !important;
            border-bottom: 2px solid #000 !important;
          }
          
          /* Force all text black */
          .text-primary,
          .text-green-600,
          .text-green-700,
          .text-blue-600,
          .text-blue-700,
          .text-red-600,
          .text-red-700,
          .text-orange-600,
          .text-orange-700,
          .text-purple-600,
          .text-purple-700,
          .text-yellow-800,
          .text-gray-800,
          .text-muted-foreground,
          [class*="text-"] {
            color: #000 !important;
          }
          
          /* Remove grid gaps */
          .gap-6,
          .gap-4,
          .gap-3,
          .gap-2,
          [class*="gap-"] {
            gap: 0 !important;
          }
          
          /* Progress bar becomes simple text */
          .bg-green-600,
          .bg-gray-200,
          [role="progressbar"] {
            display: none !important;
          }
          
          /* Badge styling */
          .inline-flex {
            border: 1px solid #000 !important;
            padding: 1px 6px !important;
          }
          
          /* Print header */
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #000;
            display: block !important;
          }
          
          .print-header h1 {
            font-size: 22px !important;
            margin: 0 !important;
            font-weight: bold !important;
          }
          
          .print-header p {
            font-size: 11px !important;
            margin: 3px 0 !important;
            color: #000 !important;
          }
          
          /* Key-value pairs layout */
          .flex.justify-between {
            display: flex !important;
            justify-content: space-between !important;
            padding: 3px 0 !important;
            border-bottom: 1px dotted #ccc !important;
          }
          
          /* Section dividers */
          hr {
            border: none !important;
            border-top: 1px solid #000 !important;
            margin: 12px 0 !important;
          }
          
          /* Remove margins from container */
          .min-h-screen {
            min-height: auto !important;
          }
          
          .max-w-7xl,
          .max-w-8xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Status badge */
          [class*="bg-yellow"],
          [class*="bg-green"],
          [class*="bg-red"],
          [class*="bg-gray"],
          [class*="bg-blue"] {
            background: transparent !important;
            border: 1px solid #000 !important;
          }
        }
        
        .print-header {
          display: none;
        }
      </style>
`;
