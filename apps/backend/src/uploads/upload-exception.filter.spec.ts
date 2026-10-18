import { PayloadTooLargeException } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { MulterError } from 'multer';

import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { UploadMulterErrorFilter } from './upload-exception.filter';

function multerError(code: string): MulterError {
  // Multer 2.x types the constructor narrowly; build the runtime shape directly.
  return Object.assign(new Error('upload failed'), { code }) as unknown as MulterError;
}

describe('UploadMulterErrorFilter', () => {
  const filter = new UploadMulterErrorFilter();
  const host = {} as ArgumentsHost;

  it('maps LIMIT_FILE_SIZE to a 413 with the envelope-capable exception', () => {
    const delegateSpy = jest.spyOn(filter.delegate, 'catch').mockImplementation(() => {});
    filter.catch(multerError('LIMIT_FILE_SIZE'), host);
    expect(delegateSpy).toHaveBeenCalledTimes(1);
    const exception = delegateSpy.mock.calls[0][0] as PayloadTooLargeException;
    expect(exception.getStatus()).toBe(413);
    expect(exception.message).toBe('File exceeds the maximum allowed size');
    jest.restoreAllMocks();
  });

  it('treats other multer codes as 413 multipart failures', () => {
    const delegateSpy = jest.spyOn(filter.delegate, 'catch').mockImplementation(() => {});
    filter.catch(multerError('LIMIT_UNEXPECTED_FILE'), host);
    const exception = delegateSpy.mock.calls[0][0] as PayloadTooLargeException;
    expect(exception.getStatus()).toBe(413);
    expect(exception.message).toBe('Multipart error: LIMIT_UNEXPECTED_FILE');
    jest.restoreAllMocks();
  });

  it('delegates the envelope rendering to the shared HttpExceptionFilter', () => {
    const delegateSpy = jest.spyOn(filter.delegate, 'catch').mockImplementation(() => {});
    filter.catch(multerError('LIMIT_FILE_SIZE'), host);
    expect(delegateSpy.mock.calls[0][1]).toBe(host);
    jest.restoreAllMocks();
  });

  it('keeps the single-sourced error contract (same delegate instance per filter)', () => {
    expect(filter.delegate).toBeInstanceOf(HttpExceptionFilter);
  });
});
