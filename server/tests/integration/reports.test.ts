import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { resetMockStore, seedReport } from '../fixtures/supabase.mock';
import { makeCreateReportBody } from '../fixtures/reports.fixtures';

// Mock must be imported before app
import '../fixtures/supabase.mock';
import app from '../../src/app';

describe('POST /api/reports', () => {
  beforeEach(() => resetMockStore());

  it('1. creates a valid report and returns 201', async () => {
    const body = makeCreateReportBody();
    const res = await request(app)
      .post('/api/reports')
      .set('X-Dev-Role', 'field_worker')
      .send(body)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.client_report_id).toBe(body.client_report_id);
    expect(res.body.data.category).toBe(body.category);
    expect(res.body.data.location).toBe(body.location);
    expect(res.body.data.status).toBe('Draft');
    expect(res.body.data.version).toBe(1);
  });

  it('2. rejects missing required fields with 400', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('X-Dev-Role', 'field_worker')
      .send({ category: 'Water Point' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeInstanceOf(Array);
  });

  it('2b. rejects invalid priority with 400', async () => {
    const body = makeCreateReportBody({ priority: 'urgent_invalid' });
    const res = await request(app)
      .post('/api/reports')
      .set('X-Dev-Role', 'field_worker')
      .send(body)
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('2c. rejects description shorter than 10 chars with 400', async () => {
    const body = makeCreateReportBody({ description: 'Too short' });
    const res = await request(app)
      .post('/api/reports')
      .set('X-Dev-Role', 'field_worker')
      .send(body)
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('2d. rejects invalid UUID client_report_id with 400', async () => {
    const body = makeCreateReportBody({ client_report_id: 'not-a-uuid' });
    const res = await request(app)
      .post('/api/reports')
      .set('X-Dev-Role', 'field_worker')
      .send(body)
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('3. prevents duplicate reports by client_report_id', async () => {
    const clientId = uuidv4();
    const body = makeCreateReportBody({ client_report_id: clientId });

    // Seed an existing report with that client_report_id
    const existing = seedReport({ client_report_id: clientId });

    const res = await request(app)
      .post('/api/reports')
      .set('X-Dev-Role', 'field_worker')
      .send(body)
      .expect(409);

    expect(res.body.error.code).toBe('DUPLICATE');
    expect(res.body.error.details.existing_report_id).toBe(existing.id);
  });
});

describe('GET /api/reports', () => {
  beforeEach(() => {
    resetMockStore();
    seedReport({ status: 'Draft', category: 'Water Point' });
    seedReport({ status: 'Submitted', category: 'Equipment Damage' });
    seedReport({ status: 'Resolved', category: 'Water Point' });
  });

  it('returns paginated list of reports', async () => {
    const res = await request(app)
      .get('/api/reports')
      .set('X-Dev-Role', 'field_worker')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('page', 1);
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get('/api/reports?status=Draft')
      .set('X-Dev-Role', 'field_worker')
      .expect(200);

    expect(res.body.data.every((r: { status: string }) => r.status === 'Draft')).toBe(true);
  });
});

describe('GET /api/reports/:id', () => {
  beforeEach(() => resetMockStore());

  it('returns a report with its activity', async () => {
    const report = seedReport();
    const res = await request(app)
      .get(`/api/reports/${report.id}`)
      .set('X-Dev-Role', 'field_worker')
      .expect(200);

    expect(res.body.data.id).toBe(report.id);
    expect(res.body.data.activity).toBeInstanceOf(Array);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .get(`/api/reports/${uuidv4()}`)
      .set('X-Dev-Role', 'field_worker')
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid UUID param', async () => {
    const res = await request(app)
      .get('/api/reports/not-a-uuid')
      .set('X-Dev-Role', 'field_worker')
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /api/reports/:id', () => {
  beforeEach(() => resetMockStore());

  it('updates editable fields on a draft report', async () => {
    const report = seedReport({ status: 'Draft', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}`)
      .set('X-Dev-Role', 'field_worker')
      .send({
        location: 'Updated Location, Sector 4',
        description: 'Updated description that is long enough for validation.',
        version: 1,
      })
      .expect(200);

    expect(res.body.data.version).toBe(2);
  });

  it('rejects update if version conflicts', async () => {
    const report = seedReport({ status: 'Draft', version: 2 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}`)
      .set('X-Dev-Role', 'field_worker')
      .send({
        description: 'Updated description that is long enough for validation.',
        version: 1,
      })
      .expect(409);

    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('10. returns 409 on version conflict', async () => {
    const report = seedReport({ status: 'Draft', version: 5 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}`)
      .set('X-Dev-Role', 'field_worker')
      .send({ description: 'Valid description that is long enough to pass.', version: 3 })
      .expect(409);

    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.details.serverVersion).toBe(5);
  });
});

describe('DELETE /api/reports/:id', () => {
  beforeEach(() => resetMockStore());

  it('deletes a draft report', async () => {
    const report = seedReport({ status: 'Draft' });
    const res = await request(app)
      .delete(`/api/reports/${report.id}`)
      .set('X-Dev-Role', 'coordinator')
      .expect(200);

    expect(res.body.data.deleted).toBe(true);
  });

  it('refuses to delete a submitted report', async () => {
    const report = seedReport({ status: 'Submitted' });
    const res = await request(app)
      .delete(`/api/reports/${report.id}`)
      .set('X-Dev-Role', 'coordinator')
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('refuses to delete a resolved report', async () => {
    const report = seedReport({ status: 'Resolved' });
    const res = await request(app)
      .delete(`/api/reports/${report.id}`)
      .set('X-Dev-Role', 'coordinator')
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
