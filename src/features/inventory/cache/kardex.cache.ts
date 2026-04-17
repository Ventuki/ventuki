import type { MovementRecord } from "../types/movement.types";
import { TTLCache } from "./memory.cache";

export const kardexCache = new TTLCache<MovementRecord[]>();
