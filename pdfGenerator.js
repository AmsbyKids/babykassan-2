const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generatePlanPDF(planData, filename = 'plan.pdf') {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, filename);
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(18).text('Din Föräldraledighetsplan', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Mål: ${planData.goal}`);
  doc.text(`SGI: ${planData.sgi} kr`);
  doc.text(`Skatt: ${planData.taxRate}%`);
  doc.text(`Start: ${planData.startMonth}`);
  doc.moveDown();

  planData.months.forEach((month, i) => {
    doc.text(`Månad ${i + 1}: ${month.name}`);
    doc.text(`  Dagar: ${month.days}`);
    doc.text(`  Brutto: ${month.brutto} kr`);
    doc.text(`  Skatt: ${month.tax} kr`);
    doc.text(`  Netto: ${month.netto} kr`);
    doc.moveDown();
  });

  doc.end();

  return filePath;
}

module.exports = generatePlanPDF;
