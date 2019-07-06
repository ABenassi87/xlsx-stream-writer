import { Router } from 'express';
import { generateRandomData } from './helper';

import { Response, Request } from 'express';
import { XlsxStreamWriter } from '../../src/xlsx-stream-writer';
import { wrapRowsInStream } from '../../src/helpers';
import logger from './logger';

const applicationRoutes: Router = Router();

applicationRoutes.get('/generate', generateFile);

function generateFile(req: Request, res: Response) {
  logger.debug('generateFile', req);
  const rows = generateRandomData(50000);
  logger.debug('data generated', rows);
  const xlsxWriter = new XlsxStreamWriter();

  xlsxWriter.addRows(rows);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats');
  res.setHeader('Content-Disposition', 'attachment; filename=' + 'example.xlsx');

  xlsxWriter
    .getStream()
    .pipe(res)
    .on('finish', function() {
      // JSZip generates a readable stream with a "end" event,
      // but is piped here in a writable stream which emits a "finish" event.
      res.end();
    });
}

export default applicationRoutes;
