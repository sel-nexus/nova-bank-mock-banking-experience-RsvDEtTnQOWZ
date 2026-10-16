import React, { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { downloadStatement } from '../../services/statementDownload.js';
import { useToast } from '../../hooks/useToast.js';

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getFilename(options) {
  return (
    options.filename ||
    options.fileName ||
    options.downloadName ||
    'nova-bank-demo-statement.txt'
  );
}

/**
 * Renders an accessible local statement download action for filtered activity.
 *
 * @param {{
 *   statement?: Object,
 *   account?: Object,
 *   transactions?: Object[],
 *   filteredTransactions?: Object[],
 *   visibleRows?: Object[],
 *   rows?: Object[],
 *   filters?: Object,
 *   filename?: string,
 *   fileName?: string,
 *   downloadName?: string,
 *   title?: string,
 *   label?: string,
 *   children?: React.ReactNode,
 *   disabled?: boolean,
 *   className?: string,
 *   onDownload?: Function,
 *   onSuccess?: Function,
 *   onError?: Function
 * }} props
 * @returns {JSX.Element}
 */
function StatementDownloadButton({
  statement,
  account,
  transactions,
  filteredTransactions,
  visibleRows,
  rows,
  filters,
  filename,
  fileName,
  downloadName,
  title,
  label,
  children,
  disabled,
  className,
  onDownload,
  onSuccess,
  onError,
}) {
  const statusId = useId();
  const { success, error } = useToast();
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleDownload = () => {
    const providedRows =
      Array.isArray(visibleRows)
        ? visibleRows
        : Array.isArray(filteredTransactions)
          ? filteredTransactions
          : Array.isArray(rows)
            ? rows
            : Array.isArray(transactions)
              ? transactions
              : undefined;

    const statementData = {
      ...(isObject(statement) ? statement : {}),
      ...(isObject(account) ? { account } : {}),
      ...(Array.isArray(transactions) ? { transactions } : {}),
      ...(filters !== undefined ? { filters } : {}),
      ...(title ? { title } : {}),
    };

    const downloadOptions = {
      ...(filename ? { filename } : {}),
      ...(fileName ? { fileName } : {}),
      ...(downloadName ? { downloadName } : {}),
      ...(isObject(account) ? { account } : {}),
      ...(filters !== undefined ? { filters } : {}),
      ...(providedRows ? { visibleRows: providedRows } : {}),
    };

    try {
      const result = downloadStatement(statementData, downloadOptions);

      if (result?.success) {
        const resolvedFilename =
          result.data?.filename || getFilename(downloadOptions);
        const message = `Statement downloaded locally as ${resolvedFilename}. This is synthetic demo data.`;

        setIsError(false);
        setStatusMessage(message);
        success(message);
        onSuccess?.(result);
      } else {
        const message =
          result?.error?.message ||
          'The statement could not be downloaded locally.';

        setIsError(true);
        setStatusMessage(message);
        error(message);
        onError?.(result);
      }

      onDownload?.(result);
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : 'The statement could not be downloaded locally.';
      const result = {
        success: false,
        error: {
          code: 'STATEMENT_DOWNLOAD_FAILED',
          message,
        },
      };

      setIsError(true);
      setStatusMessage(message);
      error(message);
      onError?.(result);
      onDownload?.(result);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled}
        aria-describedby={statusMessage ? statusId : undefined}
        className={[
          'inline-flex min-h-11 items-center justify-center rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30 disabled:cursor-not-allowed disabled:opacity-60',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        data-testid="statement-download-button"
      >
        {children || label}
      </button>

      {statusMessage && (
        <p
          id={statusId}
          role={isError ? 'alert' : 'status'}
          aria-live={isError ? 'assertive' : 'polite'}
          className={[
            'text-sm',
            isError ? 'text-nova-midnight' : 'text-nova-slate',
          ].join(' ')}
        >
          {statusMessage}
        </p>
      )}
    </div>
  );
}

StatementDownloadButton.propTypes = {
  statement: PropTypes.object,
  account: PropTypes.object,
  transactions: PropTypes.arrayOf(PropTypes.object),
  filteredTransactions: PropTypes.arrayOf(PropTypes.object),
  visibleRows: PropTypes.arrayOf(PropTypes.object),
  rows: PropTypes.arrayOf(PropTypes.object),
  filters: PropTypes.object,
  filename: PropTypes.string,
  fileName: PropTypes.string,
  downloadName: PropTypes.string,
  title: PropTypes.string,
  label: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  onDownload: PropTypes.func,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};

StatementDownloadButton.defaultProps = {
  statement: {},
  account: undefined,
  transactions: undefined,
  filteredTransactions: undefined,
  visibleRows: undefined,
  rows: undefined,
  filters: undefined,
  filename: '',
  fileName: '',
  downloadName: '',
  title: '',
  label: 'Download statement',
  children: undefined,
  disabled: false,
  className: '',
  onDownload: undefined,
  onSuccess: undefined,
  onError: undefined,
};

export { StatementDownloadButton };
export default StatementDownloadButton;