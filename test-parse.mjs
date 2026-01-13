import XLSX from 'xlsx';

const filePath = './test-file.xlsx';

try {
  console.log('Reading file:', filePath);
  const workbook = XLSX.readFile(filePath, {
    type: 'file',
    cellDates: true,
    cellNF: true,
  });

  console.log('Sheet names:', workbook.SheetNames);

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');
    console.log(`\nSheet "${sheetName}":`);
    console.log(`  Rows: ${range.e.r - range.s.r + 1}`);
    console.log(`  Cols: ${range.e.c - range.s.c + 1}`);

    const data = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    console.log(`  Data rows: ${data.length}`);

    if (data.length > 0) {
      console.log(`  Headers: ${Object.keys(data[0]).join(', ')}`);
      console.log(`  First row:`, data[0]);
    }
  }

  console.log('\n✅ File parsed successfully!');
} catch (error) {
  console.error('❌ Parse error:', error.message);
  console.error('Stack:', error.stack);
}
