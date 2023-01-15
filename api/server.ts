import express, { Express, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import { auth } from 'express-openid-connect';
import pg from 'pg';
import fileUpload from 'express-fileupload';
import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import { v1 as uuidv1 } from 'uuid';
import { UploadedFile } from 'express-fileupload';
import rateLimit from 'express-rate-limit';

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
);
const allowedOrigins = ['http://localhost:8000', 'https://claudewittmann.ca'];
const corsOptions: CorsOptions = {
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

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.AUTH_BASE_URL,
  clientID: process.env.AUTH_CLIENT_ID,
  issuerBaseURL: process.env.AUTH_ISSUER_BASE_URL,
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

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.oidc.isAuthenticated();
  next();
});

const client = new pg.Client(dbConfig);

client.connect(err => {
  if (err) throw err;
});

// req.isAuthenticated is provided from the auth router
app.get('/', (req: Request, res: Response) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

app.get('/sound-list', cors(corsOptions), (_req: Request, res: Response) => {
  client.query('SELECT * FROM sounds', (err, result) => {
    if (err) throw err;
    res.send(result.rows);
  });
});

app.post('/sound', async (req: Request, res: Response) => {
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
  const text = 'INSERT INTO sounds(latitude, longitude, filename, url, enabled) VALUES($1, $2, $3, $4, $5) RETURNING *';
  const values = [req.body.lat, req.body.lng, filename, url, true];
  try {
    const result = await client.query(text, values);
    res.send(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(400).send('No files were uploaded.');
  }
});

app.get('/sign-up', (_req: Request, res) => {
  res.oidc.login({
    authorizationParams: {
      screen_hint: 'signup',
    },
  });
});

app.use('/record', express.static('dist'));
app.use('/map', express.static('dist'));
app.use('/app.bundle.js', express.static('dist/app.bundle.js'));

app.listen(port, () => {
  console.warn(`⚡️[server]: Server is running at https://localhost:${port}`);
});
