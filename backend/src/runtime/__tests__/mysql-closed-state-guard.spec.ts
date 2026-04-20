import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Connection } from 'mysql2/promise';
import { attachMysqlClosedStateGuard } from '../mysql-closed-state-guard.js';

describe('attachMysqlClosedStateGuard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function mockConnection(): Connection {
    return new EventEmitter() as unknown as Connection;
  }

  it('exits on fatal closed-state errors outside test', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const conn = mockConnection();
    attachMysqlClosedStateGuard(conn);
    conn.emit(
      'error',
      Object.assign(new Error('Connection lost: The server closed the connection.'), {
        fatal: true,
        code: 'PROTOCOL_CONNECTION_LOST',
      }),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('does not exit in test environment', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const exitSpy = vi.spyOn(process, 'exit');
    const conn = mockConnection();
    attachMysqlClosedStateGuard(conn);
    conn.emit(
      'error',
      Object.assign(new Error('gone away'), { fatal: true, code: 'ER_SERVER_SHUTDOWN' }),
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('does not exit on unrelated non-fatal errors', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const exitSpy = vi.spyOn(process, 'exit');
    const conn = mockConnection();
    attachMysqlClosedStateGuard(conn);
    conn.emit('error', Object.assign(new Error('syntax'), { fatal: false, code: 'ER_PARSE_ERROR' }));
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits on ECONNREFUSED-style closed/unavailable errors outside test', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const conn = mockConnection();
    attachMysqlClosedStateGuard(conn);
    conn.emit(
      'error',
      Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:3306'), { fatal: true, code: 'ECONNREFUSED' }),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
