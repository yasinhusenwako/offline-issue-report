import app from './app';
import { config } from './config/env';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 InfraSync API Server`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Port:        ${PORT}`);
  console.log(`   Health:      http://localhost:${PORT}/api/health`);
  console.log(`   ⚠️  Dev roles active (not for production)\n`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
function shutdown(signal: string): void {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  process.exit(1);
});

export default server;

