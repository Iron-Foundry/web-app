export type PermAction = "read" | "create" | "edit" | "delete";

export interface PagePermissionConfig {
  read: string[];
  create: string[];
  edit: string[];
  delete: string[];
}

export interface RegisteredPage {
  id: string;
  label: string;
  description?: string;
  defaults: PagePermissionConfig;
}
