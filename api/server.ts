import dotenv from 'dotenv';
import { createServer } from './api';

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

const port = process.env.PORT || 8080;
createServer().then(app => {
  app.listen(port, () => {
    console.warn(`⚡️[server]: Server is running at https://localhost:${port}`);
  });
});
