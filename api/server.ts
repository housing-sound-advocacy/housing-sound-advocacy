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

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app: Express = express();
const port = process.env.PORT || 8080;

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
  client.query('SELECT * FROM sounds', (err, result) => {
    if (err) throw err;
    res.send(result.rows);
  });
});

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
    const text =
      'INSERT INTO sounds(latitude, longitude, filename, url, enabled) VALUES($1, $2, $3, $4, $5) RETURNING *';
    const values = [req.body.lat, req.body.lng, filename, url, true];
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
app.use('/callback', express.static('dist'));
app.use('/app.bundle.js', express.static('dist/app.bundle.js'));
app.use(errorHandler);
app.use(notFoundHandler);

app.listen(port, () => {
  console.warn(`⚡️[server]: Server is running at https://localhost:${port}`);
});
