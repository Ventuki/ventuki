export const inventoryLogger = {
  error(message: string, data?: unknown) {
    console.error(`[INVENTORY][ERROR] ${message}`, data);
  },
  warn(message: string, data?: unknown) {
    console.warn(`[INVENTORY][WARN] ${message}`, data);
  },
  info(message: string, data?: unknown) {
    console.info(`[INVENTORY][INFO] ${message}`, data);
  },
};
