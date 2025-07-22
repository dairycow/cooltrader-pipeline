export interface EODData {
  symbol: string;
  date: string; // MM/DD/YYYY format from CSV
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NormalizedEODData {
  symbol: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PipelineConfig {
  username: string;
  password: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

export interface FetchOptions {
  symbols?: string[];
  date?: string;
  startDate?: string;
  endDate?: string;
  format?: 'csv' | 'json';
}

export interface AuthSession {
  token?: string;
  cookies?: string[];
  expiresAt?: Date;
  isValid: boolean;
}

export interface ParsedCSVRow {
  symbol: string;
  date: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface HistoricalDataRequest {
  startDate: string;
  endDate: string;
  symbols?: string[];
}

export interface BulkDataResult {
  data: NormalizedEODData[];
  metadata: {
    totalRecords: number;
    dateRange: {
      start: string;
      end: string;
    };
    symbols: string[];
  };
}

export type DataFormat = 'csv' | 'json';
export type FetchMode = 'daily' | 'historical';