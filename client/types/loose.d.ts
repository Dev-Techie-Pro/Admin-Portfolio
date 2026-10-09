// @ts-nocheck
/** Incremental typing shim — replace with stricter types per module over time. */
export type PaJson = Record<string, unknown>;

export interface PaStoreLike {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  subscribe?(key: string, cb: (value: unknown) => void): () => void;
}

export interface PaEventBusLike {
  on(event: string, handler: (...args: unknown[]) => void): void;
  off?(event: string, handler: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
}

export interface PaModuleHost {
  store?: PaStoreLike;
  bus?: PaEventBusLike;
  state?: PaJson;
  el?: HTMLElement | null;
  root?: HTMLElement | null;
}
