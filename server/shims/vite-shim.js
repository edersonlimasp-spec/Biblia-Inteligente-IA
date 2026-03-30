// Production shim for 'vite' — never called in production, only imported
const noop = () => {};
const logger = {
  info: noop, warn: noop, warnOnce: noop, error: noop,
  hasWarned: false, clearScreen: noop,
};
export const createLogger = () => logger;
export const createServer = async () => ({
  middlewares: { use: noop },
  transformIndexHtml: async (_, t) => t || '',
  ssrFixStacktrace: noop,
  close: async () => {},
});
export const defineConfig = (c) => c;
export const loadConfigFromFile = async () => null;
