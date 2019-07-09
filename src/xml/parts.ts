const replaceRegex = /\s+/g;
const replaceReSec = />\s+</g;

export const getRowStart = (row: number) => `<row r="${row + 1}">`;
export const rowEnd: string = '</row>';

export const $s = (styleId: number) => (styleId === 0 ? '' : ' s="' + styleId + '"');

export const getStringCellXml = (index: any, cell: any, styleId = 0) => `<c r="${cell}" t="s"${$s(styleId)}><v>${index}</v></c>`;

export const getInlineStringCellXml = (s: string, cell: any, styleId = 0) =>
  `<c r="${cell}" t="inlineStr"${$s(styleId)}><is><t>${s}</t></is></c>`;

export const getNumberCellXml = (value: number, cell: any, styleId = 0) => `<c r="${cell}" t="n"${$s(styleId)}><v>${value}</v></c>`;

export const getBooleanCellXml = (value: boolean, cell: any, styleId = 0) => `<c r="${cell}" t="b"${$s(styleId)}><v>${value}</v></c>`;

export const getDateCellXml = (value: Date, cell: any, styleId = 0) =>
  `<c r="${cell}" t="d" ${$s(styleId)}><v>${value.toISOString()}</v></c>`;

export const sheetHeader: string = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <worksheet
    xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
    mc:Ignorable="x14ac"
    xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">
    <sheetViews>
        <sheetView workbookViewId="0"/>
    </sheetViews>
    <sheetFormatPr defaultRowHeight="15" x14ac:dyDescent="0.25"/>
    <sheetData>`
  .replace(replaceRegex, ' ')
  .replace(replaceReSec, '><')
  .trim();

export const sheetFooter: string = '</sheetData></worksheet>';

export const getSharedStringsHeader = (count: number) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
     count="${count}"
     uniqueCount="${count}">`
    .replace(replaceRegex, ' ')
    .replace(replaceReSec, '><')
    .trim();

export const getSharedStringXml = (s: string) => `<si><t>${s}</t></si>`;
export const sharedStringsFooter: string = '</sst>';
