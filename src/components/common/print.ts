export const printStyles = `
      <style>
        @media print {
          @page {
            margin: 0.5in;
            size: letter;
          }
          
          body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #000;
            background: white !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          .min-h-screen {
            min-height: auto !important;
            background: white !important;
          }
          
          .bg-background, .bg-card, .bg-gradient-to-br {
            background: white !important;
            background-color: white !important;
          }
          
          .shadow, .shadow-lg, .shadow-border {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
          
          .border, .border-b-solid {
            border: 1px solid #ddd !important;
          }
          
          .grid, .grid-cols-1, .grid-cols-2, .grid-cols-3, .md\\:grid-cols-2, .md\\:grid-cols-3, .lg\\:grid-cols-2 {
            display: grid !important;
            gap: 15px !important;
          }
          
          .gap-6 {
            gap: 15px !important;
          }
          
          .p-6 {
            padding: 20px !important;
          }
          
          .mt-6 {
            margin-top: 20px !important;
          }
          
          .mb-6, .mb-4 {
            margin-bottom: 15px !important;
          }
          
          .space-y-4 > * + * {
            margin-top: 10px !important;
          }
          
          .text-3xl {
            font-size: 24px !important;
          }
          
          .text-2xl {
            font-size: 20px !important;
          }
          
          .text-xl {
            font-size: 18px !important;
          }
          
          .text-lg {
            font-size: 16px !important;
          }
          
          .text-sm {
            font-size: 12px !important;
          }
          
          .rounded-lg, .rounded-full {
            border-radius: 4px !important;
          }
          
          .flex {
            display: flex !important;
          }
          
          .items-center {
            align-items: center !important;
          }
          
          .justify-between {
            justify-content: space-between !important;
          }
          
          .mx-auto {
            margin-left: auto !important;
            margin-right: auto !important;
          }
          
          .max-w-7xl, .max-w-8xl {
            max-width: 100% !important;
          }
          
          /* Status badge styling for print */
          .bg-yellow-100, .bg-green-800, .bg-green-500, .bg-gray-100, .bg-red-100, .bg-green-100 {
            background: #f0f0f0 !important;
            color: #000 !important;
            border: 1px solid #ccc !important;
          }
          
          /* Text colors for print */
          .text-yellow-800, .text-white, .text-black-800, .text-gray-800, .text-red-800, .text-green-800,
          .text-primary, .text-green-600, .text-purple-600, .text-muted-foreground, .text-foreground {
            color: #000 !important;
          }
          
          /* Hide icons in print */
          svg, .lucide, .mr-2 {
            display: none !important;
          }
          
          /* Print header */
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            display: block !important;
          }
          
          /* Ensure good page breaks */
          .break-inside-avoid {
            page-break-inside: avoid !important;
          }
        }
        
        .print-header {
          display: none;
        }
      </style>
`;