export const posLogger = {
  error(message: string, data?: unknown) {
    console.error(`[POS][ERROR] ${message}`, data);
  },
  warn(message: string, data?: unknown) {
    console.warn(`[POS][WARN] ${message}`, data);
  },
  info(message: string, data?: unknown) {
    console.info(`[POS][INFO] ${message}`, data);
  },
};
