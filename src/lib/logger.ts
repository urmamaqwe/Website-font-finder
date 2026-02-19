/* ===================================================================
   FontFinder — Comprehensive Logging System
   Server + Client compatible logger with structured output.
   =================================================================== */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
  duration?: number;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum level based on env (production = info, dev = debug)
const MIN_LEVEL: LogLevel =
  process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// In-memory log buffer (last 200 entries) for the /api/logs endpoint
const LOG_BUFFER: LogEntry[] = [];
const MAX_BUFFER = 200;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function pushBuffer(entry: LogEntry) {
  LOG_BUFFER.push(entry);
  if (LOG_BUFFER.length > MAX_BUFFER) {
    LOG_BUFFER.shift();
  }
}

function formatForConsole(entry: LogEntry): string {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}]`;
  const dur = entry.duration != null ? ` (${entry.duration}ms)` : '';
  return `${prefix} ${entry.message}${dur}`;
}

/**
 * Create a scoped logger for a specific module.
 */
export function createLogger(module: string) {
  function log(level: LogLevel, message: string, data?: Record<string, unknown>, duration?: number) {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
      duration,
    };

    pushBuffer(entry);

    const formatted = formatForConsole(entry);
    switch (level) {
      case 'debug':
        console.debug(formatted, data ?? '');
        break;
      case 'info':
        console.info(formatted, data ?? '');
        break;
      case 'warn':
        console.warn(formatted, data ?? '');
        break;
      case 'error':
        console.error(formatted, data ?? '');
        break;
    }
  }

  return {
    debug: (msg: string, data?: Record<string, unknown>) => log('debug', msg, data),
    info: (msg: string, data?: Record<string, unknown>) => log('info', msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => log('warn', msg, data),
    error: (msg: string, data?: Record<string, unknown>) => log('error', msg, data),
    /** Log with duration tracking */
    timed: (msg: string, durationMs: number, data?: Record<string, unknown>) =>
      log('info', msg, data, durationMs),
  };
}

/**
 * Get the in-memory log buffer (for /api/logs).
 */
export function getLogBuffer(): LogEntry[] {
  return [...LOG_BUFFER];
}

/**
 * Clear the log buffer.
 */
export function clearLogBuffer() {
  LOG_BUFFER.length = 0;
}

/**
 * Timer helper — returns a function that logs elapsed time.
 */
export function startTimer(logger: ReturnType<typeof createLogger>, message: string) {
  const start = Date.now();
  return (data?: Record<string, unknown>) => {
    const duration = Date.now() - start;
    logger.timed(message, duration, data);
    return duration;
  };
}
