import { ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { v2 as cloudinary } from 'cloudinary';
import { ProductImagesService } from './product-images.service.js';

vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn(),
    },
  },
}));

describe('ProductImagesService', () => {
  const credentials = {
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-api-key',
    CLOUDINARY_API_SECRET: 'test-api-secret',
  };

  const createService = (config: Record<string, string | undefined>) =>
    new ProductImagesService({
      get: vi.fn((key: string) => config[key]),
    } as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('explains provider upload errors without exposing credentials', async () => {
    vi.mocked(cloudinary.uploader.upload_stream).mockImplementation(
      ((_options: unknown, callback: (error: unknown) => void) => {
        queueMicrotask(() => {
          callback({
            message: 'Invalid signature for test-api-secret on test-cloud',
            http_code: 401,
          });
        });
        return { end: vi.fn() } as never;
      }) as never,
    );
    const service = createService(credentials);

    await expect(service.upload(Buffer.from('image'))).rejects.toMatchObject({
      status: 502,
      response: expect.objectContaining({
        message:
          'Cloudinary upload failed (HTTP 401): Invalid signature for [redacted] on [redacted]',
      }),
    });
  });

  it('reports missing Cloudinary configuration without calling the provider', async () => {
    const service = createService({});

    await expect(service.upload(Buffer.from('image'))).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
  });

  it('returns the secure URL after a successful provider upload', async () => {
    vi.mocked(cloudinary.uploader.upload_stream).mockImplementation(
      ((_options: unknown, callback: (error: null, result: { secure_url: string }) => void) => {
        queueMicrotask(() => {
          callback(null, { secure_url: 'https://res.cloudinary.com/test/image/upload/example.jpg' });
        });
        return { end: vi.fn() } as never;
      }) as never,
    );
    const service = createService(credentials);

    await expect(service.upload(Buffer.from('image'))).resolves.toEqual({
      url: 'https://res.cloudinary.com/test/image/upload/example.jpg',
    });
  });
});
