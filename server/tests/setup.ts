// ─── Jest Global Setup ────────────────────────────────────────────────────────
// Sets environment variables before tests run so config loading doesn't fail.

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.PORT = '4001';
process.env.CORS_ORIGINS = 'http://localhost:3000';

