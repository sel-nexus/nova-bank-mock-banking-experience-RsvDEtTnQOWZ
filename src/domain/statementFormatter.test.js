import { describe, expect, it } from 'vitest';
import { serializeStatement } from './statementFormatter.js';
import { createStatementBlob } from '../services/statementDownload.js';

describe('statementFormatter', () => {
  it('serializes a statement with a masked account header and never exposes the full account number', () => {
    const fullAccountNumber = '100012345678';
    const statement = {
      title: 'Everyday Checking Statement',
      account: {
        name: 'Everyday Checking',
        accountNumber: fullAccountNumber,
        maskedAccountNumber: '•••• 5678',
      },
      referenceDate: '2026-10-16',
      transactions: [],
    };

    const text = serializeStatement(statement);

    expect(text).toContain('Everyday Checking Statement');
    expect(text).toContain('Account: Everyday Checking');
    expect(text).toContain('Account number: •••• 5678');
    expect(text).not.toContain(fullAccountNumber);
  });

  it('serializes only the filtered visible rows when visible rows are provided', () => {
    const text = serializeStatement(
      {
        account: {
          name: 'Everyday Checking',
          maskedAccountNumber: '•••• 5678',
        },
        transactions: [
          {
            date: '2026-10-15',
            description: 'Payroll deposit',
            amount: 4200,
            direction: 'credit',
            status: 'completed',
            currency: 'USD',
          },
          {
            date: '2026-10-03',
            description: 'Rent payment',
            amount: 1850,
            direction: 'debit',
            status: 'completed',
            currency: 'USD',
          },
        ],
      },
      {
        visibleRows: [
          {
            date: '2026-10-03',
            description: 'Rent payment',
            amount: 1850,
            direction: 'debit',
            status: 'completed',
            currency: 'USD',
          },
        ],
      },
    );

    expect(text).toContain('Rent payment');
    expect(text).not.toContain('Payroll deposit');
    expect(text).toContain('Oct 3, 2026 | Rent payment | -$1,850.00 | completed');
  });

  it('uses the supplied reference date and preserves credit and debit direction labels', () => {
    const text = serializeStatement({
      account: {
        name: 'Growth Savings',
        maskedAccountNumber: '•••• 4321',
      },
      referenceDate: '2026-10-16',
      transactions: [
        {
          date: '2026-10-15',
          description: 'Payroll deposit',
          amount: 4200,
          direction: 'credit',
          status: 'completed',
          currency: 'USD',
        },
        {
          date: '2026-10-14',
          description: 'Coffee and pastry',
          amount: 5.75,
          direction: 'debit',
          status: 'completed',
          currency: 'USD',
        },
      ],
    });

    expect(text).toContain('Reference date: 2026-10-16');
    expect(text).toContain(
      'Oct 15, 2026 | Payroll deposit | +$4,200.00 | completed',
    );
    expect(text).toContain(
      'Oct 14, 2026 | Coffee and pastry | -$5.75 | completed',
    );
  });

  it('uses the statement download filename convention and appends a text extension', async () => {
    const result = createStatementBlob(
      {
        account: {
          name: 'Everyday Checking',
          maskedAccountNumber: '•••• 5678',
        },
        transactions: [],
      },
      {
        filename: 'Everyday Checking Statement',
      },
    );

    expect(result.success).toBe(true);
    expect(result.data?.filename).toBe('everyday-checking-statement.txt');
    expect(result.data?.mimeType).toBe('text/plain;charset=utf-8');
    expect(result.data?.text).toContain('Account number: •••• 5678');

    expect(result.data?.text).toContain('Account: Everyday Checking');
  });

  it('renders a safe empty transaction row when no statement rows are available', () => {
    const text = serializeStatement({
      account: {
        name: 'Growth Savings',
        maskedAccountNumber: '•••• 4321',
      },
      transactions: [],
    });

    expect(text).toContain('Date | Description | Amount | Status');
    expect(text).toContain('— | No transactions | — | —');
  });
});