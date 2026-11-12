import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { resetMockStore, seedReport } from '../fixtures/supabase.mock';

import '../fixtures/supabase.mock';
import app from '../../src/app';

describe('PATCH /api/reports/:id/status — Valid transitions (4)', () => {
  beforeEach(() => resetMockStore());

  it('4a. Draft → Submitted', async () => {
    const report = seedReport({ status: 'Draft', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}/status`)
      .set('X-Dev-Role', 'field_worker')
      .send({ status: 'Submitted', version: 1 })
      .expect(200);

    expect(res.body.data.status).toBe('Submitted');
    expect(res.body.data.version).toBe(2);
  });

  it('4b. Submitted → Assigned (coordinator)', async () => {
    const report = seedReport({ status: 'Submitted', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}/status`)
      .set('X-Dev-Role', 'coordinator')
      .send({ status: 'Assigned', version: 1 })
      .expect(200);

    expect(res.body.data.status).toBe('Assigned');
  });

  it('4c. Assigned → In Progress (coordinator)', async () => {
    const report = seedReport({ status: 'Assigned', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}/status`)
      .set('X-Dev-Role', 'coordinator')
      .send({ status: 'In Progress', version: 1 })
      .expect(200);

    expect(res.body.data.status).toBe('In Progress');
  });

  it('4d. In Progress → Resolved', async () => {
    const report = seedReport({ status: 'In Progress', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}/status`)
      .set('X-Dev-Role', 'coordinator')
      .send({ status: 'Resolved', version: 1 })
      .expect(200);

    expect(res.body.data.status).toBe('Resolved');
  });

  it('4e. Resolved → In Progress (explicit reopen)', async () => {
    const report = seedReport({ status: 'Resolved', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}/status`)
      .set('X-Dev-Role', 'coordinator')
      .send({ status: 'In Progress', reopen: true, version: 1 })
      .expect(200);

    expect(res.body.data.status).toBe('In Progress');
  });
});

describe('PATCH /api/reports/:id/status — Invalid transitions (5)', () => {
  beforeEach(() => resetMockStore());

  it('5a. Draft → Resolved is invalid', async () => {
    const report = seedReport({ status: 'Draft', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}/status`)
      .set('X-Dev-Role', 'coordinator')
      .send({ status: 'Resolved', version: 1 })
      .expect(422);

    expect(res.body.error.code).toBe('INVALID_TRANSITION');
    expect(res.body.error.details.allowed).toContain('Submitted');
  });

  it('5b. Rejected → Submitted is invalid', async () => {
    const report = seedReport({ status: 'Rejected', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}/status`)
      .set('X-Dev-Role', 'coordinator')
      .send({ status: 'Submitted', version: 1 })
      .expect(422);

    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('5c. Submitted → Draft is invalid', async () => {
    const report = seedReport({ status: 'Submitted', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}/status`)
      .set('X-Dev-Role', 'coordinator')
      .send({ status: 'Draft', version: 1 })
      .expect(422);

    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('5d. rejection without reason returns 403', async () => {
    const report = seedReport({ status: 'Submitted', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}/status`)
      .set('X-Dev-Role', 'coordinator')
      .send({ status: 'Rejected', version: 1 }) // no rejection_reason
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('5e. field_worker cannot reject a report', async () => {
    const report = seedReport({ status: 'Submitted', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}/status`)
      .set('X-Dev-Role', 'field_worker')
      .send({ status: 'Rejected', rejection_reason: 'Not valid', version: 1 })
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('PATCH /api/reports/:id/assign — Assignment (6)', () => {
  beforeEach(() => resetMockStore());

  it('6. coordinator can assign a submitted report', async () => {
    const report = seedReport({ status: 'Submitted', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}/assign`)
      .set('X-Dev-Role', 'coordinator')
      .send({ assigned_to: 'worker-123', version: 1 })
      .expect(200);

    expect(res.body.data.assigned_to).toBe('worker-123');
    expect(res.body.data.status).toBe('Assigned');
  });

  it('6b. field_worker cannot assign a report', async () => {
    const report = seedReport({ status: 'Submitted', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}/assign`)
      .set('X-Dev-Role', 'field_worker')
      .send({ assigned_to: 'worker-123', version: 1 })
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('6c. cannot assign a draft report', async () => {
    const report = seedReport({ status: 'Draft', version: 1 });
    const res = await request(app)
      .patch(`/api/reports/${report.id}/assign`)
      .set('X-Dev-Role', 'coordinator')
      .send({ assigned_to: 'worker-123', version: 1 })
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('GET /api/reports/:id/activity — Activity history (11)', () => {
  beforeEach(() => resetMockStore());

  it('11. returns activity after creating a report', async () => {
    const report = seedReport({ status: 'Draft' });

    // Status change creates activity
    await request(app)
      .patch(`/api/reports/${report.id}/status`)
      .set('X-Dev-Role', 'field_worker')
      .send({ status: 'Submitted', version: 1 });

    const res = await request(app)
      .get(`/api/reports/${report.id}/activity`)
      .set('X-Dev-Role', 'field_worker')
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 404 activity for unknown report', async () => {
    const res = await request(app)
      .get(`/api/reports/${uuidv4()}/activity`)
      .set('X-Dev-Role', 'field_worker')
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
