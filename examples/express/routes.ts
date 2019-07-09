import { Request, Response, Router } from 'express';
import { generateRandomData } from './helper';
import { XlsxStreamWriter } from '../../src/xlsx-stream-writer';
import logger from './logger';

const applicationRoutes: Router = Router();

applicationRoutes.get('/download', generateFile);

function generateFile(req: Request, res: Response) {
  logger.info('generateFile');
  const rows = generateRandomData(50, true);
  logger.info('data generated', rows.length);
  const xlsxWriter = new XlsxStreamWriter();

  xlsxWriter.addRows(rows);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats');
  res.setHeader('Content-Disposition', 'attachment; filename=' + 'example.xlsx');

  xlsxWriter
    .getStream()
    .on('end', function() {
      logger.info('zip stream ended.');
    })
    .pipe(res)
    .on('finish', function() {
      // JSZip generates a readable stream with a "end" event,
      // but is piped here in a writable stream which emits a "finish" event.
      logger.info('zip finished.');
      res.end();
    });

  for (let i = 0; i < 1; i++) {
    const rowsData = generateRandomData(500);
    logger.info('Added new data.');
    xlsxWriter.addRows(rowsData);
  }

  xlsxWriter.commit();
}

export default applicationRoutes;
