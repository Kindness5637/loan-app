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
          
          /* Hide everything except print-only */
          body > *:not(.print-only):not(.print-header):not(script):not(style):not(link) {
            display: none !important;
          }
          
          /* Show print content */
          .print-only {
            display: block !important;
          }
          
          .print-header {
            display: block !important;
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #000;
          }
          
          .print-header h1 {
            font-size: 22px !important;
            margin: 0 !important;
            font-weight: bold !important;
          }
          
          .print-header p {
            font-size: 11px !important;
            margin: 3px 0 !important;
          }
          
          /* Section headings */
          h2 {
            font-size: 14px !important;
            font-weight: bold !important;
            margin: 16px 0 6px 0 !important;
            border-bottom: 1px solid #000 !important;
            padding-bottom: 3px !important;
          }
          
          /* Key-value rows */
          .flex.justify-between {
            display: flex !important;
            justify-content: space-between !important;
            padding: 3px 0 !important;
            border-bottom: 1px dotted #ccc !important;
            font-size: 11px !important;
          }
          
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
          
          /* Paragraph spacing */
          p { margin: 2px 0 !important; }
        }
      </style>
`;
