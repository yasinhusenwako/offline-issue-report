// ─── Supabase mock ────────────────────────────────────────────────────────────
// Mocks @supabase/supabase-js so tests run without a real DB.

import { makeReport, makeActivity } from '../fixtures/reports.fixtures';
import { v4 as uuidv4 } from 'uuid';

// In-memory store per test run
let store: Record<string, Record<string, unknown>> = {};
let activityStore: Record<string, unknown>[] = [];
let syncStore: Record<string, unknown>[] = [];

export function resetMockStore(): void {
  store = {};
  activityStore = [];
  syncStore = [];
}

export function seedReport(overrides = {}): ReturnType<typeof makeReport> {
  const report = makeReport(overrides);
  store[report.id] = report as unknown as Record<string, unknown>;
  return report;
}

// Mock builder
function buildQueryBuilder(tableName: string) {
  let _filter: Record<string, unknown> = {};
  let _insertData: Record<string, unknown> | null = null;
  let _updateData: Record<string, unknown> | null = null;
  let _isMaybeSingle = false;
  let _isSingle = false;
  let _isDelete = false;
  let _selectCount = false;
  let _rangeFrom = 0;
  let _rangeTo = 100;

  const qb = {
    select: (_cols?: string, opts?: { count?: string }) => {
      if (opts?.count) _selectCount = true;
      return qb;
    },
    insert: (data: Record<string, unknown>) => {
      _insertData = data;
      return qb;
    },
    update: (data: Record<string, unknown>) => {
      _updateData = data;
      return qb;
    },
    delete: () => {
      _isDelete = true;
      return qb;
    },
    eq: (col: string, val: unknown) => {
      _filter[col] = val;
      return qb;
    },
    or: (_cond: string) => qb,
    gte: (_col: string, _val: unknown) => qb,
    lte: (_col: string, _val: unknown) => qb,
    order: (_col: string, _opts?: unknown) => qb,
    range: (from: number, to: number) => {
      _rangeFrom = from; _rangeTo = to;
      return qb;
    },
    limit: (_n: number) => qb,
    maybeSingle: () => {
      _isMaybeSingle = true;
      return execute();
    },
    single: () => {
      _isSingle = true;
      return execute();
    },
    then: (resolve: (v: unknown) => void) => {
      resolve(execute());
    },
  };

  function execute(): { data: unknown; error: unknown; count?: number } {
    if (tableName === 'reports') {
      // INSERT
      if (_insertData) {
        const rec = { ..._insertData, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), version: 1 };
        store[(rec as Record<string, unknown>).id as string] = rec;
        if (_isSingle || _isMaybeSingle) return { data: rec, error: null };
        return { data: [rec], error: null };
      }
      // UPDATE
      if (_updateData) {
        const id = _filter['id'] as string;
        if (!store[id]) return { data: null, error: { message: 'Not found' } };
        store[id] = { ...store[id], ..._updateData };
        if (_isSingle || _isMaybeSingle) return { data: store[id], error: null };
        return { data: [store[id]], error: null };
      }
      // DELETE
      if (_isDelete) {
        const id = _filter['id'] as string;
        delete store[id];
        return { data: null, error: null };
      }
      // SELECT single
      if (_isMaybeSingle || _isSingle) {
        const id = _filter['id'] as string;
        if (id) return { data: store[id] ?? null, error: null };
        // filter by other fields
        const found = Object.values(store).find((r) => {
          return Object.entries(_filter).every(([k, v]) => r[k] === v);
        });
        return { data: found ?? null, error: null };
      }
      // SELECT list
      let rows = Object.values(store).filter((r) => {
        return Object.entries(_filter).every(([k, v]) => r[k] === v);
      });
      const count = rows.length;
      rows = rows.slice(_rangeFrom, _rangeTo + 1);
      return { data: rows, error: null, count };
    }

    if (tableName === 'report_activity') {
      if (_insertData) {
        const rec = { ..._insertData, created_at: new Date().toISOString() };
        activityStore.push(rec);
        return { data: rec, error: null };
      }
      const filtered = activityStore.filter((a) => {
        return Object.entries(_filter).every(([k, v]) => (a as Record<string, unknown>)[k] === v);
      });
      return { data: filtered, error: null };
    }

    if (tableName === 'sync_operations') {
      if (_insertData) {
        const rec = { ..._insertData, created_at: new Date().toISOString() };
        syncStore.push(rec);
        return { data: rec, error: null };
      }
      if (_updateData) {
        const id = _filter['id'] as string;
        const idx = syncStore.findIndex((s) => (s as Record<string, unknown>).id === id);
        if (idx >= 0) syncStore[idx] = { ...syncStore[idx], ..._updateData };
        return { data: syncStore[idx] ?? null, error: null };
      }
      return { data: syncStore, error: null };
    }

    return { data: null, error: null };
  }

  // Allow await on the builder itself (for cases without .single()/.maybeSingle())
  Object.assign(qb, {
    [Symbol.toStringTag]: 'Promise',
    then: (resolve: (v: unknown) => void) => Promise.resolve(execute()).then(resolve),
  });

  return qb;
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: (tableName: string) => buildQueryBuilder(tableName),
  })),
}));

export { store, activityStore, syncStore };

