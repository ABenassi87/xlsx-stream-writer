import { XlsxStreamWriter } from '../../src/xlsx-stream-writer';
import { rows } from '../helpers';
import { getXmlFromXmlStream } from '../../src/helpers';
import { XLSXStyle } from '../../src/xlsx-stream-writer.models';

const sheetXmlExpected: string =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15" x14ac:dyDescent="0.25"/><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2" t="s"><v>3</v></c></row><row r="3"><c r="A3" t="s"><v>4</v></c><c r="B3" t="s"><v>5</v></c></row><row r="4"><c r="A4" t="s"><v>6</v></c><c r="B4" t="s"><v>7</v></c></row></sheetData></worksheet>';

describe('Styles', () => {
  it('adds styles to worksheet', () => {
    const styles: XLSXStyle[] = [{ fill: 'red' }, { format: '0.00' }, { format: 'dd.mm.yy' }];
    const xlsx: XlsxStreamWriter = new XlsxStreamWriter({ styles });
    xlsx.addRows(rows);
    return expect(getXmlFromXmlStream(xlsx.sheetXmlStream)).resolves.toBe(sheetXmlExpected);
  });
});
