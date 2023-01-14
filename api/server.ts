import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { auth } from 'express-openid-connect';

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

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.oidc.isAuthenticated();
  next();
});

// req.isAuthenticated is provided from the auth router
app.get('/', (req: Request, res: Response) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
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
