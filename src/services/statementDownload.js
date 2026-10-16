import { serializeStatement } from '../domain/statementFormatter.js';

const DEFAULT_FILENAME = 'nova-bank-demo-statement.txt';
const STATEMENT_MIME_TYPE = 'text/plain;charset=utf-8';
const MAX_FILENAME_LENGTH = 120;

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptions(options) {
  if (typeof options === 'string') {
    return { filename: options };
  }

  return isObject(options) ? options : {};
}

function sanitizeFilename(value) {
  const normalizedValue = normalizeText(value)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, MAX_FILENAME_LENGTH);

  if (!normalizedValue) {
    return DEFAULT_FILENAME;
  }

  return normalizedValue.toLowerCase().endsWith('.txt')
    ? normalizedValue
    : `${normalizedValue}.txt`;
}

function resolveFilename(options) {
  return sanitizeFilename(
    options.filename ||
      options.fileName ||
      options.downloadName ||
      DEFAULT_FILENAME,
  );
}

function createFeedback(status, values = {}) {
  return {
    status,
    ...values,
  };
}

function notifyFeedback(callback, feedback) {
  if (typeof callback !== 'function') {
    return;
  }

  try {
    callback(feedback);
  } catch {
    // Feedback handlers must not prevent the local download operation.
  }
}

/**
 * Creates a text Blob for a statement.
 *
 * @param {Object} statement
 * @param {Object} [options]
 * @returns {{success: boolean, data?: {blob: Blob, filename: string, mimeType: string, text: string}, error?: Object}}
 */
export function createStatementBlob(statement = {}, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const filename = resolveFilename(normalizedOptions);
  const text =
    typeof normalizedOptions.content === 'string'
      ? normalizedOptions.content
      : serializeStatement(statement, normalizedOptions);

  if (typeof globalThis.Blob !== 'function') {
    return {
      success: false,
      error: {
        code: 'BLOB_UNAVAILABLE',
        message: 'Statement downloads are not supported in this environment.',
      },
    };
  }

  try {
    const blob = new globalThis.Blob([text], {
      type: STATEMENT_MIME_TYPE,
    });

    return {
      success: true,
      data: {
        blob,
        filename,
        mimeType: STATEMENT_MIME_TYPE,
        text,
      },
    };
  } catch {
    return {
      success: false,
      error: {
        code: 'BLOB_CREATION_FAILED',
        message: 'The statement file could not be created.',
      },
    };
  }
}

/**
 * Downloads a serialized statement through a local browser Blob URL.
 *
 * @param {Object} statement
 * @param {Object|string} [options]
 * @returns {{success: boolean, data?: Object, feedback?: Object, error?: Object, message?: string}}
 */
export function downloadStatement(statement = {}, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const onFeedback = normalizedOptions.onFeedback;

  notifyFeedback(
    onFeedback,
    createFeedback('started', {
      operation: 'statement-download',
    }),
  );

  const blobResult = createStatementBlob(statement, normalizedOptions);

  if (!blobResult.success) {
    const feedback = createFeedback('failed', {
      operation: 'statement-download',
      error: blobResult.error,
    });
    notifyFeedback(onFeedback, feedback);

    return {
      ...blobResult,
      feedback,
    };
  }

  const { blob, filename, mimeType, text } = blobResult.data;
  const urlApi = globalThis.URL;
  const documentObject = globalThis.document;

  if (
    !urlApi ||
    typeof urlApi.createObjectURL !== 'function' ||
    typeof urlApi.revokeObjectURL !== 'function' ||
    !documentObject ||
    typeof documentObject.createElement !== 'function'
  ) {
    const error = {
      code: 'DOWNLOAD_UNAVAILABLE',
      message: 'Local statement downloads are not supported in this environment.',
    };
    const feedback = createFeedback('failed', {
      operation: 'statement-download',
      error,
    });
    notifyFeedback(onFeedback, feedback);

    return {
      success: false,
      error,
      feedback,
    };
  }

  let objectUrl = null;
  let anchor = null;

  try {
    objectUrl = urlApi.createObjectURL(blob);
    anchor = documentObject.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.setAttribute('download', filename);
    anchor.setAttribute('aria-hidden', 'true');

    if (documentObject.body) {
      documentObject.body.appendChild(anchor);
    }

    if (typeof anchor.click !== 'function') {
      throw new Error('Download action is unavailable.');
    }

    anchor.click();

    const data = {
      filename,
      mimeType,
      size: blob.size,
      text,
      simulated: true,
    };
    const feedback = createFeedback('completed', {
      operation: 'statement-download',
      filename,
      size: blob.size,
    });

    notifyFeedback(onFeedback, feedback);

    return {
      success: true,
      data,
      feedback,
      message: 'Statement download started locally.',
    };
  } catch {
    const error = {
      code: 'DOWNLOAD_FAILED',
      message: 'The statement file could not be downloaded.',
    };
    const feedback = createFeedback('failed', {
      operation: 'statement-download',
      error,
    });
    notifyFeedback(onFeedback, feedback);

    return {
      success: false,
      error,
      feedback,
    };
  } finally {
    if (anchor && typeof anchor.remove === 'function') {
      anchor.remove();
    } else if (anchor && anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }

    if (objectUrl) {
      try {
        urlApi.revokeObjectURL(objectUrl);
      } catch {
        // URL cleanup must not change the download result.
      }
    }
  }
}

/**
 * Alias for downloading a statement file locally.
 *
 * @param {Object} statement
 * @param {Object|string} [options]
 * @returns {{success: boolean, data?: Object, feedback?: Object, error?: Object, message?: string}}
 */
export function downloadStatementFile(statement = {}, options = {}) {
  return downloadStatement(statement, options);
}

/**
 * Simulates statement download feedback without requiring browser APIs.
 *
 * @param {Object} statement
 * @param {Object|string} [options]
 * @returns {{success: boolean, data?: Object, feedback?: Object, error?: Object, message?: string}}
 */
export function simulateStatementDownload(statement = {}, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const blobResult = createStatementBlob(statement, normalizedOptions);

  if (!blobResult.success) {
    return blobResult;
  }

  const { blob, filename, mimeType, text } = blobResult.data;
  const feedback = createFeedback('completed', {
    operation: 'statement-download',
    filename,
    size: blob.size,
    simulated: true,
  });

  notifyFeedback(normalizedOptions.onFeedback, feedback);

  return {
    success: true,
    data: {
      filename,
      mimeType,
      size: blob.size,
      text,
      simulated: true,
    },
    feedback,
    message: 'Statement download simulated locally.',
  };
}

export const statementDownloadService = Object.freeze({
  createStatementBlob,
  downloadStatement,
  downloadStatementFile,
  simulateStatementDownload,
});

export default statementDownloadService;