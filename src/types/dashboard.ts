export interface Session {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface Url {
  id: number;
  shortCode: string;
  originalUrl: string;
  customAlias: string | null;
  shortUrl: string;
  expiryDate: string | null;
  createdAt: string;
  updatedAt?: string;
  clickCount?: number;
  version?: number;
  isLatest?: boolean;
}

export interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface UrlsResponse {
  data: Url[];
  pagination: PaginationData;
}
