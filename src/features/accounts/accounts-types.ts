export interface UserSessionListItem {
  id: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  isCurrent: boolean;
}
