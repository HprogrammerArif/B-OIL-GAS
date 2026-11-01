/**
 * Single logging entry point. Keeps console noise out of production builds
 * without every call site needing its own `if (__DEV__)` check.
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (__DEV__) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (__DEV__) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // Errors are worth keeping in production logs (device log / crash tooling),
    // unlike routine debug/info output.
    console.error(...args);
  },
};
