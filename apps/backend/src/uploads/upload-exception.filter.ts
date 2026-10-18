import { ArgumentsHost, Catch, ExceptionFilter, PayloadTooLargeException } from '@nestjs/common';
import { MulterError } from 'multer';

import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

/**
 * Scoped translation of multipart engine errors thrown before the handler
 * runs: the gauge-declared size overflow (`LIMIT_FILE_SIZE`) MUST surface as a
 * `413` envelope, not as a generic 500. Any other multer code keeps the
 * generic message under the same `413` treatment (client-side multipart
 * failure). Delegates the envelope shape to the global HttpExceptionFilter so
 * the error contract stays single-sourced.
 */
@Catch(MulterError)
export class UploadMulterErrorFilter implements ExceptionFilter<MulterError> {
  delegate = new HttpExceptionFilter();

  catch(exception: MulterError, host: ArgumentsHost): void {
    const message =
      exception.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds the maximum allowed size'
        : `Multipart error: ${exception.code}`;
    this.delegate.catch(new PayloadTooLargeException(message), host);
  }
}
