import { Request, Response, NextFunction } from 'express';
import {
  InvalidTokenError,
  UnauthorizedError,
  InsufficientScopeError,
} from 'express-oauth2-jwt-bearer';

export const errorHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any,
  _request: Request,
  response: Response,
  _next: NextFunction,
) => {
  if (error instanceof InsufficientScopeError) {
    const message = 'Permission denied';

    response.status(error.status).json({ message });

    return;
  }

  if (error instanceof InvalidTokenError) {
    const message = 'Bad credentials';

    response.status(error.status).json({ message });

    return;
  }

  if (error instanceof UnauthorizedError) {
    const message = 'Requires authentication';

    response.status(error.status).json({ message });

    return;
  }

  const status = 500;
  const message = 'Internal Server Error';

  response.status(status).json({ message });
};
