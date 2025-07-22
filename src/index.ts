import { AuthService } from './auth/auth-service.js';
import { DataFetcher } from './fetchers/data-fetcher.js';
import { CSVParser } from './parsers/csv-parser.js';
import { 
  PipelineConfig, 
  NormalizedEODData, 
  FetchOptions, 
  BulkDataResult 
} from './types/index.js';

export class EODPipeline {
  private authService: AuthService;
  private dataFetcher: DataFetcher;
  private config: PipelineConfig;

  constructor(config: PipelineConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      cacheEnabled: false,
      cacheTTL: 3600000, // 1 hour
      ...config
    };

    this.authService = new AuthService(this.config);
    this.dataFetcher = new DataFetcher(this.authService);
  }

  /**
   * Fetch EOD data for a specific date
   */
  async fetchDaily(date: string, options?: FetchOptions): Promise<NormalizedEODData[]> {
    return await this.dataFetcher.fetchDaily(date, options);
  }

  /**
   * Fetch historical EOD data for a date range
   */
  async fetchHistorical(startDate: string, endDate: string, options?: FetchOptions): Promise<BulkDataResult> {
    return await this.dataFetcher.fetchHistorical(startDate, endDate, options);
  }

  /**
   * Fetch data for specific symbols on a specific date
   */
  async fetchSymbols(symbols: string[], date: string): Promise<NormalizedEODData[]> {
    return await this.fetchDaily(date, { symbols });
  }

  /**
   * Test connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.authService.ensureAuthenticated();
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Manually login (usually not needed as it's done automatically)
   */
  async login(): Promise<boolean> {
    return await this.authService.login();
  }

  /**
   * Logout and cleanup
   */
  async logout(): Promise<void> {
    await this.authService.logout();
  }

  /**
   * Get authentication status
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Get current session information
   */
  getSession() {
    return this.authService.getSession();
  }

  /**
   * Parse CSV content directly (utility method)
   */
  static parseCSV(csvContent: string): NormalizedEODData[] {
    const rawData = CSVParser.parseCSV(csvContent);
    return CSVParser.normalize(rawData);
  }

  /**
   * Validate EOD data format
   */
  static validateData(data: any): boolean {
    return CSVParser.validate(data);
  }
}

// Export types for consumers
export * from './types/index.js';

// Default export
export default EODPipeline;