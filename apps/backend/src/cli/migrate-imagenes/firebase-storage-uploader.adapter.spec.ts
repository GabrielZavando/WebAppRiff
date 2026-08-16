import { FirebaseStorageUploader } from './firebase-storage-uploader.adapter';

const mockFile = {
  save: jest.fn().mockResolvedValue(undefined),
  makePublic: jest.fn().mockResolvedValue(undefined),
};
const mockBucket = {
  name: 'my-bucket',
  file: jest.fn().mockReturnValue(mockFile),
};
const mockStorage = { bucket: jest.fn().mockReturnValue(mockBucket) };

jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn(() => mockStorage),
}));

describe('FirebaseStorageUploader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads and returns the public URL', async () => {
    const uploader = FirebaseStorageUploader.fromApp({} as never, 'my-bucket');
    const url = await uploader.upload(Buffer.from('img'), 'productos/prod-001/1.webp');

    expect(mockBucket.file).toHaveBeenCalledWith('productos/prod-001/1.webp');
    expect(mockFile.save).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({
        metadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000' },
      }),
    );
    expect(mockFile.makePublic).toHaveBeenCalled();
    expect(url).toBe('https://storage.googleapis.com/my-bucket/productos/prod-001/1.webp');
  });
});
