import request from 'supertest';
import { Express, Request, Response, NextFunction } from 'express';
import { Client } from 'pg';
import { createServer } from '../api';
import { checkRequiredPermissions, validateAccessToken } from '../middleware/auth0.middleware';

type SoundRow = {
  id: number;
  name: string;
  file: string;
  enabled: boolean;
};

jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
  };
  return { Client: jest.fn(() => mClient) };
});

jest.mock('cors', () => {
  return jest.fn().mockImplementation(() => {
    return (_req: Request, _res: Response, next: NextFunction) => {
      next();
    };
  });
});

jest.mock('@azure/storage-blob', () => ({
  // ...jest.requireActual('@azure/storage-blob'), // keep other props as they are
  BlobServiceClient: jest.fn().mockImplementation(() => {
    return {
      getContainerClient: jest.fn().mockImplementation(() => {
        return 'sounds';
      }),
    };
  }),
}));

jest.mock('../middleware/auth0.middleware', () => ({
  validateAccessToken: jest.fn().mockImplementation(() => {
    return (_req: Request, _res: Response, next: NextFunction) => {
      next();
    };
  }),
  checkRequiredPermissions: jest.fn().mockImplementation(() => {
    return (_req: Request, _res: Response, next: NextFunction) => {
      next();
    };
  }),
}));

let server: Express;
let client: jest.Mocked<Client>;
beforeAll(async () => {
  server = await createServer();
  client = new Client() as jest.Mocked<Client>;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('GET STATIC', () => {
  it('index', () => {
    return request(server).get('/').expect(200);
  });

  it('record', () => {
    return request(server).get('/record/').expect(200);
  });

  it('map', () => {
    return request(server).get('/map/').expect(200);
  });

  it('admin', () => {
    return request(server).get('/admin/').expect(200);
  });

  it('callback', () => {
    return request(server).get('/callback/').expect(200);
  });

  it('app.bundle.js', () => {
    return request(server).get('/app.bundle.js').expect(200);
  });
});

describe('GET API', () => {
  test('should return a list of sounds', async () => {
    const mockSounds: SoundRow[] = [
      { id: 1, name: 'Sound 1', file: 'sound1.mp3', enabled: true },
      { id: 2, name: 'Sound 2', file: 'sound2.mp3', enabled: true },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.query.mockImplementationOnce((_query: string, callback: any) => {
      callback(null, {
        command: 'SELECT',
        rowCount: mockSounds.length,
        oid: 0,
        rows: mockSounds,
        fields: [],
      });
    });

    const res = await request(server).get('/sound-list');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual(mockSounds);
  });

  test('should return a full list of sounds', async () => {

    const mockSounds: SoundRow[] = [
      { id: 1, name: 'Sound 1', file: 'sound1.mp3', enabled: true },
      { id: 2, name: 'Sound 2', file: 'sound2.mp3', enabled: true },
    ];

    (checkRequiredPermissions as jest.Mock)
      .mockImplementationOnce((_req: Request, _res: Response, next: NextFunction) => {
        next();
      });

    (validateAccessToken as jest.Mock)
      .mockImplementationOnce((_req: Request, _res: Response, next: NextFunction) => {
        next();
      });

    (client.query as jest.Mock)
      .mockImplementationOnce((_query: string, callback: (err: Error | null, result: { rows: SoundRow[] }) => void) => {
        callback(null, { rows: mockSounds });
      });

    const res = await request(server).get('/full-sound-list');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual(mockSounds);
  });
});
