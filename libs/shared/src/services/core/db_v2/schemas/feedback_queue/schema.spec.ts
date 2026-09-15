import { getValidator } from 'rxdb/plugins/validate-ajv';

import { FEEDBACK_QUEUE_SCHEMA } from './index';

const validate = getValidator(FEEDBACK_QUEUE_SCHEMA);

const validDoc = {
  id: 'abc',
  type: 'feedback',
  comment: 'Looks great',
  device_info: { app_version: '1.0' },
  status: 'pending',
  retry_count: 0,
  created_at: '2026-01-01T00:00:00.000Z',
};

describe('feedback_queue schema', () => {
  it('accepts a valid document', () => {
    const result = validate(validDoc);
    expect(result).toEqual([]);
  });

  it('accepts a bug_report type', () => {
    const result = validate({ ...validDoc, type: 'bug_report' });
    expect(result).toEqual([]);
  });

  it('rejects a document missing required comment', () => {
    const { comment, ...rest } = validDoc;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = validate(rest as any);
    expect(result).not.toEqual([]);
  });

  it('rejects a document missing required type', () => {
    const { type, ...rest } = validDoc;
    const result = validate(rest as any);
    expect(result).not.toEqual([]);
  });
});
