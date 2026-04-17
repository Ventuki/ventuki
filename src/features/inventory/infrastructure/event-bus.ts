/**
 * inventoryEventBus — ahora delega al DomainEventBus global.
 * Se mantiene por retrocompatibilidad pero ya no usa window.dispatchEvent.
 */
import { domainEventBus } from "@/lib/events/domainEventBus";

export const inventoryEventBus = {
  publish<T extends { name: string; payload: unknown }>(event: T) {
    domainEventBus.publish({
      type: event.name,
      payload: event.payload,
    });
  },
};
