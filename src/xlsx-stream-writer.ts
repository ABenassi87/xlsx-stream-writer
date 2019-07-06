import { SharedStringsMap, XLSX, XlsxStreamWriterOptions } from './xlsx-stream-writer.models';
import { PassThrough, Readable } from 'stream';
import * as xmlBlobs from './xml/blobs';
import * as xmlParts from './xml/parts';
import { escapeXml, getCellAddress, wrapRowsInStream } from './helpers';
import { getStyles } from './styles';
import * as JSZip from 'jszip';

const defaultOptions: XlsxStreamWriterOptions = {
  inlineStrings: false,
  styles: [],
  styleIdFunc: (value: any, columnId: number, rowId: number) => 0,
};

export class XlsxStreamWriter {
  options: XlsxStreamWriterOptions;
  sheetXmlStream: Readable;
  sharedStringsXmlStream: Readable;
  sharedStringsArr: string[];
  sharedStringsMap: SharedStringsMap;
  sharedStringsHashMap: any;
  xlsx: XLSX;

  constructor(options?: Partial<XlsxStreamWriterOptions>) {
    this.options = Object.assign(defaultOptions, options);
    this.sheetXmlStream = new Readable();

    this.sharedStringsXmlStream = new Readable();
    this.sharedStringsArr = [];
    this.sharedStringsMap = {};
    this.sharedStringsHashMap = {};

    this.xlsx = {
      '[Content_Types].xml': cleanUpXml(xmlBlobs.contentTypes),
      '_rels/.rels': cleanUpXml(xmlBlobs.rels),
      'xl/workbook.xml': cleanUpXml(xmlBlobs.workbook),
      // "xl/styles.xml": cleanUpXml(xmlBlobs.styles),
      'xl/styles.xml': cleanUpXml(getStyles(this.options.styles)),
      'xl/_rels/workbook.xml.rels': cleanUpXml(xmlBlobs.workbookRels),
    };
  }

  /**
   * Add rows to xlsx.
   * @param {Array | Readable} rowsOrStream array of arrays or readable stream of arrays
   * @return {undefined}
   */
  addRows(rowsOrStream: any[] | Readable) {
    let rowsStream;
    if (rowsOrStream instanceof Readable) rowsStream = rowsOrStream;
    else if (Array.isArray(rowsOrStream)) rowsStream = wrapRowsInStream(rowsOrStream);
    else throw Error('Argument must be an array of arrays or a readable stream of arrays');
    const rowsToXml = this._getRowsToXmlTransformStream();
    const tsToString = this._getToStringTransformStream();
    // TODO why do we need to call .toString in case we want to inline strings?
    this.sheetXmlStream = this.options.inlineStrings ? rowsStream.pipe(rowsToXml).pipe(tsToString) : rowsStream.pipe(rowsToXml);
    this.sharedStringsXmlStream = this._getSharedStringsXmlStream();
  }

  getReadable(): Readable {
    return this.sheetXmlStream;
  }

  _getToStringTransformStream(): PassThrough {
    const ts = new PassThrough();
    ts._transform = (data, encoding, callback) => {
      ts.push(data.toString(), 'utf8');
      callback();
    };
    return ts;
  }

  _getRowsToXmlTransformStream(): PassThrough {
    const ts = new PassThrough({ objectMode: true });
    let c = 0;
    ts._transform = (data, encoding, callback) => {
      if (c === 0) {
        ts.push(xmlParts.sheetHeader, 'utf8');
      }
      const rowXml = this._getRowXml(data, c);
      // console.log(rowXml);
      ts.push(rowXml.toString(), 'utf8');
      c++;
      callback();
    };

    ts._flush = cb => {
      ts.push(xmlParts.sheetFooter, 'utf8');
      cb();
    };
    return ts;
  }

  _getRowXml(row: any[], rowIndex: number): string {
    let rowXml = xmlParts.getRowStart(rowIndex);
    row.forEach((cellValue, colIndex) => {
      const cellAddress = getCellAddress(rowIndex + 1, colIndex + 1);
      const styleId = this.options.styleIdFunc(cellValue, colIndex, rowIndex);
      rowXml += this._getCellXml(cellValue, cellAddress, styleId);
    });
    rowXml += xmlParts.rowEnd;
    return rowXml;
  }

  _getCellXml(value: any, address: any, styleId = 0): string {
    let cellXml;
    if (Number.isNaN(value) || value === null || typeof value === 'undefined') cellXml = xmlParts.getStringCellXml('', address, styleId);
    else if (typeof value === 'number') cellXml = xmlParts.getNumberCellXml(value, address, styleId);
    else cellXml = this._getStringCellXml(value, address, styleId);
    return cellXml;
  }

  _getStringCellXml(value: any, address: any, styleId: number): string {
    const stringValue = String(value);
    // console.log(value, stringValue);
    return this.options.inlineStrings
      ? xmlParts.getInlineStringCellXml(escapeXml(String(value)), address, styleId)
      : xmlParts.getStringCellXml(this._lookupString(stringValue), address, styleId);
  }

  _lookupString(value: string): number {
    let sharedStringIndex: number = this.sharedStringsMap[value];
    if (typeof sharedStringIndex !== 'undefined') return sharedStringIndex;
    sharedStringIndex = this.sharedStringsArr.length;
    this.sharedStringsMap[value] = sharedStringIndex;
    this.sharedStringsArr.push(value);
    return sharedStringIndex;
  }

  _getSharedStringsXmlStream(): Readable {
    const rs = new Readable();
    let c = 0;
    rs._read = () => {
      if (c === 0) {
        rs.push(xmlParts.getSharedStringsHeader(this.sharedStringsArr.length));
      }
      if (c === this.sharedStringsArr.length) {
        rs.push(xmlParts.sharedStringsFooter);
        rs.push(null);
      } else rs.push(xmlParts.getSharedStringXml(escapeXml(String(this.sharedStringsArr[c]))));
      c++;
    };
    return rs;
  }

  _clearSharedStrings() {
    this.sharedStringsMap = {};
    this.sharedStringsArr = [];
  }

  // returns blob in a browser, buffer in nodejs
  getFile() {
    this._clearSharedStrings();
    // add all static files
    Object.keys(this.xlsx).forEach(key => JSZip.file(key, this.xlsx[key]));

    // add "xl/worksheets/sheet1.xml"
    JSZip.file('xl/worksheets/sheet1.xml', this.sheetXmlStream);
    // add "xl/sharedStrings.xml"
    JSZip.file('xl/sharedStrings.xml', this.sharedStringsXmlStream);
    this._clearSharedStrings();

    const isBrowser = typeof window !== 'undefined' && {}.toString.call(window) === '[object Window]';

    return new Promise((resolve, reject) => {
      if (isBrowser) {
        JSZip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: {
            level: 4,
          },
          streamFiles: true,
        })
          .then(resolve)
          .catch(reject);
      } else {
        JSZip.generateAsync({
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: {
            level: 4,
          },
          streamFiles: true,
        })
          .then(resolve)
          .catch(reject);
      }
    });
  }
}

function cleanUpXml(xml: string): string {
  return xml.replace(/>\s+</g, '><').trim();
}
