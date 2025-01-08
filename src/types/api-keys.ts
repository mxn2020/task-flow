// types/api-keys.ts

export interface APIKeyPermissions {
  read: boolean;
  write: boolean;
}

export interface APIKey {
  id: string;
  name: string;
  prefix: string;
  permissions: APIKeyPermissions;
  rateLimit: number;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface CreateAPIKeyRequest {
  name: string;
  permissions: APIKeyPermissions;
  rateLimit: number;
  expiresInDays: number | null;
  noExpiration?: boolean;
}

export interface CreateAPIKeyResponse {
  key: string;
}

export interface APIKeyUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  endpoints: Array<{
    endpoint: string;
    count: number;
  }>;
  dailyUsage: Array<{
    date: string;
    count: number;
  }>;
}

// Database types
export interface APIKeyDB {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  prefix: string;
  permissions: APIKeyPermissions;
  rate_limit: number;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface APIKeyUsageDB {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  timestamp: string;
  error_message?: string;
  response_time?: number;
  request_body_size?: number;
  response_body_size?: number;
}

export interface NewKeyState extends CreateAPIKeyRequest {
  noExpiration: boolean;
  expiresInDays: number;
}
