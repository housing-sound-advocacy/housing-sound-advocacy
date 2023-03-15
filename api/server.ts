import express, { Express, Request, Response } from 'express';
import nocache from 'nocache';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import fileUpload from 'express-fileupload';
import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import { v1 as uuidv1 } from 'uuid';
import { UploadedFile } from 'express-fileupload';
import rateLimit from 'express-rate-limit';
import { checkRequiredPermissions, validateAccessToken } from './middleware/auth0.middleware';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

export async function createServer(): Promise<Express> {
  const app: Express = express();

  const limiter = rateLimit({
	   windowMs: 15 * 60 * 1000,
  	 max: 100,
	   standardHeaders: true,
  	 legacyHeaders: false,
  });

  app.use(
    fileUpload(),
    limiter,
    nocache(),
  );
  const allowedOrigins = ['http://localhost:8000', 'https://claudewittmann.ca', 'https://db18-142-198-63-210.ngrok.io'];
  const corsOptions: CorsOptions = {
    allowedHeaders: ['Authorization', 'Content-Type'],
    origin: function (origin, callback) {
      // allow requests with no origin 
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not ' +
                    'allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  };

  const dbConfig = {
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: 'housing-sound-advocacy',
    host: 'dfj.postgres.database.azure.com',
    port: 5432,
    ssl: true,
  };

  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  if (!accountName) throw Error('Azure Storage accountName not found');
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential(),
  );
  const containerName = 'sounds';
  const containerClient = blobServiceClient.getContainerClient(containerName);
  console.warn('Connected to Azure Storage');

  const client = new pg.Client(dbConfig);

  client.connect(err => {
    if (err) throw err;
  });

  app.use('/', express.static('dist'));

  app.get('/sound-list', cors(corsOptions), (_req: Request, res: Response) => {
    client.query('SELECT * FROM sounds WHERE enabled=true', (err, result) => {
      if (err) throw err;
      res.send(result.rows);
    });
  });

  app.get(
    '/full-sound-list',
    validateAccessToken,
    checkRequiredPermissions(['delete:sounds']),
    cors(corsOptions),
    (_req: Request, res: Response) => {
      client.query('SELECT * FROM sounds ORDER BY id', (err, result) => {
        if (err) throw err;
        res.send(result.rows);
      });
    },
  );

  app.post(
    '/sound-status',
    validateAccessToken,
    checkRequiredPermissions(['delete:sounds']),
    async (req: Request, res: Response) => {
      const text = 'UPDATE sounds SET enabled=$1 WHERE id=$2';
      const values = [req.body.enabled, req.body.id];
      try {
        const result = await client.query(text, values);
        res.send(result.rows[0]);
      } catch (err) {
        console.error(err);
        return res.status(400).send('Could not update sound status');
      }
    },
  );

  app.post(
    '/delete-sound',
    validateAccessToken,
    checkRequiredPermissions(['delete:sounds']),
    async (req: Request, res: Response) => {
      const text = 'SELECT filename FROM sounds WHERE id=$1';
      const values = [req.body.id];
      let filename: string;
      try {
        const result = await client.query(text, values);
        filename = result.rows[0].filename;
      } catch (err) {
        console.error(err);
        return res.status(400).send('Could not update sound status');
      }
      if (filename) {
        try {
          const blockBlobClient = containerClient.getBlockBlobClient(filename);
          await blockBlobClient.delete();
        } catch (err) {
          return res.status(400).send('Could not delete sound');
        }
      }
      const deleteText = 'DELETE FROM sounds WHERE id=$1';
      const deleteValues = [req.body.id];
      try {
        await client.query(deleteText, deleteValues);
        res.status(200).send('Sound deleted');
      } catch (err) {
        console.error(err);
        return res.status(400).send('Could not update sound status');
      }
    },
  );

  app.post(
    '/sound',
    validateAccessToken,
    checkRequiredPermissions(['create:sounds']),
    async (req: Request, res: Response) => {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
      }
      const file = req.files.file as UploadedFile;
      const data = file.data;

      // Create a unique name for the blob
      const blobName = 'sound-' + uuidv1() + '.mp4';

      // Get a block blob client
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Display blob name and url
      const filename = blobName;
      const url = blockBlobClient.url;
      console.warn(
        `\nUploading to Azure storage as blob\n\tname: ${blobName}:\n\tURL: ${blockBlobClient.url}`,
      );

      // Upload data to the blob
      const headers = { blobHTTPHeaders: { blobContentType: 'audio/mp4' } };
      const uploadBlobResponse = await blockBlobClient.upload(data, data.length, headers);
      console.warn(
        `Blob was uploaded successfully. requestId: ${uploadBlobResponse.requestId}`,
      );
      const text = `INSERT INTO sounds(
        latitude,
        longitude,
        filename,
        url,
        description,
        enabled
      ) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`;
      const values = [req.body.lat, req.body.lng, filename, url, req.body.description, true];
      try {
        const result = await client.query(text, values);
        res.send(result.rows[0]);
      } catch (err) {
        console.error(err);
        return res.status(400).send('No files were uploaded.');
      }
    },
  );

  app.use('/record', express.static('dist'));
  app.use('/map', express.static('dist'));
  app.use('/admin', express.static('dist'));
  app.use('/callback', express.static('dist'));
  app.use('/app.bundle.js', express.static('dist/app.bundle.js'));
  app.use(errorHandler);
  app.use(notFoundHandler);

  return app;
}

const port = process.env.PORT || 8080;
createServer().then(app => {
  app.listen(port, () => {
    console.warn(`⚡️[server]: Server is running at https://localhost:${port}`);
  });
});
