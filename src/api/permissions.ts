import { apiFetch } from "./client";
import type { PagePermissionConfig } from "@/types/permissions";

interface PagePermissionsResponse {
  pages: Record<string, PagePermissionConfig>;
  admin_bypass_roles: string[];
}

export const permissionsApi = {
  getPagePermissions: () => apiFetch<PagePermissionsResponse>("/config/page-permissions"),

  updatePagePermissions: (data: PagePermissionsResponse) =>
    apiFetch<void>("/config/page-permissions", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
