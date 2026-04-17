import type { StockRecord } from "../types/inventory.types";
import { TTLCache } from "./memory.cache";

export const stockCache = new TTLCache<StockRecord>();
