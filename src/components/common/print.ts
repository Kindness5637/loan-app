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
          
          /* Hide screen layout, show print layout */
          .screen-only {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          /* Print header */
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
          .print-section-title {
            font-size: 13px !important;
            font-weight: bold !important;
            margin: 14px 0 4px 0 !important;
            border-bottom: 1px solid #000 !important;
            padding-bottom: 2px !important;
          }
          
          /* Key-value rows */
          .print-row {
            display: flex !important;
            justify-content: space-between !important;
            padding: 3px 0 !important;
            border-bottom: 1px dotted #ccc !important;
            font-size: 11px !important;
          }
          
          .print-row .label {
            color: #333 !important;
          }
          
          .print-row .value {
            font-weight: bold !important;
            text-align: right !important;
          }
          
          /* Tables */
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 8px 0 !important;
            font-size: 10px !important;
          }
          
          .print-table th,
          .print-table td {
            padding: 4px 8px !important;
            text-align: left !important;
            border-bottom: 1px solid #ccc !important;
          }
          
          .print-table th {
            font-weight: bold !important;
            border-bottom: 2px solid #000 !important;
            background: #f0f0f0 !important;
          }
          
          .print-table .text-right {
            text-align: right !important;
          }
        }
      </style>
`;
