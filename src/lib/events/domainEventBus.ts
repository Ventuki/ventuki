/**
 * Global Domain Event Bus — único mecanismo de eventos para toda la aplicación.
 * Reemplaza: window.CustomEvent DOM, inventoryEventBus separado, retornos directos.
 *
 * Uso:
 *   import { domainEventBus } from '@/lib/events/domainEventBus';
 *   domainEventBus.publish({ type: 'sale.completed', payload: ... });
 *   domainEventBus.subscribe('sale.completed', handler);
 */

export interface DomainEvent<T = unknown> {
  type: string;
  occurredAt: string;
  payload: T;
}

type EventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;

class DomainEventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  publish<T>(event: Omit<DomainEvent<T>, "occurredAt">): void {
    const full: DomainEvent<T> = {
      ...event,
      occurredAt: new Date().toISOString(),
    };

    // Notify typed subscribers
    const typed = this.handlers.get(event.type);
    if (typed) {
      typed.forEach((h) => {
        try {
          void h(full as DomainEvent);
        } catch (err) {
          console.error(`[EventBus] handler error for ${event.type}:`, err);
        }
      });
    }

    // Notify wildcard subscribers
    const wildcard = this.handlers.get("*");
    if (wildcard) {
      wildcard.forEach((h) => {
        try {
          void h(full as DomainEvent);
        } catch (err) {
          console.error(`[EventBus] wildcard handler error:`, err);
        }
      });
    }

    // Browser custom event for legacy/devtools compatibility (non-blocking)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("domain:event", { detail: full }));
    }
  }

  subscribe<T>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  /** Subscribe to all events (for logging / analytics) */
  subscribeAll(handler: EventHandler): () => void {
    return this.subscribe("*", handler);
  }

  /** Remove all handlers for a type (useful in tests) */
  clear(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }
}

export const domainEventBus = new DomainEventBus();
