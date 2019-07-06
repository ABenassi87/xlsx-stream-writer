import express from 'express';
import applicationRoutes from './routes';

const app = express();
const port = 3000; // default port to listen

app.get('/', (req, res) => {
  res.send('Hello world!');
});

app.use('/file', applicationRoutes);

// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
