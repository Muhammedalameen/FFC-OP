import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToXLSX = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToPDF = (headers: string[], data: any[][], fileName: string, title: string) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Basic support for Arabic might be tricky without a font, 
  // but we'll use standard jspdf-autotable which works for basic text.
  // For full Arabic support, we'd need to embed a font.
  
  doc.text(title, 14, 15);
  
  doc.autoTable({
    head: [headers],
    body: data,
    startY: 20,
    styles: { font: 'helvetica', halign: 'right' },
    headStyles: { fillColor: [79, 70, 229] },
  });

  doc.save(`${fileName}.pdf`);
};

export const printReport = (content: string) => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>طباعة التقرير</title>
          <style>
            body { font-family: sans-serif; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = () => {
              window.print();
              // window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
