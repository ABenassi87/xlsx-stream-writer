export interface XlsxStreamWriterOptions {
  inlineStrings: boolean;
  styles: XLSXStyle[];
  styleIdFunc: (value: any, columnId: number, rowId: number) => number;
}

export interface XLSXStyle {
  fill?: string;
  format?: string;
}

export interface XLSX {
  [key: string]: string;
}

export interface SharedStringsMap {
  [key: string]: number;
}
