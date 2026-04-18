// Page permission registry — each route registers itself here at module load time.

export type PermAction = "read" | "edit" | "delete";

export interface PagePermissionConfig {
  read: string[];
  edit: string[];
  delete: string[];
}

export interface RegisteredPage {
  id: string;
  label: string;
  description?: string;
  /** Defaults used when no DB config exists for this page. */
  defaults: PagePermissionConfig;
}

const _registry = new Map<string, RegisteredPage>();

/** Called once per route module (at import time) to register the page. */
export function registerPage(config: RegisteredPage): void {
  _registry.set(config.id, config);
}

/** Returns all registered pages, sorted by id. */
export function getPageRegistry(): RegisteredPage[] {
  return Array.from(_registry.values()).sort((a, b) => a.id.localeCompare(b.id));
}
