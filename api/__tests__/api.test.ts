import request from 'supertest';
import { Express, Request, Response, NextFunction } from 'express';
import { Client } from 'pg';
import { UploadedFile } from 'express-fileupload';
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

jest.mock('uuid', () => ({ v1: jest.fn(() => 'mock-uuid') }));

const blobName = 'sound-mock-uuid.mp4';
const mockUpload = jest.fn().mockResolvedValue(null);
jest.mock('@azure/storage-blob', () => ({
  // ...jest.requireActual('@azure/storage-blob'), // keep other props as they are
  BlobServiceClient: jest.fn().mockImplementation(() => {
    return {
      getContainerClient: jest.fn().mockImplementation(() => {
        return {
          getBlockBlobClient: jest.fn().mockImplementation(() => {
            return {
              delete: jest.fn().mockImplementation(() => {
                return {
                  blobBody: 'blobBody',
                };
              }),
              upload: mockUpload,
              url: `https://example.com/${blobName}`,
            };
          }),
        };
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

describe('POST API', () => {
  test('should update sound status', async () => {
    const soundId = '1';
    const soundEnabled = 'false';

    (validateAccessToken as jest.Mock)
      .mockImplementationOnce((_req: Request, _res: Response, next: NextFunction) => {
        next();
      });

    (checkRequiredPermissions as jest.Mock)
      .mockImplementationOnce((_req: Request, _res: Response, next: NextFunction) => {
        next();
      });

    (client.query as jest.Mock)
      .mockImplementationOnce(async (_text: string, _values: [string, string]) => {
        return { rows: [] };
      });

    const res = await request(server)
      .post('/sound-status')
      .send(`enabled=${soundEnabled}&id=${soundId}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toEqual(200);
    expect(client.query).toHaveBeenCalledWith(
      'UPDATE sounds SET enabled=$1 WHERE id=$2',
      [soundEnabled, soundId],
    );
  });

  test('should delete sound status', async () => {
    const soundId = '1';
    const filename = 'sound1.mp3';

    (validateAccessToken as jest.Mock)
      .mockImplementationOnce((_req: Request, _res: Response, next: NextFunction) => {
        next();
      });

    (checkRequiredPermissions as jest.Mock)
      .mockImplementationOnce((_req: Request, _res: Response, next: NextFunction) => {
        next();
      });

    (client.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ filename }] })
      .mockResolvedValueOnce({});

    const res = await request(server)
      .post('/delete-sound')
      .send(`id=${soundId}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toEqual(200);
    expect(client.query).toHaveBeenCalledWith(
      'SELECT filename FROM sounds WHERE id=$1',
      [soundId],
    );
    expect(client.query).toHaveBeenCalledWith(
      'DELETE FROM sounds WHERE id=$1',
      [soundId],
    );
  });

  test('should upload sound and create a new sound entry', async () => {
    const fileData = Buffer.from('test-data');

    const mockFile: UploadedFile = {
      data: fileData,
      name: 'sound.mp4',
      tempFilePath: '',
      truncated: false,
      size: fileData.length,
      md5: 'md5-hash',
      mv: () => Promise.resolve(),
      mimetype: 'audio/mp4',
      encoding: 'utf-8',
    };

    const soundData = {
      lat: '37.7749',
      lng: '-122.4194',
      description: 'Test sound',
    };

    (validateAccessToken as jest.Mock)
      .mockImplementationOnce((_req: Request, _res: Response, next: NextFunction) => {
        next();
      });

    (checkRequiredPermissions as jest.Mock)
      .mockImplementationOnce((_req: Request, _res: Response, next: NextFunction) => {
        next();
      });

    (client.query as jest.Mock)
      .mockResolvedValueOnce(
        { rows: [{ id: 1, ...soundData, filename: blobName, url: `https://example.com/${blobName}`, enabled: true }] },
      );

    const res = await request(server)
      .post('/sound')
      .field('lat', soundData.lat)
      .field('lng', soundData.lng)
      .field('description', soundData.description)
      .attach('file', mockFile.data, 'sound.mp4')
      .set('Content-Type', 'multipart/form-data');

    expect(res.status).toEqual(200);
    expect(res.body)
      .toMatchObject({ ...soundData, filename: blobName, url: `https://example.com/${blobName}`, enabled: true });

    expect(mockUpload).toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith(
      `INSERT INTO sounds(
        latitude,
        longitude,
        filename,
        url,
        description,
        enabled
      ) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
      [soundData.lat, soundData.lng, blobName, `https://example.com/${blobName}`, soundData.description, true],
    );
  });
});
