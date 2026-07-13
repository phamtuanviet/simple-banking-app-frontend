// src/services/api/admin/auditlog/admin.auditlog.service.ts

import type { ApiResponse } from "../../auth/auth.service";
import { axiosClient } from "../../axiosClient";

export interface FilterAuditLogDto {
  action?: string;
  entity?: string;
  email?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string;
  userAgent: string;
  beforeData: any;
  afterData: any;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    fullName: string;
  } | null;
}

export interface PaginatedAuditLog {
  total: number;
  page: number;
  limit: number;
  items: AuditLogItem[];
}

export const adminAuditLogService = {
  getAuditLogs: async (
    filters: FilterAuditLogDto,
  ): Promise<ApiResponse<PaginatedAuditLog>> => {
    return axiosClient.get("/admin/audit-logs", { params: filters }); // Thay đổi endpoint cho khớp backend của bạn
  },
};
