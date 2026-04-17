export const invoiceLogger = {
  error(message: string, context?: Record<string, unknown>) {
    console.error(`[invoicing] ${message}`, context ?? {});
  },
  warn(message: string, context?: Record<string, unknown>) {
    console.warn(`[invoicing] ${message}`, context ?? {});
  },
  info(message: string, context?: Record<string, unknown>) {
    console.info(`[invoicing] ${message}`, context ?? {});
  },
};
