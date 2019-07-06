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

  const streamOfRows = wrapRowsInStream(rows);

  xlsxWriter.addRows(streamOfRows);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats');
  res.setHeader('Content-Disposition', 'attachment; filename=' + 'example.xlsx');

  const read: NodeJS.ReadableStream = xlsxWriter.getStream();

  read.pipe(res);

  read.on('data', data => res.write(data.toString())).on('end', () => res.end());
}

export default applicationRoutes;
