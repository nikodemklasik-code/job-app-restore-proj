import type { Connection } from 'mysql2/promise';

const CLOSED_LIKE_CODES = new Set([
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'ER_SERVER_SHUTDOWN',
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
]);

function isClosedLikeError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { fatal?: boolean; code?: string; message?: string };
  if (e.fatal === true) return true;
  if (typeof e.code === 'string' && CLOSED_LIKE_CODES.has(e.code)) return true;
  const msg = typeof e.message === 'string' ? e.message.toLowerCase() : '';
  return (
    msg.includes('connection lost') ||
    msg.includes('server has gone away') ||
    msg.includes('econnrefused') ||
    msg.includes('connect timeout') ||
    msg.includes('getaddrinfo')
  );
}

/**
 * When MySQL closes the TCP session (idle timeout, restart, network blip) or the
 * server becomes unreachable mid-process, mysql2 emits `error` on the connection.
 * Without handling it, Node can exit unpredictably or keep a dead handle.
 * We log and exit so PM2/systemd can restart cleanly.
 */
export function attachMysqlClosedStateGuard(connection: Connection): void {
  const flagged = connection as Connection & { __mysqlClosedGuard?: boolean };
  if (flagged.__mysqlClosedGuard) return;
  flagged.__mysqlClosedGuard = true;

  connection.on('error', (err: unknown) => {
    if (!isClosedLikeError(err)) {
      console.error('[mysql] connection error (non-closed-state):', err);
      return;
    }
    console.error('[mysql] connection closed or fatal server state — exiting for supervised restart', err);
    if (process.env.NODE_ENV === 'test') return;
    process.exit(1);
  });
}
