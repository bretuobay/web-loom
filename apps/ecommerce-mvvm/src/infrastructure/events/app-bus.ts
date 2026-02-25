import { createEventBus } from '@web-loom/event-bus-core';

interface AppEventMap extends Record<string, any[] | undefined> {
  'catalog:reloaded': [count: number];
  'cart:item-added': [productId: string, quantity: number];
  'cart:updated': [itemCount: number, subtotalCents: number];
  'checkout:completed': [orderId: string, totalCents: number];
}

export const appBus = createEventBus<AppEventMap>();
