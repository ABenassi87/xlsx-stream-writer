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
  const rows = generateRandomData(500);
  logger.debug('data generated', rows);
  const xlsxWriter = new XlsxStreamWriter();

  const streamOfRows = wrapRowsInStream(rows);

  xlsxWriter.addRows(streamOfRows);

  xlsxWriter.getFile().then(buffer => res.write(buffer));
}

export default applicationRoutes;
