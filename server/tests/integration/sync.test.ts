import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { resetMockStore, seedReport } from '../fixtures/supabase.mock';
import { makeCreateReportBody } from '../fixtures/reports.fixtures';

import '../fixtures/supabase.mock';
import app from '../../src/app';

describe('POST /api/sync/reports — Batch Synchronization (7)', () => {
  beforeEach(() => resetMockStore());

  it('7. syncs a valid batch of reports', async () => {
    const reports = [
      makeCreateReportBody(),
      makeCreateReportBody(),
    ];

    const res = await request(app)
      .post('/api/sync/reports')
      .set('X-Dev-Role', 'field_worker')
      .send({ reports })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.created).toBe(2);
    expect(res.body.data.failed).toBe(0);
    expect(res.body.data.results).toHaveLength(2);
    res.body.data.results.forEach((r: { status: string; server_report_id: string }) => {
      expect(r.status).toBe('created');
      expect(r.server_report_id).toBeTruthy();
    });
  });

  it('8. retry with same batch is idempotent (duplicates)', async () => {
    const reports = [makeCreateReportBody(), makeCreateReportBody()];

    // First sync
    await request(app)
      .post('/api/sync/reports')
      .set('X-Dev-Role', 'field_worker')
      .send({ reports });

    // Retry with same batch
    const res = await request(app)
      .post('/api/sync/reports')
      .set('X-Dev-Role', 'field_worker')
      .send({ reports })
      .expect(200);

    expect(res.body.data.duplicates).toBe(2);
    expect(res.body.data.created).toBe(0);
    res.body.data.results.forEach((r: { status: string }) => {
      expect(r.status).toBe('duplicate');
    });
  });

  it('9. partial sync failure — succeeds preserve, failures reported', async () => {
    // Pre-seed a report so its client_report_id causes a duplicate (not a failure)
    // We test partial by sending one valid + one pre-existing
    const existingClientId = uuidv4();
    seedReport({ client_report_id: existingClientId });

    const reports = [
      makeCreateReportBody(), // new — should create
      makeCreateReportBody({ client_report_id: existingClientId }), // duplicate
    ];

    const res = await request(app)
      .post('/api/sync/reports')
      .set('X-Dev-Role', 'field_worker')
      .send({ reports })
      .expect(200);

    expect(res.body.data.created).toBe(1);
    expect(res.body.data.duplicates).toBe(1);
    expect(res.body.data.failed).toBe(0);
  });

  it('validates individual reports in a batch', async () => {
    const reports = [
      makeCreateReportBody(), // valid
      { client_report_id: 'not-a-uuid', title: 'x' }, // invalid
    ];

    const res = await request(app)
      .post('/api/sync/reports')
      .set('X-Dev-Role', 'field_worker')
      .send({ reports })
      .expect(400); // batch schema fails if any item is invalid

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects empty batch', async () => {
    const res = await request(app)
      .post('/api/sync/reports')
      .set('X-Dev-Role', 'field_worker')
      .send({ reports: [] })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects batch over 100 items', async () => {
    const reports = Array.from({ length: 101 }, () => makeCreateReportBody());
    const res = await request(app)
      .post('/api/sync/reports')
      .set('X-Dev-Role', 'field_worker')
      .send({ reports })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

