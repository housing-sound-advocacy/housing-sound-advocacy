import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { auth } from 'express-openid-connect';
import pg from 'pg';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app: Express = express();
const port = process.env.PORT || 8080;

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

app.get('/sound-list', (_req: Request, res: Response) => {
  client.query('SELECT * FROM sounds', (err, result) => {
    if (err) throw err;
    res.send(result.rows);
  });
});

app.get('/sign-up', (_req: Request, res) => {
  res.oidc.login({
    authorizationParams: {
      screen_hint: 'signup',
    },
  });
});

app.use('/record', express.static('dist'));
app.use('/app.bundle.js', express.static('dist/app.bundle.js'));

app.listen(port, () => {
  console.warn(`⚡️[server]: Server is running at https://localhost:${port}`);
});
